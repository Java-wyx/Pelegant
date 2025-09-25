import http from "./http";
import { useAuthStore } from '@/store/authStore';
export interface MenuItem {
  name: string;
  path: string;
  icon?: string;
  permission?: string;
  children?: MenuItem[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: number;
  username: string;
  nickname?: string;
  email?: string;
  mobile?: string;
  sex?: number;
  avatar?: string;
  loginIp?: string;
  loginDate?: number;
  createTime?: string;
  status?: number;
  role: string;
  roles?: Role[];
  permissions?: string[];
  menus?: MenuItem[];
  accessToken: string;
  refreshToken: string;
  expiresTime: number;
  needChangePassword: boolean;
  token?: string;
}

export interface Role {
  id: string; // 修改为字符串类型，匹配MongoDB ObjectId
  name: string;
  code: string;
  sort?: number;
  remark?: string;
  menuIds: string[]; // 修改为字符串数组，匹配后端权限列表
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  type: number;
  path?: string;
  icon?: string;
  sort?: number;
}

export interface RoleListResponse {
  list: Role[];
  total: number;
  pageNo: number;
  pageSize: number;
}

export interface RoleFormData extends Omit<Role, 'id' | 'menuIds'> {
  id?: string; // 修改为字符串类型
  menuIds?: string[]; // 修改为字符串数组，匹配后端权限列表
}

export interface PermissionInfoResponse {
  permissions: string[];
  roles: Role[];
}

export const login = async (requestData: LoginRequest): Promise<LoginResponse> => {
  const response = await http.post('/api/teachers/login-json',
    requestData
  );

  if (response.status < 200 || response.status >= 300) {
    throw new Error('Login failed');
  }

  const responseData = response.data;

  // Check if the response is successful
  if (!responseData.success) {
    throw new Error(responseData.message || 'Login failed');
  }

  const loginData = responseData.data;

  // Ensure required fields exist
  if (!loginData.token) {
    throw new Error('No token received from server');
  }

  // Transform the response to match the expected format
  const transformedResponse: LoginResponse = {
    userId: parseInt(loginData.userId) || 0,
    username: loginData.username || '',
    email: requestData.email,
    role: loginData.role || 'teacher',
    accessToken: loginData.token,
    refreshToken: loginData.token,
    expiresTime: loginData.expiresAt || Date.now() + 7 * 24 * 60 * 60 * 1000,
    needChangePassword: false,
    token: loginData.token
  };

  return transformedResponse;
};

export const getPermissionInfo = async (): Promise<PermissionInfoResponse> => {
  try {
    // 获取教师个人信息以获取实际角色
    const userProfile = await getUserProfile();
    const teacherRole = userProfile.roleIds?.[0] || 'teacher';

    // 根据教师角色返回相应的权限和角色信息（使用英文名称）
    const roleDefinitions: Record<string, { name: string; permissions: string[] }> = {
      'Administrator': {
        name: 'Administrator',
        permissions: [
          "students.manage",
          "statistics.view",
          "student.data.view",
          "student.data.edit",
          "pelegant:company:query",
          "partnerships.view",
          "partnerships.edit",
          "pelegant:statistics:view",
          "data.analyze",
          "basic.view",
          "system:user:list"
        ]
      },
      'Teacher': {
        name: 'Teacher',
        permissions: [
          "students.manage",
          "statistics.view",
          "student.data.view",
          "student.data.edit",
          "basic.view"
        ]
      },
      'teacher': {
        name: 'Teacher',
        permissions: [
          "students.manage",
          "statistics.view",
          "student.data.view",
          "student.data.edit",
          "basic.view"
        ]
      }
    };

    const roleInfo = roleDefinitions[teacherRole] || roleDefinitions['teacher'];

    return {
      permissions: roleInfo.permissions,
      roles: [{
        id: teacherRole,
        name: roleInfo.name,
        code: teacherRole.toLowerCase(),
        sort: 0,
        remark: `${roleInfo.name} role`,
        menuIds: []
      }]
    };
  } catch (error) {
    console.error('Error fetching permission info:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // 返回默认权限，避免阻塞登录流程
    return {
      permissions: ['basic.view', 'students.manage', 'statistics.view'],
      roles: [{
        id: 'teacher',
        name: 'Teacher',
        code: 'teacher',
        sort: 0,
        remark: 'Default teacher role',
        menuIds: []
      }]
    };
  }
};

// Role API endpoints - 使用教师角色管理API
const TEACHER_ROLES_BASE = '/api/teachers/roles';

export const fetchRoles = async (pageNo: number = 1, pageSize: number = 10): Promise<RoleListResponse> => {
  const response = await http.get(TEACHER_ROLES_BASE);

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to fetch roles');
  }

  const roles = response.data.data || [];

  // 转换为前端期望的格式
  const transformedRoles = roles.map((role: any) => ({
    id: role.id || '', // 保持字符串格式
    name: role.roleName || '',
    code: role.roleName || '',
    remark: role.description || '',
    menuIds: role.permissions || [], // 保持字符串数组格式
    sort: 0
  }));

  return {
    list: transformedRoles,
    total: transformedRoles.length,
    pageNo: 1,
    pageSize: transformedRoles.length
  };
};

export const createRole = async (roleData: {
  name: string;
  code: string;
  sort: number;
}): Promise<Role> => {
  const requestData = {
    roleName: roleData.name,
    description: roleData.code, // 使用code作为描述
    permissions: ["basic.view"] // 默认权限
  };

  const response = await http.post(TEACHER_ROLES_BASE, requestData);

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to create role');
  }

  const createdRole = response.data.data;

  // 转换为前端期望的格式
  return {
    id: createdRole.id || '', // 保持字符串格式，不要转换为数字
    name: createdRole.roleName || '',
    code: createdRole.roleName || '',
    remark: createdRole.description || '',
    menuIds: createdRole.permissions || [], // 保持字符串数组格式
    sort: 0
  };
};

export const updateRole = async (roleData: RoleFormData): Promise<Role> => {
  const requestData = {
    roleName: roleData.name,
    description: roleData.remark || roleData.code,
    permissions: roleData.menuIds || ["basic.view"]
  };

  const response = await http.put(`${TEACHER_ROLES_BASE}/${roleData.id}`, requestData);

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to update role');
  }

  const updatedRole = response.data.data;

  // 转换为前端期望的格式
  return {
    id: updatedRole.id || roleData.id || '', // 保持字符串格式
    name: updatedRole.roleName || '',
    code: updatedRole.roleName || '',
    remark: updatedRole.description || '',
    menuIds: updatedRole.permissions || [], // 保持字符串数组格式
    sort: 0
  };
};

// 删除角色API
export const deleteRole = async (roleId: string): Promise<void> => {
  const response = await http.delete(`${TEACHER_ROLES_BASE}/${roleId}`);
  console.log(response.data.message)

  if (!response.data?.success) {
    throw new Error(response.data.message || 'Failed to delete role');
  }
};

export interface User {
  id: number;
  username: string;
  nickname: string;
  email: string;
  mobile: string;
  sex: number;
  avatar: string;
  loginIp: string;
  loginDate: number;
  createTime: string;
  status: number;
  roleIds: string[];
  dept: {
    id: number;
    name: string;
  } | null;
  posts: {
    id: number;
    name: string;
  }[] | null;
  socialUsers: {
    id: number;
    type: string;
    openid: string;
  }[];
}

export interface UserListResponse {
  list: User[];
  total: number;
  pageNo: number;
  pageSize: number;
}

// 教师用户管理API
const TEACHER_USERS_BASE = '/api/teachers/users';

export const fetchUsers = async (pageNo: number = 1, pageSize: number = 10): Promise<UserListResponse> => {
  const response = await http.get(TEACHER_USERS_BASE);

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to fetch users');
  }

  const users = response.data.data || [];

  // 转换为前端期望的格式
  const transformedUsers = users.map((user: any) => ({
    id: user.teacherId || user.id || '', // 优先使用teacherId作为标识
    username: user.name || '',
    email: user.email || '',
    role: user.role || '',
    status: 'active'
  }));

  return {
    list: transformedUsers,
    total: transformedUsers.length,
    pageNo: 1,
    pageSize: transformedUsers.length
  };
};

export const createUser = async (userData: {
  username: string;
  email: string;
  role: string;
  password: string;
}): Promise<User> => {
  const requestData = {
    name: userData.username,
    email: userData.email,
    role: userData.role
    // 不再传递schoolId，后端会自动使用当前教师的学校ID
  };

  const response = await http.post(TEACHER_USERS_BASE, requestData);

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to create user');
  }

  const createdUser = response.data.data;

  // 转换为前端期望的格式
  return {
    id: createdUser.teacherId || createdUser.id || '', // 优先使用teacherId
    username: createdUser.name || '',
    email: createdUser.email || '',
    role: createdUser.role || '',
    status: 'active'
  };
};

export const updateUser = async (userData: {
  id: string; // 修改为字符串类型
  username: string;
  email: string;
  role: string;
  status: number;
}): Promise<User> => {
  const requestData = {
    name: userData.username,
    email: userData.email,
    role: userData.role,
    schoolId: null // 可以根据需要设置
  };

  const response = await http.put(`${TEACHER_USERS_BASE}/${userData.id}`, requestData);

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to update user');
  }

  const updatedUser = response.data.data;

  // 转换为前端期望的格式
  return {
    id: updatedUser.teacherId || updatedUser.id || userData.id, // 优先使用teacherId
    username: updatedUser.name || '',
    email: updatedUser.email || '',
    role: updatedUser.role || '',
    status: 'active'
  };
};

// 删除用户API
export const deleteUser = async (userId: string): Promise<void> => {
  const response = await http.delete(`${TEACHER_USERS_BASE}/${userId}`);

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to delete user');
  }
};

export const assignUserRole = async (userId: number, roleIds: number[]): Promise<void> => {
  await http.post('/system/permission/assign-user-role', {
    userId,
    roleIds
  });
};

export const assignRoleMenu = async (roleId: string, menuIds: string[]): Promise<void> => {
  await http.post('/system/permission/assign-role-menu', {
    roleId,
    menuIds
  });
};



export const getUserProfile = async (): Promise<User> => {
  try {
    const response = await http.get('/api/teachers/profile');
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to get user profile');
    }

    const teacherData = response.data.data;
      const backendUrl = window.location.origin.replace(/:\d+$/, ":8080");  // 将端口替换为后端端口
      const avatarFile = `${backendUrl}/api/files${teacherData.avatarPath.replace(/\\/g, '/')}`;
      console.log(avatarFile)

    // 转换为前端期望的User格式
    const user: User = {
      id: parseInt(teacherData.id) || 0,
      username: teacherData.name || '',
      nickname: teacherData.name || '',
      email: teacherData.email || '',
      mobile: '',
      sex: 0,
      avatar: avatarFile || '',
      loginIp: '',
      loginDate: Date.now(),
      createTime: new Date().toISOString(),
      status: 1,
      roleIds: [teacherData.role || 'teacher'],
      dept: null,
      posts: null,
      socialUsers: []
    };

    // 返回数据到调用函数
    return user;

  } catch (error) {
    console.error("Error fetching user profile:", error);
    throw error;
  }
};

// 更新用户个人信息
export const updateUserProfile = async (profileData: {
  nickname?: string;
  email?: string;
  phone?: string;
  gender?: number;
}): Promise<User> => {
  // 转换为后端期望的格式
  const requestData = {
    name: profileData.nickname, // 后端期望name字段
    avatarPath: null // 暂时不支持头像更新
  };

  const response = await http.put('/api/teachers/profile', requestData);
  

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to update profile');
  }

  const teacherData = response.data.data;
    const backendUrl = window.location.origin.replace(/:\d+$/, ":8080");  // 将端口替换为后端端口
      const avatarFile = `${backendUrl}/api/files${teacherData.avatarPath.replace(/\\/g, '/')}`;
      console.log(avatarFile)

  // 转换为前端期望的User格式
  const user: User = {
    id: parseInt(teacherData.id) || 0,
    username: teacherData.name || '',
    nickname: teacherData.name || '',
    email: teacherData.email || '',
    mobile: '',
    sex: 0,
    avatar: avatarFile || '',
    loginIp: '',
    loginDate: Date.now(),
    createTime: new Date().toISOString(),
    status: 1,
    roleIds: [teacherData.role || 'teacher'],
    dept: null,
    posts: null,
    socialUsers: []
  };

  return user;
};

// 更新用户密码
export const updateUserPassword = async (passwordData: {
  oldPassword: string;
  newPassword: string;
}): Promise<void> => {
  // 转换为后端期望的格式
  const requestData = {
    currentPassword: passwordData.oldPassword,
    newPassword: passwordData.newPassword,
    confirmPassword: passwordData.newPassword // 前端已经验证过确认密码
  };

  const response = await http.put('/api/teachers/password', requestData);

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to update password');
  }
};

export const logout = async (): Promise<void> => {
  const response = await http.post('/system/auth/logout');
  if (response.data?.code && response.data.code !== 200) {
    throw new Error(response.data.msg || 'Failed to logout');
  }
};

// API配置和基础请求函数
const API_BASE_URL = '/api';

// API响应类型定义
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  code?: number;
  total:number;
}

// 登录请求类型
export interface LoginRequest {
  email: string;
  password: string;
}

// 登录响应类型
export interface LoginResponse {
  token: string;
  userId: string;
  username: string;
  role: string;
  expiresAt: number;
  userInfo: any;
}

// 用户信息类型
export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  status: string;
}

// 密码修改请求类型
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// HTTP请求配置
interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
}

// 基础请求函数
async function request<T>(endpoint: string, config: RequestConfig): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...config.headers,
  };

  // 如果有token，添加到请求头
  const token = getAuthToken();
  if (token) {
    headers['project'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method: config.method,
      headers,
      body: config.body ? JSON.stringify(config.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Token管理函数
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

export function removeAuthToken(): void {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_info');
}

export function getUserInfo(): UserInfo | null {
  const userInfoStr = localStorage.getItem('user_info');
  return userInfoStr ? JSON.parse(userInfoStr) : null;
}

export function setUserInfo(userInfo: UserInfo): void {
  localStorage.setItem('user_info', JSON.stringify(userInfo));
}

// 检查token是否过期
export function isTokenExpired(): boolean {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (!expiresAt) return true;
  
  return Date.now() > parseInt(expiresAt);
}

// API接口函数
export const api = {
  // 项目管理员登录
  projectLogin: async (loginData: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return request<LoginResponse>('/projects/login-json', {
      method: 'POST',
      body: loginData,
    });
  },

  // 获取所有学校
  getSchools: async (): Promise<ApiResponse<any[]>> => {
    return request<any[]>('/projects/schools', {
      method: 'GET',
    });
  },

  // 获取所有学生
  getStudents: async (): Promise<ApiResponse<any[]>> => {
    return request<any[]>('/projects/students', {
      method: 'GET',
    });
  },

  // 根据ID获取学生详情
  getStudentById: async (studentId: string): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/students/${studentId}`, {
      method: 'GET',
    });
  },

  // 获取学生简历信息 (项目管理员权限)
  getStudentResume: async (studentId: string): Promise<ApiResponse<any>> => {
    return request<any>(`/students/resume/${studentId}`, {
      method: 'GET',
    });
  },

  // 获取所有企业
  getCompanies: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    industry?: string;
    companyType?: string;
    status?: string;
  }): Promise<ApiResponse<any[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.industry) queryParams.append('industry', params.industry);
    if (params?.companyType) queryParams.append('companyType', params.companyType);
    if (params?.status) queryParams.append('status', params.status);

    const url = `/projects/companies${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<any[]>(url, {
      method: 'GET',
    });
  },

  // 根据ID获取企业详情
  getCompanyById: async (companyId: string): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/companies/${companyId}`, {
      method: 'GET',
    });
  },

  // 获取企业统计信息
  getCompanyStats: async (): Promise<ApiResponse<any>> => {
    return request<any>('/projects/companies/stats', {
      method: 'GET',
    });
  },

  // 根据名称搜索企业
  searchCompaniesByName: async (name: string): Promise<ApiResponse<any[]>> => {
    return request<any[]>(`/projects/companies/search?name=${encodeURIComponent(name)}`, {
      method: 'GET',
    });
  },

  // 创建企业
  createCompany: async (companyData: {
    companyName: string;
    industry: string;
    companyType: string;
    companyAddress: string;
    contactPerson: string;
    contactPhone?: string;
    contactEmail?: string;
    status?: string;
  }): Promise<ApiResponse<any>> => {
    return request<any>('/projects/companies', {
      method: 'POST',
      body: companyData,
    });
  },


    // 更新企业
  updateEnterprise: async (companyId:string,companyData: {
    companyName: string;
    industry: string;
    companyType: string;
    companyAddress: string;
    contactPerson: string;
    contactPhone?: string;
    contactEmail?: string;
    status?: string;
  }): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/companies/${companyId}`, {
      method: 'PUT',
      body: companyData,
    });
  },


  // 获取所有职位
  getJobs: async (params?: {
    page?: number;
    size?: number;
    search?: string;
    jobType?: string;
    companyId?: string;
    status?: string;
  }): Promise<ApiResponse<any[]>> => {
    const queryParams = new URLSearchParams();
    if (params?.page !== undefined) queryParams.append('page', params.page.toString());
    if (params?.size !== undefined) queryParams.append('size', params.size.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.jobType) queryParams.append('jobType', params.jobType);
    if (params?.companyId) queryParams.append('companyId', params.companyId);
    if (params?.status) queryParams.append('status', params.status);

    const url = `/projects/jobs${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return request<any[]>(url, {
      method: 'GET',
    });
  },

  // 根据ID获取职位详情
  getJobById: async (jobId: string): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/jobs/${jobId}`, {
      method: 'GET',
    });
  },

  // 更新职位信息
  updateJob: async (jobId: string, jobData: any): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/jobs/${jobId}`, {
      method: 'PUT',
      body: jobData,
    });
  },

  // 获取职位统计信息
  getJobStats: async (): Promise<ApiResponse<any>> => {
    return request<any>('/projects/jobs/stats', {
      method: 'GET',
    });
  },

  // 创建职位
  createJob: async (jobData: {
    jobTitle: string;
    jobDescription: string;
    jobRequirements?: string;
    benefits?: string;
    jobType: string;
    workLocation: string;
    minSalary?: number;
    maxSalary?: number;
    salaryUnit?: string;
    experienceRequired?: string;
    educationRequired?: string;
    skillsRequired?: string[];
    companyId: string;
    recruitmentCount?: number;
    deadline?: string;
  }): Promise<ApiResponse<any>> => {
    return request<any>('/projects/jobs', {
      method: 'POST',
      body: jobData,
    });
  },

  // 获取项目管理员角色
  getPRoles: async (): Promise<ApiResponse<any[]>> => {
    return request<any[]>('/projects/roles', {
      method: 'GET',
    });
  },

  // 创建项目管理员角色
  createPRole: async (roleData: any): Promise<ApiResponse<any>> => {
    return request<any>('/projects/roles', {
      method: 'POST',
      body: roleData,
    });
  },

  // 更新项目管理员角色
  updatePRole: async (roleId: string, roleData: any): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/roles/${roleId}`, {
      method: 'PUT',
      body: roleData,
    });
  },

  // 删除项目管理员角色
  deletePRole: async (roleId: string): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/roles/${roleId}`, {
      method: 'DELETE',
    });
  },

  // 修改项目管理员密码
  changePassword: async (passwordData: ChangePasswordRequest): Promise<ApiResponse<string>> => {
    return request<string>('/projects/password', {
      method: 'PUT',
      body: passwordData,
    });
  },

  // 获取所有用户
  getUsers: async (): Promise<ApiResponse<any[]>> => {
    return request<any[]>('/projects/users', {
      method: 'GET',
    });
  },

  // 创建用户
  createUser: async (userData: any): Promise<ApiResponse<any>> => {
    return request<any>('/projects/users', {
      method: 'POST',
      body: userData,
    });
  },

  // 更新用户
  updateUser: async (userId: string, userData: any): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/users/${userId}`, {
      method: 'PUT',
      body: userData,
    });
  },

  // 删除用户
  deleteUser: async (userId: string): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // ==================== 学校管理API ====================

  // 创建学校
  createSchool: async (schoolData: any): Promise<ApiResponse<any>> => {
    return request<any>('/projects/schools', {
      method: 'POST',
      body: schoolData,
    });
  },

  // 获取单个学校详情
  getSchoolById: async (schoolId: string): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/schools/${schoolId}`, {
      method: 'GET',
    });
  },

  // 更新学校信息
  updateSchool: async (schoolId: string, schoolData: any): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/schools/${schoolId}`, {
      method: 'PUT',
      body: schoolData,
    });
  },

  // 删除学校
  deleteSchool: async (schoolId: string): Promise<ApiResponse<any>> => {
    return request<any>(`/projects/schools/${schoolId}`, {
      method: 'DELETE',
    });
  },

  // 重置学校管理员密码
  resetSchoolAdminPassword: async (resetData: {
    schoolId?: string;
    schoolIds?: string[];
    batchOperation: boolean;
    resetType: 'reset' | 'initial';
  }): Promise<ApiResponse<any>> => {
    return request<any>('/projects/schools/reset-password', {
      method: 'POST',
      body: resetData,
    });
  },

  // 下载学校导入Excel模板
  downloadSchoolTemplate: async (): Promise<void> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('未找到认证令牌');
    }

    const response = await fetch(`${API_BASE_URL}/projects/schools/template`, {
      method: 'GET',
      headers: {
        'project': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('下载模板失败');
    }

    // 创建下载链接
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '学校导入模板.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // 批量导入学校Excel
  importSchoolsExcel: async (file: File): Promise<ApiResponse<any>> => {
    const token = getAuthToken();
    if (!token) {
      throw new Error('未找到认证令牌');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/projects/schools/import-excel`, {
      method: 'POST',
      headers: {
        'project': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('上传失败');
    }

    return await response.json();
  },

// 获取学校统计信息
getSchoolStats: async (): Promise<ApiResponse<any>> => {
  return request<any>('/projects/getdata-school', {
    method: 'GET',
  });
},
// 在 api.ts 中定义

  // 获取学生总览统计信息
  getStudentStats: async (): Promise<ApiResponse<any>> => {
    return request<any>('/projects/students/statistics', {
      method: 'GET',
    });
  },

  getUniversityDistribution: async (): Promise<ApiResponse<any>> => {
    return request<any>('/projects/students/university-distribution', {
      method: 'GET',
    });
  },

    getmonthlyNew: async (): Promise<ApiResponse<any>> => {
    return request<any>('/projects/students/monthly-new', {
      method: 'GET',
    });
  },

    getJobOverview:async (): Promise<ApiResponse<any>> => {
    return request<any>('/projects/api/job/overview', {
      method: 'GET',
    });
  },
     getJobDetail:async (): Promise<ApiResponse<any>> => {
    return request<any>('/projects/api/job/detail', {
      method: 'GET',
    });
  },



// api.ts


createCompaniesBulk: async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`/api/projects/import/companies`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('上传失败');
  }

  // 接口只返回字符串，用 text() 获取
  const result = await response.text();
  return result;
}

};

// 认证相关工具函数
export const auth = {
  // 登录
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.projectLogin({ email, password });
    
    if (response.success && response.data) {
      const loginData = response.data;
      
      // 保存token和用户信息
      setAuthToken(loginData.token);
      setUserInfo({
        id: loginData.userId,
        name: loginData.username,
        email: loginData.userInfo?.email || email,
        role: loginData.role,
        department: loginData.userInfo?.department,
        status: loginData.userInfo?.status || 'active',
      });
      
      // 保存token过期时间
      localStorage.setItem('token_expires_at', loginData.expiresAt.toString());
      
      return loginData;
    } else {
      throw new Error(response.message || '登录失败');
    }
  },




  // 登出
  logout: (): void => {
    removeAuthToken();
  },

  // 检查是否已登录
  isAuthenticated: (): boolean => {
    const token = getAuthToken();
    return token !== null && !isTokenExpired();
  },

  // 获取当前用户信息
  getCurrentUser: (): UserInfo | null => {
    return getUserInfo();
  },
  
};


export interface GetAllDataRes {
  success: boolean;
  message: string;
  data: {
    totalStudents: number;
    totalJobs: number;
    totalCompanies: number;
    totalSchools: number;
  };
  total: number;
}



export function getAllData(): Promise<GetAllDataRes> {
  return request<any[]>('/projects/getalldata', {
      method: 'GET',
    });
}

export const getSchoolActiveUsers = async (
  schoolName: string = '',
  page: number = 1,
  size: number = 5
): Promise<ApiResponse<any>> => {
  return request<any>(`/projects/school/activeUsers?schoolName=${encodeURIComponent(schoolName)}&page=${page}&size=${size}`, {
    method: 'GET',
  });
};


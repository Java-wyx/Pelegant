import http from "./http";
import axios from "axios";
import { useAuthStore } from "@/stores/auth";
import { useToast } from "@/hooks/use-toast";


export interface LoginParams {
  tenantName: string;
  username: string;
  password: string;
  rememberMe: boolean;
  code?: string;
  uuid?: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  dataScope: number;
  sort: number;
}

export interface Dept {
  id: number;
  name: string;
}

export interface UserInfo {
  id: number;
  username: string;
  nickname: string;
  avatar: string;
  dept: Dept;
  postIds: number[];
  roleIds: number[];
  roles: Role[];
  email: string;
  mobile: string;
  sex: number;
  status: number;
  passwordUpdateTime: string;
  createTime: string;
}

export const getProfile = async (): Promise<UserInfo> => {
  // 从认证状态中获取用户ID
  const { userId } = useAuthStore.getState();
  if (!userId) {
    throw new Error("User is not logged in.");
  }

  const response = await http.get(`/students/profile/${userId}`, {
    baseURL: "/api",
  });

  // 后端返回的是 Result<Student> 格式
  if (!response.success) {
    throw new Error(response.message || "Failed to obtain user information");
  }

  // 将Student数据转换为UserInfo格式
  const student = response.data;
  return {
    id: parseInt(student.id) || 0,
    username: student.fullName || student.email,
    nickname: student.nickname || student.fullName,
    avatar: student.avatarPath || '',
    dept: { id: 0, name: student.major || '' },
    postIds: [],
    roleIds: [],
    roles: [],
    email: student.email,
    mobile: '',
    sex: student.gender === 'Male' ? 1 : student.gender === 'Female' ? 2 : 3,
    status: student.status === 'active' ? 1 : 0,
    passwordUpdateTime: '',
    createTime: student.createdAt || ''
  };
};

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  expiresTime: number;
  userId: number;
  needChangePassword?: boolean;
  isFirstLogin?: boolean;
  hasChangedPassword?: boolean;
  hasCompletedProfile?: boolean;
}

export const login = async (params: LoginParams): Promise<LoginResult> => {
  try {
    console.log("Login request params:", params);
    const response = await http.post(
      "/students/login-json",
      {
        email: params.username,
        password: params.password,
      },
      {
        baseURL: "/api",
      }
    );
    console.log("Login response:", response);

    // 检查响应是否成功
    if (!response.success) {
      throw new Error(response.message || "login failure");
    }

    const loginData = response.data;
    const result: LoginResult = {
      accessToken: loginData.token,
      refreshToken: loginData.refreshToken || loginData.token, // 如果后端返回 refreshToken，使用它
      expiresTime: loginData.expiresAt,
      userId: loginData.userId,
      needChangePassword: false, // 后端没有这个字段，默认为 false
      isFirstLogin: loginData.isFirstLogin,
      hasChangedPassword: loginData.hasChangedPassword,
      hasCompletedProfile: loginData.hasCompletedProfile,
    };

    // 更新 Zustand store
    useAuthStore.getState().login(
      result.accessToken,
      result.refreshToken,
      result.expiresTime,
      result.userId,
      result.isFirstLogin,
      result.hasChangedPassword,
      result.hasCompletedProfile
    );

    // 将 tokens 存储到 localStorage
    localStorage.setItem('accessToken', result.accessToken);
    localStorage.setItem('refreshToken', result.refreshToken);

    // 登录后获取用户信息
    if (result.accessToken) {
      try {
        const userInfo = await getProfile();
        if (userInfo) {
          useAuthStore.getState().setUserInfo(userInfo);
        } else {
          console.error("The obtained user information is empty.");
        }
      } catch (error) {
        console.error("Failed to obtain user information:", error);
      }
    } else {
      console.error("Login successful but no data was obtained accessToken");
    }

    return result;
  } catch (error) {
    console.error("Login request error:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.msg || "login failure");
    }
    throw new Error("login failure");
  }
};


export const logout = async (): Promise<void> => {
  try {
    await http.post("/pelegant/job-seeker/logout", null, {
      baseURL: "/api",
    });
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

export const getCaptchaImage = async (): Promise<{
  img: string;
  uuid: string;
}> => {
  const response = await http.get("/captchaImage", {
    baseURL: "/api/auth",
  });
  return response.data;
};

export interface UpdatePasswordParams {
  oldPassword: string;
  newPassword: string;
  tenantId?: string;
  t: (key: string) => string;
}

export interface UpdateProfileParams {
  nickname: string;
  sex: number;
  email: string;
  mobile: string;
  avatar?: string;
}

export const updateProfile = async (
  params: UpdateProfileParams
): Promise<UserInfo> => {
  // 从认证状态中获取用户ID
  const { userId } = useAuthStore.getState();
  if (!userId) {
    throw new Error("User is not logged in.");
  }

  // 构建符合后端StudentProfileUpdateRequest的请求体
  const requestBody = {
    nickname: params.nickname,
    gender: params.sex === 1 ? "Male" : params.sex === 2 ? "Female" : "Other"
  };

  const response = await http.put(`/students/profile/${userId}`, requestBody, {
    baseURL: "/api",
  });

  // 后端返回的是 Result<Student> 格式
  if (!response.success) {
    throw new Error(response.message || "Failed to update personal information");
  }

  // 将Student数据转换为UserInfo格式
  const student = response.data;
  return {
    id: parseInt(student.id) || 0,
    username: student.fullName || student.email,
    nickname: student.nickname || student.fullName,
    avatar: student.avatarPath || '',
    dept: { id: 0, name: student.major || '' },
    postIds: [],
    roleIds: [],
    roles: [],
    email: student.email,
    mobile: '',
    sex: student.gender === 'Male' ? 1 : student.gender === 'Female' ? 2 : 0,
    status: student.status === 'active' ? 1 : 0,
    passwordUpdateTime: '',
    createTime: student.createdAt || ''
  };
};

export const updatePassword = async (
  params: UpdatePasswordParams
): Promise<boolean> => {
  try {
    console.log("Current accessToken:", useAuthStore.getState().accessToken);
    const { userId } = useAuthStore.getState();

    const response = await http.put(
      `/students/password/${userId}`,
      {
        oldPassword: params.oldPassword,
        newPassword: params.newPassword,
      },
      {
        baseURL: "/api",
      }
    );
    console.log("Update password response:", response);
    return response.success;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.message || params.t("login.passwordChange.error")
      );
    }
    throw new Error(params.t("login.passwordChange.error"));
  }
};


export const uploadAvatarFile = async (avatarFile: File) => {
  // 检查是否是有效的图片文件
  if (!avatarFile.type.startsWith("image/")) {
    throw new Error("Invalid file type. Please select a valid image file.");
  }

  const formData = new FormData();
  formData.append("avatar", avatarFile);

  try {
    // 发起上传请求
    const response = await http.post("/students/avatar/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 90000, // 设置超时时间
    });

    // 处理响应
    if (response.success===true) {
      return response.data; // 上传成功，返回文件路径
    } else {
      throw new Error(response.message || "Failed to upload avatar");
    }
  } catch (error) {
    // 处理请求失败的情况
    console.error("Upload failed:", error);
    throw new Error("Failed to upload avatar. Please try again later.");
  }
};
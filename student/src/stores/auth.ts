import { create } from 'zustand';
import { UserInfo } from '@/api/login';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresTime: number | null;
  userId: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  isFirstLogin: boolean | null;
  hasChangedPassword: boolean | null;
  hasCompletedProfile: boolean | null;
  login: (accessToken: string, refreshToken: string, expiresTime: number, userId: string,
          userInfo: UserInfo, isFirstLogin?: boolean, hasChangedPassword?: boolean, hasCompletedProfile?: boolean) => void;
  logout: () => void;
  setUserInfo: (userInfo: UserInfo) => void;
  updateFirstLoginStatus: (hasChangedPassword?: boolean, hasCompletedProfile?: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => {
  // 从 localStorage 初始化
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  const storedUserInfo = localStorage.getItem('userInfo');
  const storedUserId = localStorage.getItem('userId');

  return {
    accessToken,
    refreshToken,
    expiresTime: null,
    userId: storedUserId,
    userInfo: storedUserInfo ? JSON.parse(storedUserInfo) : null,
    isAuthenticated: accessToken !== null,
    isFirstLogin: null,
    hasChangedPassword: null,
    hasCompletedProfile: null,
    login: (accessToken, refreshToken, expiresTime, userId, userInfo, isFirstLogin, hasChangedPassword, hasCompletedProfile) => {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));  // 存储实际的用户信息
      return set({
        accessToken,
        refreshToken,
        expiresTime,
        userId,
        isAuthenticated: true,
        userInfo,  // 存储实际的用户信息
        isFirstLogin,
        hasChangedPassword,
        hasCompletedProfile
      });
    },
    logout: () => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('userId');
      return set({
        accessToken: null,
        refreshToken: null,
        expiresTime: null,
        userId: null,
        userInfo: null,
        isAuthenticated: false,
        isFirstLogin: null,
        hasChangedPassword: null,
        hasCompletedProfile: null
      });
    },
    setUserInfo: (userInfo) => {
      console.log('Setting user info:', userInfo);
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      return set({ userInfo });
    },
    updateFirstLoginStatus: (hasChangedPassword, hasCompletedProfile) => {
      return set((state) => {
        const newState = { ...state };
        if (hasChangedPassword !== undefined) {
          newState.hasChangedPassword = hasChangedPassword;
        }
        if (hasCompletedProfile !== undefined) {
          newState.hasCompletedProfile = hasCompletedProfile;
        }
        // 如果密码已修改且资料已完成，则标记为非首次登录
        if (newState.hasChangedPassword && newState.hasCompletedProfile) {
          newState.isFirstLogin = false;
        }
        return newState;
      });
    }
  };
});

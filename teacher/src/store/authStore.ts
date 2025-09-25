import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { login, getPermissionInfo, PermissionInfoResponse, getUserProfile } from '@/api/auth';

import type { Role, Permission } from '@/api/auth';

interface User {
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
  roles: Role[];
  permissions: string[]; // permission codes
}

interface MenuItem {
  name: string;
  path: string;
  icon?: string;
  permission?: string;
  children?: MenuItem[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  menus: MenuItem[];
  updateAvatar: (newAvatar: string) => void; // 新增方法
  login: (email: string, password: string) => Promise<string | void>;
  fetchPermissions: () => Promise<PermissionInfoResponse>;
  logout: () => void;
  hasPermission: (permissionCode: string) => boolean;
  getMenus: () => MenuItem[];
  
}

interface MenuData {
  name: string;
  path: string;
  icon?: string;
  permission?: string;
  children?: MenuData[];
}

function generateMenus(menuData: MenuData[]): MenuItem[] {
  return menuData.map(menu => ({
    name: menu.name,
    path: menu.path,
    icon: menu.icon,
    permission: menu.permission,
    children: menu.children ? generateMenus(menu.children) : undefined
  }));
}

export const useAuthStore = create<AuthState>()(
    persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      setUser: (user) => set({ user }),

      accessToken: null,
      menus: [],
      updateAvatar: (newAvatar: string) => {
        set((state) => ({
          user: {
            ...state.user!,
            avatar: newAvatar, // 更新头像
          },
        }));
      },
      login: async (email, password) => {
        try {
          // 1. 登录获取token
          const response = await login({ email, password });
          
          // 2. 先设置token到状态管理器
          set({
            isAuthenticated: true,
            accessToken: response.accessToken || null,
            user: null,
            menus: []
          });

          // 3. 获取用户详细信息`
          const userProfile = await getUserProfile();
          console.log('User profile:', userProfile);

          // 4. 获取权限信息
          const permissionInfo = await getPermissionInfo();
          console.log('Permission info fetched:', permissionInfo);

          // 5. 更新用户信息（包含权限）
          set({
            user: {
              id: userProfile.id,
              username: userProfile.username,
              nickname: userProfile.nickname || userProfile.username,
              email: userProfile.email || '',
              mobile: userProfile.mobile || '',
              sex: userProfile.sex || 0,
              avatar: userProfile.avatar || '',
              loginIp: userProfile.loginIp || '',
              loginDate: userProfile.loginDate || Date.now(),
              createTime: userProfile.createTime || new Date().toISOString(),
              status: userProfile.status || 1,
              roles: permissionInfo.roles || [],
              permissions: permissionInfo.permissions || []
            }
          });
          
          return response.accessToken;
        } catch (error) {
          console.error('Login failed:', error);
          throw error;
        }
      },
      
      
      fetchPermissions: async () => {
        try {
          console.log('Fetching permission info...');
          const permissionInfo = await getPermissionInfo();
          console.log('Permission info:', permissionInfo);
          
          const user = {
            ...get().user!,
            roles: permissionInfo.roles || [],
            permissions: permissionInfo.permissions || []
          };
          
          set({
            user
          });
          
          return {
            permissions: permissionInfo.permissions,
            roles: permissionInfo.roles
          };
        } catch (error) {
          console.error('Fetch permissions failed:', error);
          throw error;
        }
      },
      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null, 
          accessToken: null,
          menus: [] 
        });
      },
      hasPermission: (permissionCode: string) => {
        const { user } = get();
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permissionCode);
      },
      getMenus: () => {
        return get().menus;
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken
      }),
    }
  )
);


export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  lastLogin: string;
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  usersCount: number;
  isSystem: boolean;
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description?: string;
  group?: string;
}

export interface PermissionGroup {
  id: string;
  name: string;
  permissions: Permission[];
}

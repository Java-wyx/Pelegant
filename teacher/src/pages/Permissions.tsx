
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { PermissionsHeader } from '@/components/permissions/PermissionsHeader';
import { SearchToolbar } from '@/components/permissions/SearchToolbar';
import { RolesList } from '@/components/permissions/RolesList';
import { UsersList } from '@/components/permissions/UsersList';
import { RoleForm } from '@/components/permissions/RoleForm';
import { UserForm } from '@/components/permissions/UserForm';
import { SearchResults } from '@/components/permissions/SearchResults';
import { fetchRoles, createRole, updateRole, deleteRole, Role, fetchUsers, createUser, updateUser, deleteUser, assignUserRole } from '@/api/auth';

interface User {
  id: string; // 修改为字符串类型，与后端一致
  username: string;
  email: string;
  roleIds: string[];
  status: number;
  createTime: string;
}

interface RoleFormData extends Omit<Role, 'id'> {
  id: string; // 修改为字符串类型
}

type UserFormData = Omit<User, 'id' | 'status' | 'createTime'> & {
  id?: string; // 修改为字符串类型
  status?: number;
  roleIds: string[]; // Explicitly declare as string[] to match API
};

// Convert API Role to component Role
function toComponentRole(apiRole: Role): import('@/components/permissions/RolesList').Role & { permissions: string[] } {
  return {
    id: apiRole.id,
    name: apiRole.name,
    code: apiRole.code || '',
    remark: apiRole.remark || '',
    menuIds: apiRole.menuIds || [],
    users: 0, // TODO: Get actual user count
    usagePercentage: 0, // TODO: Calculate actual usage
    permissions: apiRole.menuIds?.map(id => `perm_${id}`) || []
  };
}

// Convert component Role back to API Role
function fromComponentRole(compRole: import('@/components/permissions/RolesList').Role): Role {
  return {
    id: compRole.id,
    name: compRole.name,
    code: compRole.code || '',
    remark: compRole.remark,
    menuIds: compRole.menuIds,
    sort: 0
  };
}
import Layout from '@/components/Layout';

const Permissions: React.FC = () => {
  const [activeTab, setActiveTab] = useState("roles");
  const [searchQuery, setSearchQuery] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  
  // Dialog states
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleFormData | null>(null);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);

  // Load roles on mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        const response = await fetchRoles();
        console.log('Roles API response:', response.list.map(r => ({id: r.id, name: r.name, code: r.code})));
        setRoles(response.list);
        setFilteredRoles(response.list);
      } catch (error) {
        toast.error(error.message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadRoles();
  }, []);

  // Filter roles when search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredRoles(roles);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = roles.filter(role => 
      role.name.toLowerCase().includes(query) || 
      role.remark.toLowerCase().includes(query) 
    );
    setFilteredRoles(filtered);
  }, [searchQuery, roles]);

  const handleAddClick = () => {
    if (activeTab === "roles") {
      setEditingRole(null);
      setShowRoleForm(true);
    } else {
      setEditingUser(null);
      setShowUserForm(true);
    }
  };

  const handleEditRole = (role: RoleFormData) => {
    setEditingRole(role);
    setShowRoleForm(true);
  };

  const handleEditUser = (user: { id?: string; username: string; email: string; roleIds: string; status?: number; }) => {
    setEditingUser({
      ...user,
      roleIds: user.roleIds ? [user.roleIds] : []
    });
    setShowUserForm(true);
  };

  const handleDeleteRole = async (id: number) => {
    try {
      await deleteRole(id);
      setRoles(current => current.filter(role => role.id !== id));
      setFilteredRoles(current => current.filter(role => role.id !== id));
      toast.success("Role deleted successfully");
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const [users, setUsers] = useState<User[]>([]);
  const [userPagination, setUserPagination] = useState({
    pageNo: 1,
    pageSize: 10,
    total: 0
  });

  const reloadUsers = async () => {
    try {
      const response = await fetchUsers(userPagination.pageNo, userPagination.pageSize);
      const transformedUsers = response.list.map(user => ({
        ...user,
        roleIds: user.roleIds || []
      }));
      setUsers(transformedUsers);
      setUserPagination({
        pageNo: response.pageNo,
        pageSize: response.pageSize,
        total: response.total
      });
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await deleteUser(id);
      await reloadUsers();
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const reloadRoles = async () => {
    try {
      setLoading(true);
      const response = await fetchRoles();
      setRoles(response.list);
      setFilteredRoles(response.list);
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRole = async (role: RoleFormData) => {
    try {
      if (editingRole) {
        await updateRole(role);
        toast.success("Role updated successfully");
      } else {
        await createRole({
          name: role.name,
          code: role.code,
          sort: 0
        });
        toast.success("Role created successfully");
      }
      setShowRoleForm(false);
      await reloadRoles();
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const handleSaveUser = async (user: UserFormData) => {
    try {
      let savedUser: User;

      if (editingUser && user.id) {
        // Update user info
        const apiUser = await updateUser({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.roleIds[0] || '' // Use first role or empty string
        });

        // Transform to component User type
        savedUser = {
          ...apiUser,
          roleIds: user.roleIds
        };

        toast.success("User updated successfully");
      } else {
        // Create new user
        const apiUser = await createUser({
          username: user.username,
          email: user.email,
          password: "123456", // Default password
          role: user.roleIds[0] || '' // Use first role or empty string
        });

        // Transform to component User type
        savedUser = {
          ...apiUser,
          roleIds: user.roleIds
        };

        toast.success("User created successfully");
      }

      setShowUserForm(false);
      await reloadUsers();
    } catch (error) {
      toast.error(error.message);
      console.error(error);
    }
  };

  const isSearchActive = searchQuery.length > 0;

  return (
    <Layout>
      <div className="animate-fade-in">
        <PermissionsHeader />
        
        <div className="bg-white rounded-lg shadow p-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <SearchToolbar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onAddClick={handleAddClick}
            />

            <TabsContent value="roles" className="mt-0">
              {isSearchActive ? (
                <SearchResults 
                  searchType="roles" 
                  results={filteredRoles?.map(toComponentRole) || []} 
                  searchQuery={searchQuery}
                  onEdit={(item) => {
                    if ('name' in item) {
                      handleEditRole(fromComponentRole(item as import('@/components/permissions/RolesList').Role));
                    }
                  }}
                  onDelete={handleDeleteRole}
                />
              ) : (
                <RolesList 
                  roles={filteredRoles.map(toComponentRole)} 
                  onEditRole={(role) => handleEditRole({
                    ...fromComponentRole(role),
                    code: role.code || '',
                    id: role.id
                  })}
                  onDeleteRole={handleDeleteRole}
                />
              )}
            </TabsContent>

            <TabsContent value="users" className="mt-0">
              <UsersList 
                onEditUser={(user) => handleEditUser({
                  ...user,
                  roleIds: user.roleIds[0] ? String(user.roleIds[0]) : '' // Explicit string conversion
                })}
                onDeleteUser={handleDeleteUser}
                searchQuery={isSearchActive && activeTab === 'users' ? searchQuery : undefined}
                roles={roles.map(role => ({
                  ...role,
                  roleIds: [String(role.id)] // Explicit string conversion
                } as { id: number; name: string; roleIds: string[] }))}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Role Form Dialog */}
      <Dialog open={showRoleForm} onOpenChange={setShowRoleForm}>
        <DialogContent className="sm:max-w-2xl p-0">
          <DialogTitle className="sr-only">{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
          <RoleForm 
            onClose={() => setShowRoleForm(false)}
            onSave={handleSaveRole}
            editRole={editingRole}
          />
        </DialogContent>
      </Dialog>

      {/* User Form Dialog */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent className="sm:max-w-md p-0">
          <DialogTitle className="sr-only">{editingUser ? 'Edit User' : 'Create User'}</DialogTitle>
          <UserForm 
            onClose={() => setShowUserForm(false)}
            onSave={(user) => handleSaveUser({
              ...user,
              roleIds: user.roleIds ? [user.roleIds] : []
            })}
            editUser={editingUser ? {
              ...editingUser,
              roleIds: editingUser.roleIds[0] || ''
            } : null}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Permissions;

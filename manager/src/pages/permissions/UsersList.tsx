
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { User } from './types';
import { api } from '@/lib/api';
import SearchFilterBar from './components/SearchFilterBar';
import UsersTable from './components/users/UsersTable';
import TableFooter from './components/TableFooter';
import DeleteDialog from './components/DeleteDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UsersList = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      if (response.success && response.data) {
        // 转换后端数据格式为前端格式
        const transformedUsers: User[] = response.data.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || '',
          status: user.status as 'active' | 'inactive',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '',
          createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        }));
        setUsers(transformedUsers);
      } else {
        toast({
          title: '加载失败',
          description: response.message || '无法加载用户数据',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('加载用户失败:', error);
      toast({
        title: '加载失败',
        description: '网络错误，请重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [toast]);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const handleSelectUser = (id: string) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter(userId => userId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleDelete = (id: string) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await api.deleteUser(userToDelete);

      if (response.success) {
        toast({
          title: '删除成功',
          description: '用户已成功删除',
        });

        // 重新加载用户列表
        loadUsers();
      } else {
        toast({
          title: '删除失败',
          description: response.message || '删除用户时发生错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('删除用户失败:', error);
      toast({
        title: '删除失败',
        description: '网络错误，请重试',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // 重新加载数据的函数
  const reloadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      if (response.success && response.data) {
        const transformedUsers: User[] = response.data.map((user: any) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department || '',
          status: user.status as 'active' | 'inactive',
          lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '',
          createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
        }));
        setUsers(transformedUsers);
      }
    } catch (error) {
      console.error('重新加载用户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    {
      label: '显示全部',
      action: () => reloadUsers()
    },
    {
      label: '仅活跃用户',
      action: () => {
        reloadUsers().then(() => {
          setUsers(prev => prev.filter(u => u.status === 'active'));
        });
      }
    },
    {
      label: '仅禁用用户',
      action: () => {
        reloadUsers().then(() => {
          setUsers(prev => prev.filter(u => u.status === 'inactive'));
        });
      }
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto flex-1 max-w-md">
              <SearchFilterBar 
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterOptions={filterOptions}
                placeholder="搜索用户..."
                hideExport={true}
              />
            </div>
            <Button onClick={() => navigate('/permissions/users/new')} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              添加用户
            </Button>
          </div>
          
          <UsersTable 
            users={filteredUsers}
            selectedUsers={selectedUsers}
            onSelectAll={handleSelectAll}
            onSelectUser={handleSelectUser}
            onDeleteUser={handleDelete}
          />
        </CardContent>
        <TableFooter
          totalItems={users.length}
          filteredItems={filteredUsers.length}
        />
      </Card>

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="确认删除"
        description="您确定要删除这个用户吗？此操作不可撤销。"
      />
    </div>
  );
};

export default UsersList;

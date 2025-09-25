
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Role } from './types';
import { api } from '@/lib/api';
import SearchFilterBar from './components/SearchFilterBar';
import RolesTable from './components/roles/RolesTable';
import TableFooter from './components/TableFooter';
import DeleteDialog from './components/DeleteDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RolesList = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // 加载角色数据
  useEffect(() => {
    const loadRoles = async () => {
      try {
        setLoading(true);
        const response = await api.getPRoles();
        if (response.success && response.data) {
          // 转换后端数据格式为前端格式
          const transformedRoles: Role[] = response.data.map((role: any) => ({
            id: role.id,
            name: role.roleName,
            description: role.description,
            permissions: role.permissions,
            usersCount: role.usersCount || 0,
            isSystem: role.isSystem || false,
            createdAt: role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '未知',
          }));
          setRoles(transformedRoles);
        } else {
          toast({
            title: '加载失败',
            description: response.message || '无法加载角色数据',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('加载角色失败:', error);
        toast({
          title: '加载失败',
          description: '网络错误，请重试',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadRoles();
  }, [toast]);

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedRoles.length === filteredRoles.length) {
      setSelectedRoles([]);
    } else {
      setSelectedRoles(filteredRoles.map(role => role.id));
    }
  };

  const handleSelectRole = (id: number) => {
    if (selectedRoles.includes(id)) {
      setSelectedRoles(selectedRoles.filter(roleId => roleId !== id));
    } else {
      setSelectedRoles([...selectedRoles, id]);
    }
  };

  const handleDelete = (id: string) => {
    const role = roles.find(r => r.id === id);
    if (role?.isSystem) {
      toast({
        title: '无法删除',
        description: '系统角色不能被删除',
        variant: 'destructive',
      });
      return;
    }

    setRoleToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (roleToDelete) {
      try {
        const response = await api.deletePRole(roleToDelete);
        if (response.success) {
          setRoles(roles.filter(role => role.id !== roleToDelete));
          toast({
            title: '删除成功',
            description: '角色已成功删除',
          });
        } else {
          toast({
            title: '删除失败',
            description: response.message || '删除角色时发生错误',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('删除角色失败:', error);
        toast({
          title: '删除失败',
          description: '网络错误，请重试',
          variant: 'destructive',
        });
      }
    }
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
  };

  // 重新加载数据的函数
  const reloadRoles = async () => {
    try {
      setLoading(true);
      const response = await api.getPRoles();
      if (response.success && response.data) {
        const transformedRoles: Role[] = response.data.map((role: any) => ({
          id: role.id,
          name: role.roleName,
          description: role.description,
          permissions: role.permissions,
          usersCount: role.usersCount || 0,
          isSystem: role.isSystem || false,
          createdAt: role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '未知',
        }));
        setRoles(transformedRoles);
      }
    } catch (error) {
      console.error('重新加载角色失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    {
      label: '显示全部',
      action: () => reloadRoles()
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
                placeholder="搜索角色..."
                hideExport={true}
              />
            </div>
            <Button onClick={() => navigate('/permissions/roles/new')} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              添加角色
            </Button>
          </div>
          
          <RolesTable 
            roles={filteredRoles}
            selectedRoles={selectedRoles}
            onSelectAll={handleSelectAll}
            onSelectRole={handleSelectRole}
            onDeleteRole={handleDelete}
          />
        </CardContent>
        <TableFooter
          totalItems={roles.length}
          filteredItems={filteredRoles.length}
        />
      </Card>

      <DeleteDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="确认删除"
        description="您确定要删除这个角色吗？该角色下的所有用户将失去相关权限。此操作不可撤销。"
      />
    </div>
  );
};

export default RolesList;

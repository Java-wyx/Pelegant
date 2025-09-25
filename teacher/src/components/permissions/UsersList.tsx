
import React, { useState, useEffect, useCallback } from 'react';
import { fetchUsers, createUser, updateUser } from '@/api/auth';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface User {
  id: string; // 修改为字符串类型
  username: string;
  email: string;
  roleIds: string[]; // 修改为字符串数组
  status: number;
  createTime: string;
}

interface Role {
  id: number;
  name: string;
}

interface UsersListProps {
  onEditUser: (user: User) => void;
  onDeleteUser: (id: string) => void; // 修改为字符串类型
  searchQuery?: string;
  roles?: Role[];
}

export const UsersList: React.FC<UsersListProps> = ({ onEditUser, onDeleteUser, searchQuery, roles = [] }) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageNo: 1,
    pageSize: 10,
    total: 0
  });

  const loadUsers = useCallback(async () => {
    const { pageNo, pageSize } = pagination;
    try {
      setLoading(true);
      const response = await fetchUsers(pageNo, pageSize);
      const transformedUsers = response.list.map(user => ({
        ...user,
        roleIds: user.roleIds || []
      }));
      setUsers(transformedUsers);
      setPagination({
        pageNo: response.pageNo,
        pageSize: response.pageSize,
        total: response.total
      });
    } catch (error) {
      toast.error(t('users.list.toast.loadFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageNo, pagination.pageSize]);

  useEffect(() => {
    loadUsers();
  }, [pagination.pageNo, pagination.pageSize, loadUsers]);

  const filteredUsers = searchQuery
    ? users.filter(user => {
        const query = searchQuery.toLowerCase();
        return (
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.roleIds.includes(query)
        );
      })
    : users;

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {filteredUsers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 text-lg">{t('users.list.empty')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-medium">{t('users.list.columns.username')}</TableHead>
                <TableHead className="font-medium">{t('users.list.columns.email')}</TableHead>
                <TableHead className="font-medium">{t('users.list.columns.role')}</TableHead>
                <TableHead className="text-right font-medium">{t('users.list.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id} className="hover:bg-blue-50/50">
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2 py-0.5">
                      {user.roleIds
                        .map(id => {
                          // 如有角色字典，可用 roles 显示中文名称；fallback 到字典/原值
                          const role = roles.find(r => String(r.id) === String(id));
                          if (role) return role.name;

                          const dict: Record<string, string> = {
                            admin: t('roles.codes.admin', { defaultValue: 'Admin' }),
                            teacher: t('roles.codes.teacher', { defaultValue: 'Teacher' }),
                            project: t('roles.codes.project', { defaultValue: 'Project Admin' }),
                            student: t('roles.codes.student', { defaultValue: 'Student' }),
                            '1': t('roles.codes.admin', { defaultValue: 'Admin' }),
                            '2': t('roles.codes.teacher', { defaultValue: 'Teacher' }),
                            '3': t('roles.codes.project', { defaultValue: 'Project Admin' }),
                            '4': t('roles.codes.student', { defaultValue: 'Student' })
                          };
                          return dict[String(id)] || String(id);
                        })
                        .join(', ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => onEditUser(user)}
                        aria-label={t('users.list.actions.edit')}
                        title={t('users.list.actions.edit')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onDeleteUser(user.id)}
                        aria-label={t('users.list.actions.delete')}
                        title={t('users.list.actions.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};


import React, { useState, useEffect, useCallback } from 'react';
import { fetchUsers, createUser, updateUser } from '@/api/auth';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2 } from 'lucide-react';

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
      toast.error('Failed to load users');
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
            <p className="text-gray-500 text-lg">No users found</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-medium">Username</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Role</TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-blue-50/50">
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2 py-0.5">
                      {user.roleIds.map(id => {
                        const role = roles.find(r => r.id === id);
                        if (role) return role.name;
                        
                        // Default role translations
                        const roleTranslations: Record<string, string> = {
                          '1': 'Admin',
                          '2': 'Manager',
                          '3': 'User',
                          '4': 'Guest'
                        };
                        
                        return roleTranslations[id] || `Role ${id}`;
                      }).join(', ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => onEditUser(user)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onDeleteUser(user.id)}
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

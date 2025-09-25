
import { User } from '../../types';
import { Edit, Trash2, UserCheck, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UsersTableProps {
  users: User[];
  selectedUsers: string[];
  onSelectAll: () => void;
  onSelectUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
}

const UsersTable = ({
  users,
  selectedUsers,
  onSelectAll,
  onSelectUser,
  onDeleteUser,
}: UsersTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedUsers.length === users.length && users.length > 0} 
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>用户名</TableHead>
            <TableHead>邮箱</TableHead>
            <TableHead>角色</TableHead>
            <TableHead>部门</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>最后登录</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                没有找到匹配的用户
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onCheckedChange={() => onSelectUser(user.id)}
                    aria-label={`Select ${user.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <UserCheck className="h-4 w-4 mr-2 text-primary" />
                    {user.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    {user.email}
                  </div>
                </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                      {user.role}
                    </div>
                  </TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>
                    {user.status === 'active' ? (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                          活跃
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                        禁用
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {user.lastLogin}
                    </div>
                  </TableCell>
                  <TableCell>{user.createdAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/permissions/users/edit/${user.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UsersTable;

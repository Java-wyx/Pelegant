
import { Role } from '../../types';
import { Edit, Trash2, ShieldCheck, Users } from 'lucide-react';
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

interface RolesTableProps {
  roles: Role[];
  selectedRoles: string[];
  onSelectAll: () => void;
  onSelectRole: (id: string) => void;
  onDeleteRole: (id: string) => void;
}

const RolesTable = ({
  roles,
  selectedRoles,
  onSelectAll,
  onSelectRole,
  onDeleteRole,
}: RolesTableProps) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedRoles.length === roles.length && roles.length > 0} 
                onCheckedChange={onSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>角色名称</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>权限</TableHead>
            <TableHead>用户数量</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                没有找到匹配的角色
              </TableCell>
            </TableRow>
          ) : (
            roles.map((role) => (
              <TableRow key={role.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedRoles.includes(role.id)} 
                    onCheckedChange={() => onSelectRole(role.id)}
                    aria-label={`Select ${role.name}`}
                    disabled={role.isSystem}
                  />
                </TableCell>
                <TableCell className="font-medium flex items-center">
                  <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                  {role.name}
                </TableCell>
                <TableCell>{role.description}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions[0] === 'all' ? (
                      <Badge variant="outline" className="bg-primary/10 text-primary">
                        全部权限
                      </Badge>
                    ) : (
                      role.permissions.length > 3 ? (
                        <>
                          {role.permissions.slice(0, 2).map(perm => (
                            <Badge key={perm} variant="outline" className="bg-primary/10 text-primary">
                              {perm}
                            </Badge>
                          ))}
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            +{role.permissions.length - 2}
                          </Badge>
                        </>
                      ) : (
                        role.permissions.map(perm => (
                          <Badge key={perm} variant="outline" className="bg-primary/10 text-primary">
                            {perm}
                          </Badge>
                        ))
                      )
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                    {role.usersCount}
                  </div>
                </TableCell>
                <TableCell>{role.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/permissions/roles/edit/${role.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteRole(role.id)}
                      disabled={role.isSystem}
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

export default RolesTable;

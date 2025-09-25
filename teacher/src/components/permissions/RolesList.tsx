
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Edit2, Trash2 } from 'lucide-react';

export interface Role {
  id: string; // 修改为字符串类型，匹配MongoDB ObjectId
  name: string;
  code?: string;
  remark?: string;
  menuIds: string[]; // 修改为字符串数组
  users?: number;
  usagePercentage?: number;
}

interface RolesListProps {
  roles: Role[];
  onEditRole: (role: Role) => void;
  onDeleteRole: (id: string) => void; // 修改为字符串类型
}

export const RolesList: React.FC<RolesListProps> = ({ roles, onEditRole, onDeleteRole }) => {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {roles.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500 text-lg">No roles found</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-medium">Role Name</TableHead>
                <TableHead className="font-medium">Description</TableHead>
                <TableHead className="font-medium">Permissions</TableHead>
                <TableHead className="text-right font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} className="hover:bg-blue-50/50">
                  <TableCell className="font-medium text-blue-700">{role.name}</TableCell>
                  <TableCell className="text-gray-600">{role.remark}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2 py-0.5">
                      {role.menuIds.map(id => {
                        return id
                      }).join(', ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => onEditRole(role)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onDeleteRole(role.id)}
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


import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Pencil, Trash2, ArrowUpDown, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { School } from '../types';

interface SchoolsTableProps {
  filteredSchools: School[];
  selectedSchools: string[];
  handleSelectAll: () => void;
  handleSelectSchool: (id: string) => void;
  handleDelete: (id: string) => void;
  handleSetPassword: (id: string, isReset?: boolean) => void;
}

const SchoolsTable = ({
  filteredSchools,
  selectedSchools,
  handleSelectAll,
  handleSelectSchool,
  handleDelete,
  handleSetPassword,
}: SchoolsTableProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: School['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">运行中</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">暂停招生</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">待审核</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const getPasswordStatus = (hasInitialPassword: boolean) => {
    if (hasInitialPassword) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">已设置</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">未设置</Badge>;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>大学名称</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>类型</TableHead>
            <TableHead>位置</TableHead>
            <TableHead>管理员</TableHead>
            <TableHead>密码状态</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>创建日期</TableHead>
            <TableHead className="w-28 text-right">操作</TableHead>
            <TableHead className="w-12 text-center">
              <Checkbox 
                checked={selectedSchools.length === filteredSchools.length && filteredSchools.length > 0} 
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSchools.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                没有找到匹配的学校
              </TableCell>
            </TableRow>
          ) : (
            filteredSchools.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>{school.type}</TableCell>
                <TableCell>{school.location}</TableCell>
                <TableCell>{school.adminEmail}</TableCell>
                <TableCell>{getPasswordStatus(school.hasInitialPassword)}</TableCell>
                <TableCell>{getStatusBadge(school.status)}</TableCell>
                <TableCell>{school.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/schools/${school.id}`)}
                      title="查看详情"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/schools/edit/${school.id}`)}
                      title="编辑信息"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleSetPassword(school.id, school.hasInitialPassword)}
                      title={school.hasInitialPassword ? "重置密码" : "设置初始密码"}
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(school.id)}
                      title="删除学校"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox 
                    checked={selectedSchools.includes(school.id)} 
                    onCheckedChange={() => handleSelectSchool(school.id)}
                    aria-label={`Select ${school.name}`}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default SchoolsTable;

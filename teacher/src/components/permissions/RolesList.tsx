
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Permission } from '@/api/auth'

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
  const { t } = useTranslation();
  const availablePermissions: Permission[] = [
    { id: 1001, name: 'View Users', code: 'user_view', type: 1 },
    { id: 1002, name: 'Add Users', code: 'user_add', type: 1 },
    { id: 1003, name: 'Edit Users', code: 'user_edit', type: 1 },
    { id: 1004, name: 'Delete Users', code: 'user_delete', type: 1 },
    { id: 1008, name: 'View Roles', code: 'role_view', type: 1 },
    { id: 1009, name: 'Add Roles', code: 'role_add', type: 1 },
    { id: 1010, name: 'Edit Roles', code: 'role_edit', type: 1 },
    { id: 1011, name: 'Delete Roles', code: 'role_delete', type: 1 },
    { id: 7, name: 'View Students', code: 'student_view', type: 1 },
    { id: 8, name: 'Edit Students', code: 'student_edit', type: 1 },
    { id: 9, name: 'View Enterprises', code: 'enterprise_view', type: 1 },
    { id: 10, name: 'Edit Enterprises', code: 'enterprise_edit', type: 1 },
  ];

  const permById = new Map<string, Permission>();
  const permByCode = new Map<string, Permission>();

  availablePermissions.forEach((p) => {
    permById.set(String(p.id), p);
    permByCode.set(p.code, p);
  });

  const labelFor = (val: string, t: (k: string, o?: any) => string) => {
    // val 可能是 "1001" / "user_view" / "system:user:list" / "students.manage"
    const byId = permById.get(val);
    if (byId) {
      // 用 code 做 i18n key，没配就回退 name
      return t(`roles.permissions.${byId.code}`, { defaultValue: byId.name });
    }

    const byCode = permByCode.get(val);
    if (byCode) {
      return t(`roles.permissions.${byCode.code}`, { defaultValue: byCode.name });
    }

    // 直接按 code 试译（你可在 locales 里补上 roles.permissions.system:user:list 等键）
    const direct = t(`roles.permissions.${val}`, { defaultValue: val });

    // 美化 code（把 : . _ 变成更易读的分隔）
    const pretty = direct.replace(/[:._]/g, ' · ');

    // 最终兜底文案（不再显示“未知权限(xxx)”，而是更友好的名称）
    return pretty;
  };

  // 1) 常见 code 的人工映射表（把不规则 code 映射到你已有的 snake_case 键）
  const codeMap: Record<string, string> = {
    // 你已有 JSON 的键：user_view / student_view / enterprise_edit ...
    'system:user:list': 'user_view',
    'students.manage': 'student_view',
    'student.data.view': 'student_view',
    'student.data.edit': 'student_edit',
    'enterprises.manage': 'enterprise_view',
    'partnerships.view': 'enterprise_view',
    'partnerships.edit': 'enterprise_edit',

    // 你截屏里未命中但经常出现的：
    'dashboard.view': 'dashboard_view',
    'info.view': 'info_view',
    'statistics.view': 'statistics_view',
    'statistics.export': 'statistics_export',
    'reports.generate': 'reports_generate',
    'data.analyze': 'data_analyze',
    'pelegant:company:query': 'pelegant_company_query',
  };

  // 2) 自动把 a:b.c 之类转为 a_b_c（可作为 fallback）
  const toSnake = (s: string) => s.replace(/[:.]/g, '_');

  // 3) 生成最终显示文案
  const permissionLabel = (raw: string, t: (k: string, o?: any) => string) => {
    // 3.1 直接命中（raw 本身已经是 snake_case 键）
    const direct = t(`roles.permissions.${raw}`, { defaultValue: '' });
    if (direct) return direct;

    // 3.2 映射命中（冒号/点号 → 你的 snake_case 键）
    const mapped = codeMap[raw];
    if (mapped) {
      const hit = t(`roles.permissions.${mapped}`, { defaultValue: '' });
      if (hit) return hit;
    }

    // 3.3 自动蛇形化再尝试
    const snake = toSnake(raw);
    const auto = t(`roles.permissions.${snake}`, { defaultValue: '' });
    if (auto) return auto;

    // 3.4 最终兜底：美化原始 code 的可读性
    return raw.replace(/[:._]/g, ' · ');
  };


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
                <TableHead className="w-[140px]">{t('roles.list.columns.name')}</TableHead>
                <TableHead>{t('roles.list.columns.description')}</TableHead>
                <TableHead className="w-[280px]">{t('roles.list.columns.permissions')}</TableHead>
                <TableHead className="w-[160px] text-right">{t('roles.list.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id} className="hover:bg-blue-50/50">
                  <TableCell className="font-medium text-blue-700">{role.name}</TableCell>
                  <TableCell className="text-gray-600">{role.remark}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {role.menuIds.map((raw) => (
                        <span
                          key={raw}
                          className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 border border-blue-200"
                          title={raw}
                        >
                          {permissionLabel(raw, t)}
                        </span>
                      ))}
                    </div>
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

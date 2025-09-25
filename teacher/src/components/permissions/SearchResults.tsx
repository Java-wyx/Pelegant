
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { type Role } from '@/components/permissions/RolesList';
import { type User } from '@/components/permissions/UsersList';
import { useTranslation } from 'react-i18next';

interface SearchResultsProps {
  searchType: 'roles' | 'users';
  results: (Role | User)[];
  searchQuery: string;
  onEdit: (item: Role | User) => void;
  onDelete: (id: number) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ 
  searchType, 
  results, 
  searchQuery,
  onEdit,
  onDelete 
}) => {
  const { t } = useTranslation();
  if (results.length === 0) {
    return (
      <Card className="border-none shadow-sm">
        <CardContent className="p-12 text-center">
          <p className="text-gray-500 text-lg">
            searchType === 'roles' ? t('search.types.roles') : t('search.types.users');
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardContent className="p-0">
        {searchType === 'roles' ? (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-medium">{t('search.columns.roleName')}</TableHead>
                <TableHead className="font-medium">{t('search.columns.description')}</TableHead>
                <TableHead className="font-medium">{t('search.columns.permissions')}</TableHead>
                <TableHead className="text-right font-medium">{t('search.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((role: any) => (
                <TableRow key={role.id} className="hover:bg-blue-50/50">
                  <TableCell className="font-medium text-blue-700">{role.name}</TableCell>
                  <TableCell className="text-gray-600">{role.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map((permission: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-2.5 py-1">
                          {permission}
                          {t(`roles.permissions.${permission}`, { defaultValue: permission })}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => onEdit(role)}
                        aria-label={t('search.actions.edit')}
                        title={t('search.actions.edit')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onDelete(role.id)}
                        aria-label={t('search.actions.delete')}
                        title={t('search.actions.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-medium">{t('search.columns.username')}</TableHead>
                <TableHead className="font-medium">{t('search.columns.email')}</TableHead>
                <TableHead className="font-medium">{t('search.columns.role')}</TableHead>
                <TableHead className="text-right font-medium">{t('search.columns.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((user: any) => (
                <TableRow key={user.id} className="hover:bg-blue-50/50">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-gray-600">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 px-2 py-0.5">
                      {user.role}
                      {t(`roles.codes.${user.role}`, { defaultValue: user.role })}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                        onClick={() => onEdit(user)}
                        aria-label={t('search.actions.edit')}
                        title={t('search.actions.edit')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => onDelete(user.id)}
                        aria-label={t('search.actions.delete')}
                        title={t('search.actions.delete')}
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

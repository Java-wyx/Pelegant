import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { X, Check } from 'lucide-react';
import { Role, Permission, createRole, updateRole, assignRoleMenu, RoleFormData } from '@/api/auth';
import { useTranslation } from 'react-i18next';

interface RoleFormProps {
  onClose: () => void;
  onSave: (role: Role) => void;
  editRole?: Role;
}

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

export const RoleForm: React.FC<RoleFormProps> = ({ onClose, onSave, editRole }) => {

  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    name: editRole?.name || '',
    code: editRole?.code || '',
    description: editRole?.remark || '',
    sort: editRole?.sort || 0,
    permissions: editRole?.menuIds || [],
  });
  
  const [errors, setErrors] = useState<{
    name?: string;
  }>({});
  
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    const permission = availablePermissions.find(p => p.id === permissionId);
    if (!permission) return;

    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permission.id]
        : prev.permissions.filter(p => p !== permissionId)
    }));
  };

  const validateForm = () => {
    const newErrors: {name?: string} = {};
    if (!formData.name.trim()) {
      newErrors.name = t('roles.form.validation.nameRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const roleData: RoleFormData = {
        id: editRole?.id,
        code: formData.code,
        name: formData.name,
        remark: formData.description,
        sort: formData.sort
        // menuIds is optional and handled separately via assignRoleMenu
      };

      let savedRole: Role;
      if (editRole?.id) {
        // First update basic role info
        savedRole = await updateRole(roleData);
        // Then update permissions
        await assignRoleMenu(editRole.id, formData.permissions);
      } else {
        // For new roles, create with permissions included
        const newRoleData = {
          ...roleData,
          menuIds: formData.permissions,
          sort: formData.sort || 0
        };
        savedRole = await createRole(newRoleData);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSave(savedRole);
        onClose();
      }, 1500);
    } catch (error) {
      toast.error(t('roles.form.error.saveFailed'));
      console.error(error);
    }
  };

  const isPermissionChecked = (permissionId: number) => {
    return formData.permissions.includes(permissionId);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="bg-gray-50">
        <CardTitle className="text-lg font-medium">
          {editRole ? t('roles.form.title.edit') : t('roles.form.title.add')}
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          {showSuccess && (
            <Alert variant="success" className="mb-4">
              <Check className="h-4 w-4" />
              <AlertDescription>
                {editRole ? t('roles.form.success.updated') : t('roles.form.success.created')}!
              </AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-1">
            <Label htmlFor="code">{t('roles.form.fields.code')}</Label>
            <Input
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className={errors.name ? 'border-red-500' : ''}
              placeholder={t('roles.form.fields.codePlaceholder')}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="name">{t('roles.form.fields.name')}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'border-red-500' : ''}
              placeholder={t('roles.form.fields.namePlaceholder')}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="description">{t('roles.form.fields.description')}</Label>
            <Input
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('roles.form.fields.descriptionPlaceholder')}
            />
          </div>
          
          <div className="space-y-3">
            <Label>{t('roles.form.fields.permissions')}</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availablePermissions.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-2 p-2 rounded hover:bg-gray-50">
                  <Checkbox
                    id={permission.id.toString()}
                    checked={isPermissionChecked(permission.id)}
                    onCheckedChange={(checked) => {
                      handlePermissionChange(permission.id, checked === true);
                    }}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor={permission.id.toString()} className="text-sm font-medium cursor-pointer">
                      {t(`roles.permissions.${permission.code}`, { defaultValue: permission.name })}
                    </Label>
                    <p className="text-xs text-gray-500"></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between border-t p-4 bg-gray-50">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose}
          >
            {t('roles.form.actions.cancel')}
          </Button>
          <Button type="submit">
            {editRole ? t('roles.form.actions.update') : t('roles.form.actions.create')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

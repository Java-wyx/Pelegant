
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft } from 'lucide-react';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const permissions = [
  {
    id: 'dashboard',
    label: '仪表盘',
  },
  {
    id: 'schools',
    label: '学校管理',
    subPermissions: [
      { id: 'schools.view', label: '查看学校' },
      { id: 'schools.create', label: '创建学校' },
      { id: 'schools.edit', label: '编辑学校' },
      { id: 'schools.delete', label: '删除学校' },
    ]
  },
  {
    id: 'students',
    label: '学生管理',
    subPermissions: [
      { id: 'students.view', label: '查看学生' },
      { id: 'students.create', label: '创建学生' },
      { id: 'students.edit', label: '编辑学生' },
      { id: 'students.delete', label: '删除学生' },
    ]
  },
  {
    id: 'enterprises',
    label: '企业管理',
    subPermissions: [
      { id: 'enterprises.view', label: '查看企业' },
      { id: 'enterprises.create', label: '创建企业' },
      { id: 'enterprises.edit', label: '编辑企业' },
      { id: 'enterprises.delete', label: '删除企业' },
    ]
  },
  {
    id: 'crawler',
    label: '爬虫管理',
    subPermissions: [
      { id: 'crawler.view', label: '查看数据' },
      { id: 'crawler.create', label: '创建任务' },
      { id: 'crawler.clean', label: '清洗数据' },
    ]
  },
  {
    id: 'statistics',
    label: '数据统计',
    subPermissions: [
      { id: 'statistics.view', label: '查看统计' },
      { id: 'statistics.export', label: '导出报表' },
    ]
  },
  {
    id: 'permissions',
    label: '权限管理',
    subPermissions: [
      { id: 'permissions.users.view', label: '查看用户' },
      { id: 'permissions.users.manage', label: '管理用户' },
      { id: 'permissions.roles.view', label: '查看角色' },
      { id: 'permissions.roles.manage', label: '管理角色' },
    ]
  },
];

const formSchema = z.object({
  name: z.string().min(2, { message: '角色名称至少需要2个字符' }),
  description: z.string().min(5, { message: '角色描述至少需要5个字符' }),
  permissions: z.array(z.string()).min(1, { message: '至少选择一个权限' }),
});

type FormValues = z.infer<typeof formSchema>;

const AddRole = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      permissions: [],
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      const roleData = {
        roleName: data.name,
        description: data.description,
        permissions: data.permissions,
        isSystem: false
      };

      const response = await api.createPRole(roleData);

      if (response.success) {
        toast({
          title: '新角色已创建',
          description: `角色 ${data.name} 已成功创建`,
        });

        navigate('/permissions/roles');
      } else {
        toast({
          title: '添加失败',
          description: response.message || '创建新角色时发生错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('添加角色失败:', error);
      toast({
        title: '添加失败',
        description: '网络错误，请重试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/permissions/roles')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-xl">添加新角色</CardTitle>
              <CardDescription>创建新的角色并设置权限</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>角色名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入角色名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>角色描述</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="请描述这个角色的用途与权限范围" 
                          className="resize-none" 
                          rows={3} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="permissions"
                  render={() => (
                    <FormItem>
                      <div className="mb-4">
                        <FormLabel>权限设置</FormLabel>
                        <FormDescription>
                          为该角色选择所需的权限
                        </FormDescription>
                      </div>
                      
                      <div className="space-y-4">
                        {permissions.map((permissionGroup) => (
                          <div key={permissionGroup.id} className="border rounded-md p-4">
                            <FormField
                              control={form.control}
                              name="permissions"
                              render={({ field }) => {
                                const groupValue = permissionGroup.id;
                                const isGroupChecked = field.value.includes(groupValue);

                                // Check if all subpermissions are checked
                                const hasSubPermissions = permissionGroup.subPermissions?.length > 0;
                                let allSubPermissionsChecked = false;
                                
                                if (hasSubPermissions) {
                                  allSubPermissionsChecked = permissionGroup.subPermissions.every(subPerm => 
                                    field.value.includes(subPerm.id)
                                  );
                                }

                                return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={hasSubPermissions ? allSubPermissionsChecked : isGroupChecked}
                                        onCheckedChange={(checked) => {
                                          const currentValues = [...field.value];
                                          
                                          if (hasSubPermissions) {
                                            // Handle all subpermissions
                                            permissionGroup.subPermissions.forEach(subPerm => {
                                              const subValueIndex = currentValues.indexOf(subPerm.id);
                                              
                                              if (checked && subValueIndex === -1) {
                                                currentValues.push(subPerm.id);
                                              } else if (!checked && subValueIndex !== -1) {
                                                currentValues.splice(subValueIndex, 1);
                                              }
                                            });
                                          } else {
                                            // Handle a simple permission without subpermissions
                                            const valueIndex = currentValues.indexOf(groupValue);
                                            
                                            if (checked && valueIndex === -1) {
                                              currentValues.push(groupValue);
                                            } else if (!checked && valueIndex !== -1) {
                                              currentValues.splice(valueIndex, 1);
                                            }
                                          }
                                          
                                          field.onChange(currentValues);
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1">
                                      <FormLabel className="font-medium">
                                        {permissionGroup.label}
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                )
                              }}
                            />
                            
                            {permissionGroup.subPermissions && (
                              <div className="ml-6 mt-3 space-y-2">
                                {permissionGroup.subPermissions.map((subPerm) => (
                                  <FormField
                                    key={subPerm.id}
                                    control={form.control}
                                    name="permissions"
                                    render={({ field }) => {
                                      const isChecked = field.value.includes(subPerm.id);
                                      
                                      return (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                                          <FormControl>
                                            <Checkbox
                                              checked={isChecked}
                                              onCheckedChange={(checked) => {
                                                const currentValues = [...field.value];
                                                const valueIndex = currentValues.indexOf(subPerm.id);
                                                
                                                if (checked && valueIndex === -1) {
                                                  currentValues.push(subPerm.id);
                                                } else if (!checked && valueIndex !== -1) {
                                                  currentValues.splice(valueIndex, 1);
                                                }
                                                
                                                field.onChange(currentValues);
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="text-sm font-normal">
                                            {subPerm.label}
                                          </FormLabel>
                                        </FormItem>
                                      )
                                    }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/permissions/roles')}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '正在保存...' : '保存角色'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddRole;

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
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
import { Role } from './types';
import { api } from '@/lib/api';

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

const EditRole = () => {
  const { id } = useParams<{ id: string }>();
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const response = await api.getPRoles();

        if (response.success && response.data) {
          const foundRole = response.data.find((r: any) => r.id === id);
        
          if (foundRole) {
            const transformedRole: Role = {
              id: foundRole.id,
              name: foundRole.roleName,
              description: foundRole.description,
              permissions: foundRole.permissions,
              usersCount: foundRole.usersCount || 0,
              isSystem: foundRole.isSystem || false,
              createdAt: foundRole.createdAt ? new Date(foundRole.createdAt).toLocaleDateString() : '',
            };

            setRole(transformedRole);

            // Pre-select existing permissions
            let rolePermissions = foundRole.permissions;

            // If "all" permission is set, expand it to all available permissions
            if (rolePermissions.includes('all')) {
              rolePermissions = ['all'];
              // Add all specific permissions - in a real app this would be more comprehensive
              permissions.forEach(group => {
                rolePermissions.push(group.id);
                if (group.subPermissions) {
                  group.subPermissions.forEach(subPerm => {
                    rolePermissions.push(subPerm.id);
                  });
                }
              });
            }

            form.reset({
              name: foundRole.roleName,
              description: foundRole.description,
              permissions: rolePermissions,
            });
          } else {
            toast({
              title: '角色不存在',
              description: `ID 为 ${id} 的角色不存在`,
              variant: 'destructive',
            });
            navigate('/permissions/roles');
          }
        } else {
          toast({
            title: '加载失败',
            description: response.message || '无法加载角色数据',
            variant: 'destructive',
          });
          navigate('/permissions/roles');
        }
      } catch (error) {
        console.error('获取角色信息失败:', error);
        toast({
          title: '加载失败',
          description: '无法加载角色信息',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchRole();
    }
  }, [id, form, toast, navigate]);

  const onSubmit = async (data: FormValues) => {
    if (!id) return;

    setIsSubmitting(true);

    try {
      const roleData = {
        roleName: data.name,
        description: data.description,
        permissions: data.permissions,
        isSystem: role?.isSystem || false
      };

      const response = await api.updatePRole(id, roleData);

      if (response.success) {
        toast({
          title: '角色已更新',
          description: `角色 ${data.name} 已成功更新`,
        });

        navigate('/permissions/roles');
      } else {
        toast({
          title: '更新失败',
          description: response.message || '更新角色信息时发生错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('更新角色失败:', error);
      toast({
        title: '更新失败',
        description: '网络错误，请重试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  const isSystemRole = role?.isSystem || false;

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
              <div className="flex items-center space-x-2">
                <CardTitle className="text-xl">编辑角色</CardTitle>
                {isSystemRole && (
                  <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded text-xs">
                    系统角色
                  </span>
                )}
              </div>
              <CardDescription>
                {isSystemRole 
                  ? "系统角色的基本信息不可修改，但可以调整权限范围"
                  : "更新角色信息和权限设置"
                }
              </CardDescription>
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
                        <Input 
                          placeholder="请输入角色名称" 
                          {...field} 
                          disabled={isSystemRole}
                        />
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
                          disabled={isSystemRole}
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
                        {/* Special "all" permission for admin roles */}
                        {role?.name === '超级管理员' && (
                          <div className="border rounded-md p-4 bg-muted/20">
                            <FormField
                              control={form.control}
                              name="permissions"
                              render={({ field }) => {
                                const isChecked = field.value.includes('all');
                                return (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                          const currentValues = [...field.value];
                                          
                                          // Special handling for "all" permission
                                          if (checked) {
                                            // Set only the "all" permission
                                            field.onChange(['all']);
                                          } else {
                                            // Remove "all" permission but keep specific ones
                                            const filteredValues = currentValues.filter(
                                              value => value !== 'all'
                                            );
                                            field.onChange(filteredValues);
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <div className="space-y-1">
                                      <FormLabel className="font-medium">
                                        全部权限（超级管理员）
                                      </FormLabel>
                                      <p className="text-sm text-muted-foreground">
                                        包含系统中的所有权限，包括未来添加的新功能
                                      </p>
                                    </div>
                                  </FormItem>
                                )
                              }}
                            />
                          </div>
                        )}
                        
                        {/* Regular permission groups */}
                        {permissions.map((permissionGroup) => (
                          <div key={permissionGroup.id} className="border rounded-md p-4">
                            <FormField
                              control={form.control}
                              name="permissions"
                              render={({ field }) => {
                                // Skip individual permissions if "all" is checked
                                if (field.value.includes('all') && role?.name === '超级管理员') {
                                  return null;
                                }
                                
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
                                      // Skip if "all" is checked
                                      if (field.value.includes('all') && role?.name === '超级管理员') {
                                        return null;
                                      }
                                      
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
                  {isSubmitting ? '正在保存...' : '保存更改'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditRole;


import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Role } from './types';
import { api } from '@/lib/api';

const formSchema = z.object({
  name: z.string().min(2, { message: '用户名至少需要2个字符' }),
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  roleId: z.string({ required_error: '请选择角色' }),
  department: z.string().min(1, { message: '请输入部门' }),
  status: z.enum(['active', 'inactive'], { required_error: '请选择状态' }),
});

type FormValues = z.infer<typeof formSchema>;

const EditUser = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      roleId: '',
      department: '',
      status: 'active',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 同时加载用户和角色数据
        const [usersResponse, rolesResponse] = await Promise.all([
          api.getUsers(),
          api.getPRoles()
        ]);

        // 处理角色数据
        if (rolesResponse.success && rolesResponse.data) {
          const transformedRoles: Role[] = rolesResponse.data.map((role: any) => ({
            id: role.id || role._id, // 处理可能的不同ID字段名
            name: role.roleName,
            description: role.description,
            permissions: role.permissions,
            usersCount: role.usersCount || 0,
            isSystem: role.isSystem || false,
            createdAt: role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '',
          }));
          setRoles(transformedRoles);
        }

        // 处理用户数据
        if (usersResponse.success && usersResponse.data) {
          const foundUser = usersResponse.data.find((u: any) => u.id === id);

          if (foundUser) {
            const transformedUser: User = {
              id: foundUser.id,
              name: foundUser.name,
              email: foundUser.email,
              role: foundUser.role,
              department: foundUser.department || '',
              status: foundUser.status as 'active' | 'inactive',
              lastLogin: foundUser.lastLogin ? new Date(foundUser.lastLogin).toLocaleString() : '',
              createdAt: foundUser.createdAt ? new Date(foundUser.createdAt).toLocaleDateString() : '',
            };
            setUser(transformedUser);

            // Find role ID by name
            const role = rolesResponse.data?.find((r: any) => r.roleName === foundUser.role);
            const roleId = role ? String(role.id || role._id) : '';

            form.reset({
              name: foundUser.name,
              email: foundUser.email,
              roleId,
              department: foundUser.department || '',
              status: foundUser.status,
            });
          } else {
            toast({
              title: '用户不存在',
              description: `ID 为 ${id} 的用户不存在`,
              variant: 'destructive',
            });
            navigate('/permissions/users');
          }
        } else {
          toast({
            title: '加载失败',
            description: usersResponse.message || '无法加载用户数据',
            variant: 'destructive',
          });
          navigate('/permissions/users');
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        toast({
          title: '加载失败',
          description: '无法加载用户信息',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchData();
    }
  }, [id, form, toast, navigate]);

  const onSubmit = async (data: FormValues) => {
    if (!id) {
      toast({
        title: '更新失败',
        description: '用户ID不存在',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 构建更新数据 - 发送角色ID而不是角色名称
      const updateData = {
        name: data.name,
        email: data.email,
        role: data.roleId, // 发送角色ID，后端会根据ID查找角色名称
        department: data.department,
        status: data.status,
      };

      // 调用API更新用户信息
      const response = await api.updateUser(id, updateData);

      if (response.success) {
        toast({
          title: '用户已更新',
          description: `用户 ${data.name} 的信息已成功更新`,
        });

        navigate('/permissions/users');
      } else {
        toast({
          title: '更新失败',
          description: response.message || '更新用户信息时发生错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('更新用户失败:', error);
      toast({
        title: '更新失败',
        description: '更新用户信息时发生错误',
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/permissions/users')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-xl">编辑用户</CardTitle>
              <CardDescription>更新用户信息和权限</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户名</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入用户名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>邮箱</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入邮箱" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="roleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>角色</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择角色" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map(role => (
                            <SelectItem key={role.id} value={String(role.id)}>
                              {role.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        用户的权限将基于所选角色
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>部门</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入部门" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>状态</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">活跃</SelectItem>
                          <SelectItem value="inactive">禁用</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/permissions/users')}
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

export default EditUser;

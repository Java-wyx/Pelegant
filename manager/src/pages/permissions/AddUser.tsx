
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Role } from './types';
import { api } from '@/lib/api';

const formSchema = z.object({
  name: z.string().min(2, { message: '用户名至少需要2个字符' }),
  email: z.string().email({ message: '请输入有效的邮箱地址' }),
  roleId: z.string({ required_error: '请选择角色' }),
  department: z.string().min(1, { message: '请输入部门' }),
  status: z.enum(['active', 'inactive'], { required_error: '请选择状态' }),
});

type FormValues = z.infer<typeof formSchema>;

const AddUser = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      department: '',
      status: 'active',
    },
  });

  // 加载角色数据
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await api.getPRoles();
        if (response.success && response.data) {
          const transformedRoles: Role[] = response.data.map((role: any) => ({
            id: role.id,
            name: role.roleName,
            description: role.description,
            permissions: role.permissions,
            usersCount: role.usersCount || 0,
            isSystem: role.isSystem || false,
            createdAt: role.createdAt ? new Date(role.createdAt).toLocaleDateString() : '',
          }));
          setRoles(transformedRoles);
        }
      } catch (error) {
        console.error('加载角色失败:', error);
      }
    };

    loadRoles();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // 构造用户数据，确保只创建项目管理员
      const userData = {
        name: data.name,
        email: data.email,
        role: data.roleId,
        department: data.department,
        status: data.status,
        userType: 'project' // 强制设置为项目管理员
      };

      const response = await api.createUser(userData);

      if (response.success) {
        toast({
          title: '新用户已创建',
          description: `项目管理员 ${data.name} 已成功添加到系统中，初始密码已通过邮箱发送`,
        });

        navigate('/permissions/users');
      } else {
        toast({
          title: '添加失败',
          description: response.message || '创建新用户时发生错误',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('添加用户失败:', error);
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
              onClick={() => navigate('/permissions/users')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-xl">添加新用户</CardTitle>
              <CardDescription>创建新的项目管理员用户账户。系统将自动生成初始密码并通过邮箱发送给用户。</CardDescription>
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
                  {isSubmitting ? '正在保存...' : '保存用户'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddUser;

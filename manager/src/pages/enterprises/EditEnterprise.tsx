import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Calendar } from 'lucide-react';
import { api } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

const formSchema = z.object({
  name: z.string().min(2, { message: '企业名称至少需要2个字符' }),
  industry: z.string().min(1, { message: '请选择行业' }),
  location: z.string().min(2, { message: '所在地至少需要2个字符' }),
  size: z.string().min(1, { message: '请选择企业规模' }),
  partnershipDate: z.date({
    required_error: "请选择合作日期",
  }),
  status: z.string().min(1, { message: '请选择状态' }),
  contactPerson: z.string().min(2, { message: '联系人姓名至少需要2个字符' }),
  contactPhone: z.string().min(11, { message: '请输入有效的手机号码' }).max(11).optional().or(z.literal('')),
  contactEmail: z.string().email({ message: '请输入有效的电子邮件地址' }).optional().or(z.literal('')),
  address: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const EditEnterprise = () => {
  const { id } = useParams(); // 获取企业ID
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enterpriseData, setEnterpriseData] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      industry: '',
      location: '',
      size: '',
      status: 'active',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      description: '',
      partnershipDate: null,
    },
  });

  // 在组件加载时获取企业数据
  useEffect(() => {
    const fetchEnterpriseData = async () => {
      try {
        const response = await api.getCompanyById(id);
        if (response.success) {
          const data = response.data;
          setEnterpriseData(data);
          // 用响应数据填充表单
          // 确保所有字段都被正确填充
        form.reset({
          name: data.companyName,
          industry: data.industry,
          location: data.companyAddress,
          size: data.companyType,
          status: data.status,
          contactPerson: data.contactPerson,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          address: data.address,
          description: data.description,
          partnershipDate: data.partnershipDate ? new Date(data.partnershipDate) : null,
        });
        } else {
          toast({
            title: "企业数据加载失败",
            description: response.message || "无法加载企业数据",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "企业数据加载失败",
          description: "请检查网络或稍后重试",
          variant: "destructive",
        });
      }
    };

    fetchEnterpriseData();
  }, [id, form, toast]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // 将前端字段映射到后端需要的格式
      const companyData = {
        companyName: data.name,
        industry: data.industry,
        companyType: data.size, // 将企业规模映射为企业类型
        companyAddress: data.location, // 将location映射为companyAddress
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        description: data.description || '',
        address: data.address || '',
        status: data.status,
        partnershipDate: format(data.partnershipDate, 'yyyy-MM-dd'),
      };

      // 调用真实API
      const response = await api.updateEnterprise(id, companyData);

      if (response.success) {
        // Success handling
        toast({
          title: "编辑成功",
          description: `企业 ${data.name} 已成功更新`,
        });

        // Redirect back to list
        navigate('/enterprises/list');
      } else {
        throw new Error(response.message || '编辑企业失败');
      }
    } catch (error: any) {
      console.error('编辑企业失败:', error);
      toast({
        title: "编辑失败",
        description: error.message || '编辑企业时发生错误，请重试',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!enterpriseData) {
    return <div>加载中...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">编辑企业</CardTitle>
          <CardDescription>编辑已有企业的详细信息</CardDescription>
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
                      <FormLabel>企业名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入企业名称" {...field}  />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所属行业</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择行业" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="互联网">互联网</SelectItem>
                          <SelectItem value="电子商务">电子商务</SelectItem>
                          <SelectItem value="金融">金融</SelectItem>
                          <SelectItem value="教育">教育</SelectItem>
                          <SelectItem value="医疗健康">医疗健康</SelectItem>
                          <SelectItem value="制造业">制造业</SelectItem>
                          <SelectItem value="房地产">房地产</SelectItem>
                          <SelectItem value="通信设备">通信设备</SelectItem>
                          <SelectItem value="消费电子">消费电子</SelectItem>
                          <SelectItem value="其他">其他</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                    <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所在地</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入所在地" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>企业规模</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择企业规模" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-50人">1-50人</SelectItem>
                          <SelectItem value="51-200人">51-200人</SelectItem>
                          <SelectItem value="201-500人">201-500人</SelectItem>
                          <SelectItem value="501-1000人">501-1000人</SelectItem>
                          <SelectItem value="1001-5000人">1001-5000人</SelectItem>
                          <SelectItem value="5000-10000人">5000-10000人</SelectItem>
                          <SelectItem value="10000人以上">10000人以上</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="partnershipDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>合作日期</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "yyyy-MM-dd")
                              ) : (
                                <span>请选择日期</span>
                              )}
                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>合作状态</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择合作状态" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">合作中</SelectItem>
                          <SelectItem value="inactive">暂停合作</SelectItem>
                          <SelectItem value="pending">洽谈中</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">联系信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>联系人</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入联系人姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>联系电话</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入联系电话" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>电子邮箱</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入电子邮箱" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>详细地址</FormLabel>
                        <FormControl>
                          <Input placeholder="请输入详细地址" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>企业描述</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="请输入企业描述信息"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        简要描述企业的主要业务、特点和与本系统的合作关系
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

     

              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/enterprises/list')}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '提交中...' : '保存变更'}
                  {!isSubmitting && <CheckCircle className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditEnterprise;

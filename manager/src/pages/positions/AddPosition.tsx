
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// 表单验证模式
const formSchema = z.object({
  title: z.string().min(1, '职位名称不能为空'),
  companyId: z.string().min(1, '请选择所属企业'),
  location: z.string().min(1, '工作地点不能为空'),
  type: z.string().min(1, '请选择职位类型'),
  jobDescription: z.string().min(1, '工作内容描述不能为空'),
  jobRequirements: z.string().optional(),
  benefits: z.string().optional(),
  minSalary: z.string().optional(),
  maxSalary: z.string().optional(),
  salaryUnit: z.string().default('month'),
  experienceRequired: z.string().optional(),
  educationRequired: z.string().optional(),
  recruitmentCount: z.string().min(1, '招聘人数不能为空'),
});

const AddPosition = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      companyId: '',
      location: '',
      type: '',
      jobDescription: '',
      jobRequirements: '',
      benefits: '',
      minSalary: '',
      maxSalary: '',
      salaryUnit: 'month',
      experienceRequired: '',
      educationRequired: '',
      recruitmentCount: '1',
    }
  });

  // 加载企业列表
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setLoading(true);
        const response = await api.getCompanies({ page: 0, size: 100 });
        if (response.success && response.data) {
          setCompanies(response.data);
        } else {
          toast({
            title: '加载失败',
            description: response.message || '无法加载企业列表',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('加载企业列表失败:', error);
        toast({
          title: '加载失败',
          description: '无法加载企业列表',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const onSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      console.log('Position data:', data);

      // 构建符合后端JobCreateRequest格式的数据
      const jobData = {
        jobTitle: data.title,
        jobDescription: data.jobDescription,
        jobRequirements: data.jobRequirements || '',
        benefits: data.benefits || '',
        jobType: data.type,
        workLocation: data.location,
        minSalary: data.minSalary ? parseFloat(data.minSalary) : 0,
        maxSalary: data.maxSalary ? parseFloat(data.maxSalary) : 0,
        salaryUnit: data.salaryUnit,
        experienceRequired: data.experienceRequired || '',
        educationRequired: data.educationRequired || '',
        skillsRequired: [],
        companyId: data.companyId,
        recruitmentCount: parseInt(data.recruitmentCount) || 1,
      };

      const response = await api.createJob(jobData);

      if (response.success) {
        toast({
          title: '成功',
          description: `职位已成功创建，职位编号：${response.data?.jobId || ''}`,
        });
        navigate('/positions/list');
      } else {
        toast({
          title: '创建失败',
          description: response.message || '职位创建失败',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('创建职位失败:', error);
      toast({
        title: '创建失败',
        description: '网络错误，请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>新增职位</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>职位名称 *</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入职位名称" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所属企业 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择企业" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((company) => (
                            <SelectItem key={company.id || company.companyId} value={company.id || company.companyId}>
                              {company.name || company.companyName}
                            </SelectItem>
                          ))}
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
                      <FormLabel>工作地点 *</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入工作地点" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>职位类型 *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择职位类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">全职</SelectItem>
                          <SelectItem value="internship">实习</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最低薪资</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="请输入最低薪资" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>最高薪资</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="请输入最高薪资" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="salaryUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>薪资单位</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择薪资单位" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="month">月薪</SelectItem>
                          <SelectItem value="year">年薪</SelectItem>
                          <SelectItem value="hour">时薪</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recruitmentCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>招聘人数</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="请输入招聘人数" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experienceRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>经验要求</FormLabel>
                      <FormControl>
                        <Input placeholder="如：1-3年工作经验" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="educationRequired"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学历要求</FormLabel>
                      <FormControl>
                        <Input placeholder="如：本科及以上" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>工作内容描述 *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请详细描述该职位的工作内容、职责和要求"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      请详细描述该职位的工作内容、要求和职责
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobRequirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>职位要求</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入职位的具体要求和条件"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      可选：详细的职位要求和任职条件
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>福利待遇</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入福利待遇，如：五险一金、年终奖、带薪年假等"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      可选：详细的福利待遇和员工福利
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" type="button" onClick={() => navigate('/positions/list')} disabled={submitting}>
                  取消
                </Button>
                <Button type="submit" disabled={submitting || loading}>
                  {submitting ? '创建中...' : '保存'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddPosition;

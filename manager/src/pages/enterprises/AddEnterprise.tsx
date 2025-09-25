import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Upload, Calendar, FileText, Loader2 } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import * as XLSX from 'xlsx';

const formSchema = z.object({
  name: z.string().min(2, { message: '企业名称至少需要2个字符' }),
  industry: z.string().min(1, { message: '请选择行业' }),
  location: z.string().min(2, { message: '所在地至少需要2个字符' }),
  size: z.string().min(1, { message: '请选择企业规模' }),
  partnershipDate: z.date({ required_error: "请选择合作日期" }),
  status: z.string().min(1, { message: '请选择状态' }),
  contactPerson: z.string().min(2, { message: '联系人姓名至少需要2个字符' }),
  contactPhone: z.string().min(11).max(11).optional().or(z.literal('')),
  contactEmail: z.string().email({ message: '请输入有效的电子邮件地址' }).optional().or(z.literal('')),
  address: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const AddEnterprise = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      industry: '',
      location: '',
      size: '',
      status: 'pending',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      description: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const companyData = {
        companyName: data.name,
        industry: data.industry,
        companyType: data.size,
        companyAddress: data.location,
        contactPerson: data.contactPerson,
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        status: data.status || '',
      };
      const response = await api.createCompany(companyData);
      if (response.success) {
        toast({ title: "添加成功", description: `企业 ${data.name} 已成功添加到系统` });
        navigate('/enterprises/target');
      } else {
        throw new Error(response.message || '添加企业失败');
      }
    } catch (error: any) {
      toast({ title: "添加失败", description: error.message || '添加企业时发生错误，请重试', variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleFileUpload = async () => {
  if (!uploadedFile) return;
  setIsUploading(true);
  try {
    const result: string = await api.createCompaniesBulk(uploadedFile); // 返回string
    toast({
      title: '上传成功',
      description: result || '已成功上传企业数据',
    });
    navigate('/enterprises/target');
  } catch (error: any) {
    toast({
      title: '上传失败',
      description: error.message || '上传 Excel 出错',
      variant: 'destructive',
    });
  } finally {
    setIsUploading(false);
    setUploadedFile(null);
  }
};



  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">添加企业</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="manual">手动添加</TabsTrigger>
              <TabsTrigger value="excel">Excel 批量上传</TabsTrigger>
            </TabsList>

            {/* 手动添加 */}
            <TabsContent value="manual">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* 企业信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>企业名称</FormLabel>
                        <FormControl><Input placeholder="请输入企业名称" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="industry" render={({ field }) => (
                      <FormItem>
                        <FormLabel>所属行业</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="请选择行业" /></SelectTrigger></FormControl>
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
                    )}/>
                    <FormField control={form.control} name="location" render={({ field }) => (
                      <FormItem>
                        <FormLabel>所在地</FormLabel>
                        <FormControl><Input placeholder="请输入所在地" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="size" render={({ field }) => (
                      <FormItem>
                        <FormLabel>企业规模</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="请选择企业规模" /></SelectTrigger></FormControl>
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
                    )}/>
                    <FormField control={form.control} name="partnershipDate" render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>合作日期</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "yyyy-MM-dd") : <span>请选择日期</span>}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}/>
                    <FormField control={form.control} name="status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>合作状态</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="请选择合作状态" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="active">合作中</SelectItem>
                            <SelectItem value="inactive">暂停合作</SelectItem>
                            <SelectItem value="pending">洽谈中</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  </div>

                  {/* 联系人信息 */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">联系信息</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField control={form.control} name="contactPerson" render={({ field }) => (
                        <FormItem>
                          <FormLabel>联系人</FormLabel>
                          <FormControl><Input placeholder="请输入联系人姓名" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="contactPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>联系电话</FormLabel>
                          <FormControl><Input placeholder="请输入联系电话" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="contactEmail" render={({ field }) => (
                        <FormItem>
                          <FormLabel>电子邮箱</FormLabel>
                          <FormControl><Input placeholder="请输入电子邮箱" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="address" render={({ field }) => (
                        <FormItem>
                          <FormLabel>详细地址</FormLabel>
                          <FormControl><Input placeholder="请输入详细地址" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}/>
                    </div>
                  </div>

                  {/* 企业描述 */}
                  <div className="border-t pt-6">
                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>企业描述</FormLabel>
                        <FormControl><Textarea placeholder="请输入企业描述信息" className="min-h-[100px]" {...field} /></FormControl>
                        <FormDescription>简要描述企业的主要业务、特点和与本系统的合作关系</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}/>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/enterprises/list')}>取消</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? '提交中...' : '添加企业'}
                      {!isSubmitting && <CheckCircle className="ml-2 h-4 w-4" />}
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            {/* Excel 批量上传 */}
            <TabsContent value="excel">
              <Card>
                <CardHeader>
                  <CardTitle>批量导入企业</CardTitle>
                  <CardDescription>通过上传Excel文件批量添加多家企业</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg border-dashed border-gray-300 p-10 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <FileText className="h-12 w-12 text-muted-foreground" />
                      <div className="space-y-2">
                        <h3 className="font-medium">上传Excel文件</h3>
                        <p className="text-sm text-muted-foreground">
                          支持 .xlsx 和 .xls 格式文件
                        </p>
                      </div>
                      <div className="w-full max-w-sm">
                        <label htmlFor="excel-upload" className="w-full">
                          <Button variant="outline" className="w-full cursor-pointer flex items-center justify-center" asChild>
                            <div>
                              <Upload className="mr-2 h-4 w-4" />
                              选择文件
                            </div>
                          </Button>
                          <input
                            id="excel-upload"
                            type="file"
                            className="hidden"
                            accept=".xlsx,.xls"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {uploadedFile && (
                    <div className="p-4 bg-muted rounded-md flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-6 w-6" />
                        <div>
                          <p className="font-medium">{uploadedFile.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {(uploadedFile.size / 1024).toFixed(2)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => navigate('/enterprises/list')}>取消</Button>
                  <Button disabled={!uploadedFile || isUploading} onClick={handleFileUpload}>
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        正在导入...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        开始导入
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddEnterprise;

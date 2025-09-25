
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Loader2, Globe, Plus, Minus } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

const formSchema = z.object({
  name: z.string().min(2, {
    message: '任务名称至少需要2个字符',
  }),
  targetUrl: z.string().url({
    message: '请输入有效的URL',
  }),
  frequency: z.string({
    required_error: '请选择采集频率',
  }),
  maxPages: z.number().min(1, {
    message: '最大页数至少为1',
  }).max(10000, {
    message: '最大页数不能超过10000',
  }),
  maxDepth: z.number().min(1, {
    message: '最大深度至少为1',
  }).max(10, {
    message: '最大深度不能超过10',
  }),
  userAgent: z.string().optional(),
  timeout: z.number().min(1, {
    message: '超时时间至少为1秒',
  }).max(300, {
    message: '超时时间不能超过300秒',
  }),
  description: z.string().optional(),
  followLinks: z.boolean().default(true),
  respectRobotsTxt: z.boolean().default(true),
  allowedDomains: z.array(z.string()).optional(),
  excludePatterns: z.array(z.string()).optional(),
});

const NewCrawlTask = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>(['']);
  const [excludePatterns, setExcludePatterns] = useState<string[]>(['']);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      targetUrl: '',
      frequency: '',
      maxPages: 100,
      maxDepth: 3,
      userAgent: 'Mozilla/5.0 (compatible; MyCrawler/1.0)',
      timeout: 30,
      description: '',
      followLinks: true,
      respectRobotsTxt: true,
      allowedDomains: [],
      excludePatterns: [],
    },
  });

  const addAllowedDomain = () => {
    setAllowedDomains([...allowedDomains, '']);
  };

  const removeAllowedDomain = (index: number) => {
    const newDomains = [...allowedDomains];
    newDomains.splice(index, 1);
    setAllowedDomains(newDomains);
  };

  const updateAllowedDomain = (index: number, value: string) => {
    const newDomains = [...allowedDomains];
    newDomains[index] = value;
    setAllowedDomains(newDomains);
  };

  const addExcludePattern = () => {
    setExcludePatterns([...excludePatterns, '']);
  };

  const removeExcludePattern = (index: number) => {
    const newPatterns = [...excludePatterns];
    newPatterns.splice(index, 1);
    setExcludePatterns(newPatterns);
  };

  const updateExcludePattern = (index: number, value: string) => {
    const newPatterns = [...excludePatterns];
    newPatterns[index] = value;
    setExcludePatterns(newPatterns);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    // Add filtered domains and patterns to values
    const filteredDomains = allowedDomains.filter(d => d.trim() !== '');
    const filteredPatterns = excludePatterns.filter(p => p.trim() !== '');
    
    const dataToSubmit = {
      ...values,
      allowedDomains: filteredDomains,
      excludePatterns: filteredPatterns,
    };
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    console.log(dataToSubmit);
    
    toast({
      title: '任务创建成功',
      description: `爬虫任务 "${values.name}" 已成功添加到系统`,
    });
    
    setIsSubmitting(false);
    navigate('/crawler/list');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={() => navigate('/crawler/list')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-semibold">新建爬虫任务</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>任务配置</CardTitle>
          <CardDescription>
            配置新的数据采集任务，带 * 的字段为必填项
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">基本设置</TabsTrigger>
                  <TabsTrigger value="advanced">高级设置</TabsTrigger>
                  <TabsTrigger value="filters">过滤规则</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>任务名称 *</FormLabel>
                          <FormControl>
                            <Input placeholder="输入任务名称" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>采集频率 *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择采集频率" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="每小时">每小时</SelectItem>
                              <SelectItem value="每日">每日</SelectItem>
                              <SelectItem value="每周">每周</SelectItem>
                              <SelectItem value="每月">每月</SelectItem>
                              <SelectItem value="一次性">一次性</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="targetUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>目标URL *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Globe className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                                <Input placeholder="https://example.com" className="pl-10" {...field} />
                              </div>
                            </FormControl>
                            <FormDescription>
                              爬虫将从这个URL开始抓取数据
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="maxPages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>最大页数 *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={10000} 
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            最多抓取的页面数量
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxDepth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>最大深度 *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={10} 
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            最大链接跟踪深度
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="md:col-span-2">
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>任务描述</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="输入任务描述"
                                className="min-h-20"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              选填，描述任务目的和数据用途
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="advanced" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="userAgent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User Agent</FormLabel>
                          <FormControl>
                            <Input placeholder="输入User Agent" {...field} />
                          </FormControl>
                          <FormDescription>
                            爬虫请求时使用的用户代理标识
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="timeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>请求超时 (秒)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={300} 
                              {...field} 
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            单个请求的最大等待时间
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="followLinks"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">跟踪链接</FormLabel>
                            <FormDescription>
                              是否跟踪页面中的链接进行深度抓取
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="respectRobotsTxt"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">遵守Robots.txt</FormLabel>
                            <FormDescription>
                              是否遵守网站的robots.txt规则
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="filters" className="pt-4">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">允许的域名</h3>
                      <div className="space-y-2">
                        {allowedDomains.map((domain, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              placeholder="example.com"
                              value={domain}
                              onChange={(e) => updateAllowedDomain(index, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAllowedDomain(index)}
                              disabled={allowedDomains.length === 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addAllowedDomain}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        添加域名
                      </Button>
                      <div className="text-xs text-muted-foreground mt-1">
                        限制爬虫只在这些域名下抓取，留空表示不限制
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">排除模式</h3>
                      <div className="space-y-2">
                        {excludePatterns.map((pattern, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Input
                              placeholder="/path/to/exclude"
                              value={pattern}
                              onChange={(e) => updateExcludePattern(index, e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeExcludePattern(index)}
                              disabled={excludePatterns.length === 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addExcludePattern}
                        className="mt-2"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        添加排除规则
                      </Button>
                      <div className="text-xs text-muted-foreground mt-1">
                        符合这些模式的URL将被排除，可以使用正则表达式
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => navigate('/crawler/list')}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  创建任务
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewCrawlTask;

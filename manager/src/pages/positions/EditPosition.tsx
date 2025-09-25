import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Add Select component for status

import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Position} from "./types";
import { api } from "@/lib/api";

const EditPosition = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);

  const form = useForm({
    defaultValues: {
      title: "",
      company: "",
      location: "",
      type: "",
      jobDescription: "",
      status: "",
      companyId:""
    },
  });

  // 加载职位数据
  useEffect(() => {
    if (!id) return;

    const loadPosition = async () => {
      setLoading(true);
      try {
        const response = await api.getJobById(id);

        if (response.success && response.data) {
          // 转换后端数据格式为前端格式
          const transformedPosition: Position = {
            id: response.data.id || id,
            title: response.data.title || "未知职位",
            company: response.data.company || "未知企业",
            location: response.data.location || "未知地址",
            type: response.data.jobType || "Full Time",
            jobDescription: response.data.jobDescription || "",
            status: response.data.status || "active",
            postDate: response.data.postDate || "",
            applicants: response.data.applicants || 0,
            companyId:response.data.companyId,
          };
          setPosition(transformedPosition);
        } else {
         
        }
      } catch (error) {
       
      } finally {
        setLoading(false);
      }
    };

    loadPosition();
  }, [id, navigate, toast]);

  // 当职位数据加载完成后，更新表单默认值
  useEffect(() => {
    if (position) {
      form.reset({
        title: position.title,
        company: position.company,
        companyId:position.companyId,
        location: position.location,
        type: position.type,
        jobDescription: position.jobDescription,
        status: position.status || "active", // Ensure the default status is set correctly
      });
    }
  }, [position, form]);

const onSubmit = async (data: any) => {
  if (!id) return;

  try {
    // 根据表单提交的 status 转换为后端需要的状态
    let status = 'active'; // 默认值
    switch (data.status) {
      case 'active':
        status = 'opening'; // active -> opening
        break;
      case 'filled':
        status = 'closed'; // filled -> closed
        break;
      case 'inactive':
        status = 'suspended'; // inactive -> suspended
        break;
      default:
        status = 'active'; // 默认值
    }

    const updateData = {
      jobTitle: data.title,
      jobDescription: data.jobDescription,
      jobRequirements: '',
      jobType: data.type === 'Full Time Campus' ? 'full-time-campus' : data.type.toLowerCase(),
      workLocation: data.location,
      minSalary: 0,
      maxSalary: 0,
      salaryUnit: 'monthly',
      experienceRequired: '',
      educationRequired: '',
      skillsRequired: [],
      recruitmentCount: 1,
      deadline: null,
      status: status, // 提交时传递转换后的状态
    };

    const response = await api.updateJob(id, updateData);

    if (response.success) {
      toast({
        title: '成功',
        description: '职位信息已成功更新',
      });
      navigate(`/positions/list`);
    } else {
      toast({
        title: '更新失败',
        description: response.message || '更新职位信息时发生错误',
        variant: 'destructive',
      });
    }
  } catch (error) {
    console.error('更新职位失败:', error);
    toast({
      title: '更新失败',
      description: '网络错误，请重试',
      variant: 'destructive',
    });
  }
};


  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">正在加载职位信息...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!position) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">未找到该职位信息</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>编辑职位</CardTitle>
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
                      <FormLabel>职位名称</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入职位名称" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>所属企业</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入企业名称" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>工作地点</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入工作地点" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>类型</FormLabel>
                      <FormControl>
                        <Input placeholder="请输入职位类型" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* 新增职位状态选择框 */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>职位状态</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择状态" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">正在招聘</SelectItem>
                          <SelectItem value="inactive">已关闭</SelectItem>
                          <SelectItem value="filled">已招满</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>工作内容描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入职位描述内容"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      请详细描述该职位的工作内容、要求和职责
                    </FormDescription>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate(`/positions/${id}`)}
                >
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditPosition;

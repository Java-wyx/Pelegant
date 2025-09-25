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
const EditEnterprise = () => {
  const { id } = useParams(); // 获取企业ID
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enterpriseData, setEnterpriseData] = useState<any | null>(null);

  const form = useForm({
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
      updatedAt: null,
      createdAt: null,
    },
  });

  useEffect(() => {
    const fetchEnterpriseData = async () => {
      try {
        const response = await api.getCompanyById(id);
        if (response.success) {
          const data = response.data;
          setEnterpriseData(data);

          const createdAtDate = data.createdAt ? new Date(data.createdAt) : null;
          if (isNaN(createdAtDate.getTime())) {
            // 如果解析失败，可以尝试修正格式
            const fixedCreatedAtDate = new Date(data.createdAt.replace('T', ' ').replace(/\..+/, ''));
            if (!isNaN(fixedCreatedAtDate.getTime())) {
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
                updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
                createdAt: fixedCreatedAtDate,
              });
            } else {
              console.log("日期解析失败", data.createdAt);
            }
          } else {
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
              updatedAt: data.updatedAt ? new Date(data.updatedAt) : null,
              createdAt: createdAtDate,
            });
          }
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
  }, [id, toast, form]);

  if (!enterpriseData) {
    return <div>加载中...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">企业详情</CardTitle>
          <CardDescription>查看企业的详细信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 企业名称 */}
              <div className="form-item">
                <label className="block text-sm font-medium">企业名称</label>
                <div className="mt-1 text-lg">{enterpriseData.companyName}</div>
              </div>

              {/* 所属行业 */}
              <div className="form-item">
                <label className="block text-sm font-medium">所属行业</label>
                <div className="mt-1 text-lg">{enterpriseData.industry}</div>
              </div>

              {/* 所在地 */}
              <div className="form-item">
                <label className="block text-sm font-medium">所在地</label>
                <div className="mt-1 text-lg">{enterpriseData.companyAddress}</div>
              </div>

              {/* 企业规模 */}
              <div className="form-item">
                <label className="block text-sm font-medium">企业规模</label>
                <div className="mt-1 text-lg">{enterpriseData.companyType}</div>
              </div>

              {/* 合作日期 */}
              <div className="form-item">
                <label className="block text-sm font-medium">更新日期</label>
                <div className="mt-1 text-lg">
                  {enterpriseData.updatedAt && !isNaN(new Date(enterpriseData.updatedAt).getTime()) 
                    ? format(new Date(enterpriseData.updatedAt), 'yyyy-MM-dd') 
                    : '无效日期'}
                </div>
              </div>

              {/* 创建日期 */}
              <div className="form-item">
                <label className="block text-sm font-medium">创建日期</label>
                <div className="mt-1 text-lg">
                  {enterpriseData.createdAt && !isNaN(new Date(enterpriseData.createdAt).getTime()) 
                    ? format(new Date(enterpriseData.createdAt), 'yyyy-MM-dd') 
                    : '无效日期'}
                </div>
              </div>

              {/* 合作状态 */}
              <div className="form-item">
                <label className="block text-sm font-medium">合作状态</label>
                <div className="mt-1 text-lg">{enterpriseData.status}</div>
              </div>
            </div>

            {/* 联系信息 */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">联系信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 联系人 */}
                <div className="form-item">
                  <label className="block text-sm font-medium">联系人</label>
                  <div className="mt-1 text-lg">{enterpriseData.contactPerson}</div>
                </div>

                {/* 联系电话 */}
                <div className="form-item">
                  <label className="block text-sm font-medium">联系电话</label>
                  <div className="mt-1 text-lg">{enterpriseData.contactPhone}</div>
                </div>

                {/* 电子邮箱 */}
                <div className="form-item">
                  <label className="block text-sm font-medium">电子邮箱</label>
                  <div className="mt-1 text-lg">{enterpriseData.contactEmail}</div>
                </div>

                {/* 详细地址 */}
                <div className="form-item">
                  <label className="block text-sm font-medium">详细地址</label>
                  <div className="mt-1 text-lg">{enterpriseData.address}</div>
                </div>
              </div>
            </div>

            {/* 企业描述 */}
            <div className="border-t pt-6">
              <div className="form-item">
                <label className="block text-sm font-medium">企业描述</label>
                <div className="mt-1 text-lg">{enterpriseData.description}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditEnterprise;

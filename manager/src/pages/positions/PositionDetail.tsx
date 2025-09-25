
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Briefcase, MapPin, Calendar, Clock, Users, Building, BadgeDollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

interface Position {
  id: string; // 改为string类型以匹配自定义jobId
  title: string;
  company: string;
  location: string;
  type: string;
  salary: string;
  experience: string;
  education: string;
  status:  string;
  postDate: string;
  applicants: number;
  description: string;
  requirements: string[];
  benefits: string[];
  companyId:string;
}



const PositionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [position, setPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const loadPosition = async () => {
      setLoading(true);
      try {
        const response = await api.getJobById(id);

        if (response.success && response.data) {
          // 转换后端数据格式为前端格式
          const transformedPosition: Position = {
            id: response.data.jobId || response.data.id || id, // 使用jobId作为主要ID
            title: response.data.jobTitle || '未知职位',
            company: response.data.companyName || '未知企业',
            location: response.data.workLocation || '未知地址',
            type: response.data.jobType || 'Full Time',
            salary: response.data.minSalary && response.data.maxSalary
              ? `${response.data.minSalary}k-${response.data.maxSalary}k/${response.data.salaryUnit === 'month' ? '月' : response.data.salaryUnit === 'year' ? '年' : '小时'}`
              : '面议',
            experience: response.data.experienceRequired || '不限',
            education: response.data.educationRequired || '不限',
            status: response.data.status,
            postDate: response.data.createdAt ? new Date(response.data.createdAt).toLocaleDateString() : '',
            applicants: response.data.applicants || 0,
            description: response.data.jobDescription || '',
            requirements: response.data.jobRequirements ? response.data.jobRequirements.split('\n').filter(req => req.trim()) : [],
            benefits: response.data.benefits ? response.data.benefits.split('\n').filter(benefit => benefit.trim()) : [],
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

  const getStatusBadge = (status: Position['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">招聘中</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">已暂停</Badge>;
      case 'filled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">已招满</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!position) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/positions/list')} className="flex items-center">
          <ChevronLeft className="mr-1 h-4 w-4" />
          返回列表
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/positions/edit/${id}`)}>
            <Edit className="mr-2 h-4 w-4" />
            编辑职位
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{position.title}</h1>
                {getStatusBadge(position.status)}
              </div>
              <CardDescription className="text-base">{position.company}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>{position.location}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>{position.type}</span>
            </div>
            <div className="flex items-center">
              <BadgeDollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>{position.salary}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
              <span>发布于: {position.postDate}</span>
            </div>
          </div>

          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h2 className="font-semibold text-lg mb-2">职位描述</h2>
                <p className="text-muted-foreground whitespace-pre-line">{position.description}</p>
              </div>
              
              <div>
                <h2 className="font-semibold text-lg mb-2">职位要求</h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {position.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h2 className="font-semibold text-lg mb-2">福利待遇</h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {position.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">职位信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">工作经验</span>
                    <span className="font-medium">{position.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">学历要求</span>
                    <span className="font-medium">{position.education}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">已申请人数</span>
                    <span className="font-medium">{position.applicants}人</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">公司信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-3">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{position.company}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{position.location}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button variant="outline" className="w-full" onClick={() => navigate(`/enterprises/${position.companyId}`)}>
                    查看公司详情
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PositionDetail;

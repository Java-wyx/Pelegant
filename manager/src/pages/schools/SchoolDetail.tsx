
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { School, transformSchoolFromBackend } from './types';
import PasswordDialog from './components/PasswordDialog';
import { api } from '@/lib/api';
import * as XLSX from 'xlsx'; // 引入 xlsx

const SchoolDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [school, setSchool] = useState<School | null>(null);

  const [loading, setLoading] = useState(true);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);



  

  useEffect(() => {
    const loadSchoolDetail = async () => {
      if (!id) {
        toast({
          title: '错误',
          description: '学校ID不存在',
          variant: 'destructive',
        });
        navigate('/schools/list');
        return;
      }

      try {
        setLoading(true);
        const response = await api.getSchoolById(id);

        if (response.success && response.data) {
          const transformedSchool = transformSchoolFromBackend(response.data);
          setSchool(transformedSchool);
        } else {
          toast({
            title: '加载失败',
            description: response.message || '无法加载学校详情',
            variant: 'destructive',
          });
          navigate('/schools/list');
        }
      } catch (error) {
        console.error('加载学校详情失败:', error);
        toast({
          title: '加载失败',
          description: '网络错误，请重试',
          variant: 'destructive',
        });
        navigate('/schools/list');
      } finally {
        setLoading(false);
      }
    };

    loadSchoolDetail();
  }, [id, navigate, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>学校信息未找到</p>
      </div>
    );
  }

  const getStatusBadge = (status: School['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">运行中</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">暂停招生</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">待审核</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const handleSetPassword = (isReset: boolean = false) => {
    setIsPasswordReset(isReset);
    setPasswordDialogOpen(true);
  };

  const handlePasswordConfirm = (password: string) => {
    toast({
      title: isPasswordReset ? '密码重置成功' : '初始密码设置成功',
      description: `管理员${isPasswordReset ? '新' : '初始'}密码已成功${isPasswordReset ? '重置' : '设置'}`,
    });
    setPasswordDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/schools/list')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">学校详情</h2>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => navigate(`/schools/edit/${id}`)}>
            编辑信息
          </Button>
          {school.hasInitialPassword ? (
            <Button variant="secondary" onClick={() => handleSetPassword(true)}>
              重置管理员密码
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => handleSetPassword(false)}>
              设置管理员初始密码
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">{school.name}</h3>
            {getStatusBadge(school.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">学校类型</h4>
                <p>{school.type}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">位置</h4>
                <p>{school.location}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">创建日期</h4>
                <p>{school.createdAt}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">管理员邮箱</h4>
                <p>{school.adminEmail}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">密码状态</h4>
                <p>{school.hasInitialPassword ? '已设置' : '未设置'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground">状态</h4>
                <p>{school.status === 'active' ? '运行中' : school.status === 'inactive' ? '暂停招生' : '待审核'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PasswordDialog 
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onConfirm={handlePasswordConfirm}
        schoolName={school.name}
        adminEmail={school.adminEmail}
        isReset={isPasswordReset}
        
      />
    </div>
  );
};

export default SchoolDetail;

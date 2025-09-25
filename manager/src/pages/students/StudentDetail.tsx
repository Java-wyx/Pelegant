
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { mockStudents, Student } from './types';
import { api } from '@/lib/api';

const StudentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

// 查看简历功能
const viewResume = (studentData: Student) => {
  if (!studentData.resume) {
    toast({
      title: '无法查看简历',
      description: '该学生尚未上传简历',
      variant: 'destructive',
    });
    return;
  }

  try {
    const backendUrl = window.location.origin.replace(/:\d+$/, ":8080"); // 自动替换为后端端口
    let resumeUrl: string;

    if (studentData.resume.startsWith('http')) {
      // 完整URL直接打开
      resumeUrl = studentData.resume;
    } else {
      // 统一处理相对路径和文件名
      let path = studentData.resume.replace(/\\/g, '/'); // 替换反斜杠

      if (!path.startsWith('/api/files')) {
        if (path.startsWith('/uploads/')) {
          path = `/api/files${path}`;
        } else {
          path = `/api/files/uploads/resumes/${path}`;
        }
      }

      resumeUrl = `${backendUrl}${path}`;
    }

    // 在新窗口中打开简历
    window.open(resumeUrl, '_blank');
  } catch (error) {
    console.error('查看简历失败:', error);
    toast({
      title: '查看简历失败',
      description: '无法访问简历文件，请稍后重试',
      variant: 'destructive',
    });
  }
};


  // 转换后端数据格式为前端格式
  const transformStudentFromBackend = (backendStudent: any): Student => {
    // 根据学校ID获取学校名称
   

    return {
      id: backendStudent.id || backendStudent._id,
      name: backendStudent.fullName || backendStudent.name || '未知姓名',
      gender: backendStudent.gender === 'Male' ? '男' :
              backendStudent.gender === 'Female' ? '女' :
              backendStudent.gender || '未知',
      university: backendStudent.university,
      major: backendStudent.major || '未知专业',
      grade: backendStudent.enrollmentYear ? `${backendStudent.enrollmentYear}级` : '未知年级',
      status: backendStudent.status || 'active',
      enrollmentDate: backendStudent.createdAt || backendStudent.createTime || '',
      resume: backendStudent.resumePath || backendStudent.resume || '',
      description: backendStudent.bio || backendStudent.description || '',
      contactInfo: {
        email: backendStudent.email || '',
        phone: backendStudent.phone || '',
        address: backendStudent.address || ''
      },
      academicInfo: {
        gpa: backendStudent.gpa || 0,
        awards: backendStudent.awards || [],
        projects: backendStudent.projects || []
      }
    };
  };

  useEffect(() => {
    const loadStudentDetail = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.getStudentById(id);

        if (response.success && response.data) {
          const transformedStudent = transformStudentFromBackend(response.data);
          setStudent(transformedStudent);
        } else {
          toast({
            title: '加载失败',
            description: response.message || '无法加载学生详情',
            variant: 'destructive',
          });
          // 如果API调用失败，尝试使用模拟数据作为备用
          const foundStudent = mockStudents.find(s => s.id === parseInt(id, 10));
          setStudent(foundStudent || null);
        }
      } catch (error) {
        console.error('加载学生详情失败:', error);
        toast({
          title: '加载失败',
          description: '网络错误，使用模拟数据',
          variant: 'destructive',
        });
        // 如果网络错误，使用模拟数据作为备用
        const foundStudent = mockStudents.find(s => s.id === parseInt(id, 10));
        setStudent(foundStudent || null);
      } finally {
        setLoading(false);
      }
    };

    loadStudentDetail();
  }, [id, toast]);

  const getStatusBadge = (status: Student['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">在读</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">休学</Badge>;
      case 'graduate':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">已毕业</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-3xl">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <div className="text-muted-foreground">正在加载学生信息...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-3xl">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">未找到学生信息</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/students/list')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回学生列表
      </Button>

      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{student.name}</CardTitle>
              <CardDescription className="mt-1.5">{student.university} · {student.major}</CardDescription>
            </div>
            {getStatusBadge(student.status)}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* 基本信息表格，与列表视图一致 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">学生姓名</div>
              <div>{student.name}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">性别</div>
              <div>{student.gender}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">所属大学</div>
              <div>{student.university}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">专业</div>
              <div>{student.major}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">年级</div>
              <div>{student.grade}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">状态</div>
              <div>{getStatusBadge(student.status)}</div>
            </div>
          </div>
          
          {/* 联系信息 - 只保留邮箱 */}
          {student.contactInfo?.email && (
            <>
              <Separator />
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">联系方式</div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{student.contactInfo.email}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
        
        <CardFooter className="border-t p-4">
          {student.resume ? (
            <Button variant="outline" onClick={() => viewResume(student)}>
              <FileText className="mr-2 h-4 w-4" />
              查看简历
            </Button>
          ) : (
            <div className="text-sm text-muted-foreground">未上传简历</div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default StudentDetail;

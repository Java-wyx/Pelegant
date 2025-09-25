import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { mockStudents, Student } from './types';
import StudentsListHeader from './components/StudentsListHeader';
import SearchFilterBar from './components/SearchFilterBar';
import StudentsTable from './components/StudentsTable';
import DeleteDialog from './components/DeleteDialog';
import TableFooter from '@/pages/schools/components/TableFooter';
import { api } from '@/lib/api';
import * as XLSX from 'xlsx'; // 引入 xlsx


const StudentsList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const handleExportToExcel = () => {
    // 获取选中的学校数据
    const selectedData = students.filter(school => selectedStudents.includes(school.id));
  
    if (selectedData.length === 0) {
      toast({
        title: '没有选中学生',
        description: '请先选择学生再导出',
        variant: 'destructive',
      });
      return;
    }
  
    // 使用 XLSX 生成工作表
    const ws = XLSX.utils.json_to_sheet(selectedData.map(student => ({
      学号: student.id,
      学生姓名: student.name,
      所在学校: student.university,
      专业: student.major,
      入学年份: student.enrollmentDate ,
      状态: student.status,
      邮箱地址:student.contactInfo.email,
      手机电话:student.contactInfo.phone,
      激活状态:student.isFirstLogin
    })));
  
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '学生列表');
  
    // 下载文件
    XLSX.writeFile(wb, '学生列表.xlsx');
  };

  // 根据学校ID获取学校名称
  const getUniversityName = (schoolId: string) => {
    if (!schoolId) return '未知学校';

    const school = schools.find(s => s.schoolId === schoolId);
    return school ? school.universityName : '未知学校';
  };

  // 转换后端数据格式为前端格式
  const transformStudentFromBackend = (backendStudent: any): Student => {

    return {
      id: backendStudent.id || backendStudent._id,
      name: backendStudent.fullName || backendStudent.name || '未知姓名',
      gender: backendStudent.gender === 'Male' ? '男' :
              backendStudent.gender === 'Female' ? '女' :
              backendStudent.gender || '未知',
      university: backendStudent.schoolName || getUniversityName(backendStudent.schoolId || backendStudent.schoolid || ''),
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
      },
      isFirstLogin:backendStudent.isFirstLogin
    };
  };

  // 加载学校数据
  const loadSchools = async () => {
    try {
      const response = await api.getSchools();
      if (response.success && response.data) {
        setSchools(response.data);
        console.log('学校数据加载成功:', response.data);
      } else {
        console.error('加载学校数据失败:', response.message);
        toast({
          title: '警告',
          description: '无法加载学校数据，学校名称可能显示不正确',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('加载学校数据失败:', error);
      toast({
        title: '警告',
        description: '网络错误，无法加载学校数据',
        variant: 'destructive',
      });
    }
  };

  // 加载学生数据
  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await api.getStudents();
      if (response.success && response.data) {
        // 转换后端数据格式为前端格式
        const transformedStudents: Student[] = response.data.map(transformStudentFromBackend);
        setStudents(transformedStudents);
        console.log('学生数据加载成功:', transformedStudents);
      } else {
        toast({
          title: '加载失败',
          description: response.message || '无法加载学生数据',
          variant: 'destructive',
        });
        // 如果API调用失败，使用模拟数据作为备用
        setStudents(mockStudents);
      }
    } catch (error) {
      console.error('加载学生失败:', error);
      toast({
        title: '加载失败',
        description: '网络错误，使用模拟数据',
        variant: 'destructive',
      });
      // 如果网络错误，使用模拟数据作为备用
      setStudents(mockStudents);
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时加载数据
  useEffect(() => {
    const loadData = async () => {
      // 先加载学校数据，再加载学生数据
      await loadSchools();
      await loadStudents();
    };
    loadData();
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.major.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student.id));
    }
  };

  const handleSelectStudent = (id: number) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(selectedStudents.filter(studentId => studentId !== id));
    } else {
      setSelectedStudents([...selectedStudents, id]);
    }
  };

  const handleDelete = (id: number) => {
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (studentToDelete) {
      setStudents(students.filter(student => student.id !== studentToDelete));
      toast({
        title: '删除成功',
        description: '大学生信息已成功删除',
      });
    }
    setDeleteDialogOpen(false);
    setStudentToDelete(null);
  };

  const handleDownloadResumes = () => {
    // 获取所有选中且有简历的学生
    const studentsWithResumes = students.filter(
      student => selectedStudents.includes(student.id) && student.resume
    );
    
    if (studentsWithResumes.length === 0) {
      toast({
        title: '无可下载简历',
        description: '所选学生中没有可下载的简历',
        variant: 'destructive'
      });
      return;
    }
   
    
    // 打开简历链接并显示提示
    studentsWithResumes.forEach(student => {
    const backendUrl = window.location.origin.replace(/:\d+$/, ":8080");  // 将端口替换为后端端口
    const resumeFile = `${backendUrl}/api/files${student.resume.replace(/\\/g, '/')}`;
      if (student.resume) {
        window.open(resumeFile,'_blank');
      }
    });
    
    // 显示下载成功信息
    toast({
      title: '简历下载成功',
      description: studentsWithResumes.length === 1 
        ? `${studentsWithResumes[0].name}的简历已成功下载` 
        : `已成功下载 ${studentsWithResumes.length} 份简历`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载学生数据...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <StudentsListHeader />
          <div className="mt-6">
            <SearchFilterBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              setStudents={setStudents}
              mockStudents={students}
             handleExportToExcel={handleExportToExcel}
            />
            <StudentsTable
              filteredStudents={filteredStudents}
              selectedStudents={selectedStudents}
              handleSelectAll={handleSelectAll}
              handleSelectStudent={handleSelectStudent}
              handleDelete={handleDelete}
              handleDownloadResumes={handleDownloadResumes}
            />
          </div>
        </CardContent>
        <CardFooter className="px-0 py-0">
          <TableFooter
            filteredCount={filteredStudents.length}
            totalCount={students.length}
          />
        </CardFooter>
      </Card>

      <DeleteDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
        onConfirm={confirmDelete} 
      />
    </div>
  );
};

export default StudentsList;

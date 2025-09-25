/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:10:39
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-08-26 16:32:49
 * @FilePath: \pelegant\src\pages\schools\SchoolsList.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import components
import SchoolsListHeader from './components/SchoolsListHeader';
import SearchFilterBar from './components/SearchFilterBar';
import SchoolsTable from './components/SchoolsTable';
import TableFooter from './components/TableFooter';
import DeleteDialog from './components/DeleteDialog';
import PasswordDialog from './components/PasswordDialog';

// Import types and API
import { School, transformSchoolFromBackend, mockSchools, generateRandomPassword } from './types';
import { api } from '@/lib/api';
import * as XLSX from 'xlsx'; // 引入 xlsx

const SchoolsList = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
    const [allSchools, setallSchools] = useState<School[]>([]); // 原始数据
  const [selectedSchools, setSelectedSchools] = useState<string[]>([]); // 改为string[]以匹配新的ID类型
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState<string | null>(null); // 改为string
  const [schoolToSetPassword, setSchoolToSetPassword] = useState<string | null>(null); // 改为string
  const [batchPasswordMode, setBatchPasswordMode] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const { toast } = useToast();

const handleExportToExcel = () => {
  // 获取选中的学校数据
  const selectedData = schools.filter(school => selectedSchools.includes(school.id));

  if (selectedData.length === 0) {
    toast({
      title: '没有选中学校',
      description: '请先选择学校再导出',
      variant: 'destructive',
    });
    return;
  }

  // 使用 XLSX 生成工作表
  const ws = XLSX.utils.json_to_sheet(selectedData.map(school => ({
    学校名称: school.name,
    类型: school.type,
    所在地区: school.location,
    管理员邮箱: school.adminEmail,
    是否启用: school.status ? '启用' : '禁用', // 示例字段，可以根据需要调整
    学校ID: school.id, // 包含学校ID作为一个字段
    创建时间:school.createdAt,
    学校网址:school.website,
    学校描述:school.description
  })));

  // 创建工作簿
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '学校列表');

  // 下载文件
  XLSX.writeFile(wb, '学校列表.xlsx');
};


  

  // 加载学校数据
  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await api.getSchools();
      if (response.success && response.data) {
        // 转换后端数据格式为前端格式
        const transformedSchools: School[] = response.data.map(transformSchoolFromBackend);
        setSchools(transformedSchools);
      } else {
        toast({
          title: '加载失败',
          description: response.message || '无法加载学校数据',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('加载学校失败:', error);
      toast({
        title: '加载失败',
        description: '网络错误，请重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  

  // 组件挂载时加载数据
  useEffect(() => {
    loadSchools();
  }, []);

    // 处理筛选状态的变化
const handleFilterChange = (status: string) => {
  let filteredSchools = allSchools; // 默认使用所有学校数据

  // 如果筛选状态有值，基于状态进行筛选
  if (status && status !== 'all') {
    filteredSchools = allSchools.filter(school => school.status === status);
  }

  setSchools(filteredSchools); // 更新学校列表
};



  // 处理导出
  const handleExport = () => {
    toast({
      title: '导出功能',
      description: '导出功能正在开发中',
    });
  };

  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedSchools.length === filteredSchools.length) {
      setSelectedSchools([]);
    } else {
      setSelectedSchools(filteredSchools.map(school => school.id));
    }
  };

  const handleSelectSchool = (id: string) => {
    if (selectedSchools.includes(id)) {
      setSelectedSchools(selectedSchools.filter(schoolId => schoolId !== id));
    } else {
      setSelectedSchools([...selectedSchools, id]);
    }
  };

  const handleDelete = (id: string) => {
    setSchoolToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleBatchDelete = async () => {
    if (selectedSchools.length > 0) {
      try {
        // 批量删除学校
        const deletePromises = selectedSchools.map(schoolId => api.deleteSchool(schoolId));
        await Promise.all(deletePromises);

        // 重新加载数据
        await loadSchools();
        setSelectedSchools([]);

        toast({
          title: '批量删除成功',
          description: `已成功删除${selectedSchools.length}所学校`,
        });
      } catch (error) {
        console.error('批量删除学校失败:', error);
        toast({
          title: '删除失败',
          description: '批量删除学校时发生错误',
          variant: 'destructive',
        });
      }
    }
  };

  const handleSetPassword = (id: string, isReset: boolean = false) => {
    setSchoolToSetPassword(id);
    setBatchPasswordMode(false);
    setIsPasswordReset(isReset);
    setPasswordDialogOpen(true);
  };

  const handleBatchSetPassword = (isReset: boolean = false) => {
    setBatchPasswordMode(true);
    setIsPasswordReset(isReset);
    setPasswordDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (schoolToDelete) {
      try {
        const response = await api.deleteSchool(schoolToDelete);

        if (response.success) {
          // 重新加载数据
          await loadSchools();
          toast({
            title: '删除成功',
            description: '学校信息已成功删除',
          });
        } else {
          toast({
            title: '删除失败',
            description: response.message || '删除学校时发生错误',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('删除学校失败:', error);
        toast({
          title: '删除失败',
          description: '删除学校时发生错误',
          variant: 'destructive',
        });
      }
    }
    setDeleteDialogOpen(false);
    setSchoolToDelete(null);
  };

  const confirmSetPassword = (result: any) => {
    // API调用已在PasswordDialog中完成，这里处理UI更新
    if (result && result.successCount > 0) {
      // 更新学校状态，标记为已设置密码
      if (batchPasswordMode) {
        const successSchoolIds = result.successDetails?.map((detail: any) => detail.schoolId) || selectedSchools;
        const updatedSchools = schools.map(school => {
          if (successSchoolIds.includes(school.id)) {
            return { ...school, hasInitialPassword: true };
          }
          return school;
        });
        setSchools(updatedSchools);

        // 清空选择
        setSelectedSchools([]);
      } else if (schoolToSetPassword) {
        setSchools(schools.map(school =>
          school.id === schoolToSetPassword
            ? { ...school, hasInitialPassword: true }
            : school
        ));
      }
    }

    setPasswordDialogOpen(false);
    setSchoolToSetPassword(null);
    setBatchPasswordMode(false);
    setIsPasswordReset(false);
  };

  const currentSchool = schoolToSetPassword 
    ? schools.find(school => school.id === schoolToSetPassword) 
    : null;
    
  // Count schools that need initial password vs reset
  const schoolsWithoutPassword = selectedSchools.filter(id => 
    !schools.find(school => school.id === id)?.hasInitialPassword
  ).length;

  const schoolsWithPassword = selectedSchools.length - schoolsWithoutPassword;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <SchoolsListHeader />
        </CardHeader>
        <CardContent>
          <SearchFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onFilterChange={handleFilterChange}
            handleFilterChange={handleFilterChange}  // 传递筛选处理函数
            onExport={handleExport}
            handleExportToExcel={handleExportToExcel} 
  
          />
          
          {selectedSchools.length > 0 && (
            <div className="flex items-center justify-between py-3 px-2 mb-2 bg-muted rounded-md">
              <div className="text-sm">
                已选择 <span className="font-medium">{selectedSchools.length}</span> 所学校
              </div>
              <div className="flex space-x-2">
                {schoolsWithoutPassword > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBatchSetPassword(false)}
                  >
                    批量设置初始密码 ({schoolsWithoutPassword})
                  </Button>
                )}
                {schoolsWithPassword > 0 && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBatchSetPassword(true)}
                  >
                    批量重置密码 ({schoolsWithPassword})
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={handleBatchDelete}
                >
                  批量删除
                </Button>
              </div>
            </div>
          )}
          
          <SchoolsTable 
            filteredSchools={filteredSchools}
            selectedSchools={selectedSchools}
            handleSelectAll={handleSelectAll}
            handleSelectSchool={handleSelectSchool}
            handleDelete={handleDelete}
            handleSetPassword={handleSetPassword}
            
          />
        </CardContent>
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t">
          <TableFooter
            filteredCount={filteredSchools.length}
            totalCount={schools.length}
          />
        </CardFooter>
      </Card>

      <DeleteDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
      />

      <PasswordDialog
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
        onConfirm={confirmSetPassword}
        schoolName={currentSchool?.name || ''}
        adminEmail={currentSchool?.adminEmail || ''}
        schoolId={schoolToSetPassword || undefined}
        schoolIds={batchPasswordMode ? selectedSchools : undefined}
        isMultiple={batchPasswordMode}
        count={selectedSchools.length}
        isReset={isPasswordReset}
      />
    </div>
  );
};

export default SchoolsList;

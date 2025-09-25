
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx'; // 引入 xlsx
import { 
  Eye, 
  Pencil, 
  Plus, 
  Search as SearchIcon, 
  Download, 
  Filter, 
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Briefcase,
  Building,
  Users,
  Backpack
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

interface Enterprise {
  id: number;
  name: string;
  industry: string;
  location: string;
  size: string;
  status: 'active' | 'inactive' | 'pending';
  partnershipDate: string;
  contactPerson: string;
  contactInfo: string;
  campusPositions: number;
  internPositions: number;
  campusApplicants: number;
  internApplicants: number;
  businessActivity: string;
  companyId:string;
}



type SortField = 'name' | 'industry' | 'businessActivity' | 'location' | 'contactPerson' | 'campusPositions' | 'internPositions' | 'partnershipDate' | 'campusApplicants' | 'internApplicants';
type SortDirection = 'asc' | 'desc' | null;

const EnterprisesList = () => {
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnterprises, setSelectedEnterprises] = useState<number[]>([]);
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
const [totalItems, setTotalItems] = useState(0);
const [totalPages, setTotalPages] = useState(1);

   // 导出为 Excel
  const handleExport = () => {
    if (selectedEnterprises.length === 0) {
      toast({
        title: '没有选择企业',
        description: '请勾选企业后再进行导出',
        variant: 'destructive',
      });
      return;
    }

    // 获取选中的企业数据
    const selectedData = enterprises.filter((enterprise) =>
      selectedEnterprises.includes(enterprise.id)
    );

    // 格式化数据为Excel需要的格式
    const excelData = selectedData.map((enterprise) => ({
      企业名称: enterprise.name,
      行业: enterprise.industry,
      类型: enterprise.businessActivity,
      所在地: enterprise.location,
      联系人: enterprise.contactPerson,
      联系方式: enterprise.contactInfo,
      校招岗位: enterprise.campusPositions,
      校招申请人数: enterprise.campusApplicants,
      实习岗位: enterprise.internPositions,
      实习申请人数: enterprise.internApplicants,
      状态: enterprise.status,
      合作日期: enterprise.partnershipDate,
    }));

    // 将数据转为工作表
    const ws = XLSX.utils.json_to_sheet(excelData);

    // 创建工作簿
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '合作企业');

    // 导出工作簿为 Excel 文件
    XLSX.writeFile(wb, '合作企业.xlsx');
  };


  // 转换后端数据格式为前端格式
  const transformEnterpriseFromBackend = (backendEnterprise: any): Enterprise => {
    return {
      id: backendEnterprise.id || backendEnterprise._id,
      name: backendEnterprise.name || '未知企业',
      industry: backendEnterprise.industry || '未知行业',
      location: backendEnterprise.location || '未知地址',
      size: backendEnterprise.size || '未知规模',
      status: backendEnterprise.status || 'active',
      partnershipDate: backendEnterprise.partnershipDate || '',
      contactPerson: backendEnterprise.contactPerson || '未知联系人',
      contactInfo: backendEnterprise.contactInfo || '',
      campusPositions: backendEnterprise.fulltimeCampusJobCount || 0,
      internPositions: backendEnterprise. internJobCount || 0,
      campusApplicants: backendEnterprise.appliedFulltimeCampusCount || 0,
      internApplicants: backendEnterprise.appliedInternCount || 0,
      businessActivity: backendEnterprise.businessActivity || '',
      companyId:backendEnterprise.companyId ||"",
    };
  };

  // 加载企业数据
const loadEnterprises = async (page = currentPage, status?: 'active' | 'inactive' | 'pending') => {
  try {
    setLoading(true);
    const response = await api.getCompanies({
      page,
      size: pageSize,
      search: searchTerm,
      status, // 传给后端
    });

    if (response.success && response.data) {
      const transformedEnterprises = response.data.list.map(transformEnterpriseFromBackend);
      setEnterprises(transformedEnterprises);
      setTotalItems(response.data.list.length);
      setTotalPages(Math.ceil(response.data.total / pageSize));
    }
  } catch (error) {
    console.error('加载企业数据失败:', error);
  } finally {
    setLoading(false);
  }
};

  // 组件挂载时加载数据
useEffect(() => {
  loadEnterprises(currentPage, 'active'); // 默认只显示 active 企业
}, [currentPage, searchTerm]);


  // 搜索时重新加载数据
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setCurrentPage(0);
    loadEnterprises(0, 'active'); // 保持状态筛选
  }, 500);

  return () => clearTimeout(timeoutId);
}, [searchTerm]);


  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field is clicked again
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      // Set new sort field with ascending direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1" />;
    }
    
    return sortDirection === 'asc' 
      ? <ChevronUp className="h-4 w-4 ml-1" /> 
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };

  const filteredEnterprises = enterprises.filter(enterprise => 
    enterprise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enterprise.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enterprise.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enterprise.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enterprise.contactInfo.includes(searchTerm) ||
    enterprise.businessActivity.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort the filtered enterprises
  const sortedEnterprises = [...filteredEnterprises].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;
    
    const fieldA = a[sortField];
    const fieldB = b[sortField];
    
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc'
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    }
    
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sortDirection === 'asc'
        ? fieldA - fieldB
        : fieldB - fieldA;
    }
    
    return 0;
  });

  const handleSelectAll = () => {
    if (selectedEnterprises.length === sortedEnterprises.length) {
      setSelectedEnterprises([]);
    } else {
      setSelectedEnterprises(sortedEnterprises.map(enterprise => enterprise.id));
    }
  };

  const handleSelectEnterprise = (id: number) => {
    if (selectedEnterprises.includes(id)) {
      setSelectedEnterprises(selectedEnterprises.filter(enterpriseId => enterpriseId !== id));
    } else {
      setSelectedEnterprises([...selectedEnterprises, id]);
    }
  };

  const getStatusBadge = (status: Enterprise['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">合作中</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">暂停合作</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">洽谈中</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">正在加载企业数据...</p>
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">合作企业</CardTitle>
              <CardDescription>管理系统中的合作企业信息</CardDescription>
            </div>
            {/* <Button onClick={() => navigate('/enterprises/new')}>
              <Plus className="mr-2 h-4 w-4" />
              添加企业
            </Button> */}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div className="relative w-full sm:w-auto flex-1 max-w-md">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索企业..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex space-x-2 w-full sm:w-auto justify-end">
         
              
              <Button variant="outline" className="h-9" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                导出
              </Button>
            </div>
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedEnterprises.length === sortedEnterprises.length && sortedEnterprises.length > 0} 
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('name')}
                    >
                      企业名称
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('industry')}
                    >
                      行业
                      {getSortIcon('industry')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('businessActivity')}
                    >
                      类型
                      {getSortIcon('businessActivity')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('location')}
                    >
                      所在地
                      {getSortIcon('location')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('contactPerson')}
                    >
                      联系人
                      {getSortIcon('contactPerson')}
                    </Button>
                  </TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('campusPositions')}
                    >
                      校招岗位
                      {getSortIcon('campusPositions')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('campusApplicants')}
                    >
                      校招申请人数
                      {getSortIcon('campusApplicants')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('internPositions')}
                    >
                      实习岗位
                      {getSortIcon('internPositions')}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('internApplicants')}
                    >
                      实习申请人数
                      {getSortIcon('internApplicants')}
                    </Button>
                  </TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      className="p-0 h-auto font-medium flex items-center hover:bg-transparent"
                      onClick={() => handleSort('partnershipDate')}
                    >
                      合作日期
                      {getSortIcon('partnershipDate')}
                    </Button>
                  </TableHead>
                  <TableHead className="w-16 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedEnterprises.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                      没有找到匹配的企业
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedEnterprises.map((enterprise) => (
                    <TableRow key={enterprise.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedEnterprises.includes(enterprise.id)} 
                          onCheckedChange={() => handleSelectEnterprise(enterprise.id)}
                          aria-label={`Select ${enterprise.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{enterprise.name}</TableCell>
                      <TableCell>{enterprise.industry}</TableCell>
                      <TableCell>{enterprise.businessActivity}</TableCell>
                      <TableCell>{enterprise.location}</TableCell>
                      <TableCell>{enterprise.contactPerson}</TableCell>
                      <TableCell>{enterprise.contactInfo}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                          {enterprise.campusPositions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          {enterprise.campusApplicants}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                          {enterprise.internPositions}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                          {enterprise.internApplicants}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(enterprise.status)}</TableCell>
                      <TableCell>{enterprise.partnershipDate}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/enterprises/${enterprise.companyId}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/enterprises/edit/${enterprise.companyId}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
  显示 {enterprises.length} 条，共 {totalItems} 条
</div>

          <div className="flex items-center space-x-6">
           <Button
  variant="outline"
  size="sm"
  disabled={currentPage === 0}
  onClick={() => setCurrentPage(currentPage - 1)}
>
  上一页
</Button>
<div className="text-sm">
  第 <strong>{currentPage + 1}</strong> 页，共 <strong>{totalPages}</strong> 页
</div>
<Button
  variant="outline"
  size="sm"
  disabled={currentPage + 1 >= totalPages}
  onClick={() => setCurrentPage(currentPage + 1)}
>
  下一页
</Button>

          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default EnterprisesList;

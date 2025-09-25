import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import PositionsHeader from './components/PositionsHeader';
import SearchFilterBar from './components/SearchFilterBar';
import PositionsTable from './components/PositionsTable';
import TableFooter from './components/TableFooter';
import { Position, mockPositions } from './types';
import * as XLSX from 'xlsx';
import { api } from '@/lib/api';

type SortField = 'applicants' | null;
type SortOrder = 'asc' | 'desc';

const PAGE_SIZE = 10;

const PositionsList = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // 分页相关
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // 过滤状态（如果需要传后端）
  const [filterStatus, setFilterStatus] = useState<string>('active');

  const { toast } = useToast();

  // —— 导出 —— //
  const handleExportToExcel = () => {
    const selectedData = positions.filter(p => selectedPositions.includes(p.id));
    if (selectedData.length === 0) {
      toast({ title: '没有选中职位', description: '请先选择职位再导出', variant: 'destructive' });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(
      selectedData.map(p => ({
        职位名称: p.title,
        企业: p.company,
        工作地点: p.location,
        类型: p.type,
        描述: p.jobDescription,
        状态: p.status,
        招聘人数: p.applicants,
        发布时间: p.postDate,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '职位列表');
    XLSX.writeFile(wb, '职位列表.xlsx');
  };

  // —— 后端 -> 前端类型转换 —— //
  const transformPositionFromBackend = (b: any): Position => ({
    companyId: b.companyId,
    id: b.id || b.jobId || Math.random().toString(),
    title: b.title || b.jobTitle || '未知职位',
    company: b.company || b.companyName || '未知企业',
    location: b.location || b.workLocation || '未知地址',
    type: b.type || 'Full Time',
    jobDescription: b.jobDescription || '',
    status: b.status || 'active',
    postDate: b.postDate || '',
    applicants: b.applicants ?? 0,
  });




  // —— 拉取数据（带页码） —— //
  const loadPositions = async (page: number) => {
    try {
      setLoading(true);
      const resp = await api.getJobs({
        page: page - 1,          // 后端0基
        size: PAGE_SIZE,
        search: searchTerm,
        status: filterStatus,    // 如后端支持按状态筛选
      });

      if (resp?.success && resp.data?.data) {
        const list = (resp.data.data.jobs || []).map(transformPositionFromBackend);
        const total = resp.data.data.total || 0;

        setPositions(list);
        setTotalCount(total);
        setTotalPages(Math.max(1, Math.ceil(total / PAGE_SIZE)));
      } else {
        toast({ title: '加载失败', description: resp?.message || '无法加载职位数据', variant: 'destructive' });
        setPositions(mockPositions);
        setTotalCount(mockPositions.length);
        setTotalPages(Math.max(1, Math.ceil(mockPositions.length / PAGE_SIZE)));
      }
    } catch (e) {
      console.error('加载职位数据失败:', e);
      toast({ title: '加载失败', description: '网络错误，使用模拟数据', variant: 'destructive' });
      setPositions(mockPositions);
      setTotalCount(mockPositions.length);
      setTotalPages(Math.max(1, Math.ceil(mockPositions.length / PAGE_SIZE)));
    } finally {
      setLoading(false);
    }
  };

  // —— 首次 & 条件变化时加载（注意传页码） —— //
  useEffect(() => {
    loadPositions(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, currentPage]);

  // —— 搜索防抖 —— //
  useEffect(() => {
    const t = setTimeout(() => {
      // 搜索时回到第一页再拉取
      setCurrentPage(1);
      loadPositions(1);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // —— 远端分页场景下，排序建议让后端做；若仍要前端排当前页 —— //
  const sortedPositions = [...positions].sort((a, b) => {
    if (sortField === 'applicants') {
      return sortOrder === 'asc' ? a.applicants - b.applicants : b.applicants - a.applicants;
    }
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  // —— 分页回调 —— //
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // —— 状态筛选（服务端分页推荐传给后端） —— //
  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1); // 切换筛选回到第一页
  };

  // —— 选择 —— //
  const handleSelectAll = () => {
    if (selectedPositions.length === sortedPositions.length) setSelectedPositions([]);
    else setSelectedPositions(sortedPositions.map(p => p.id));
  };
  const handleSelectPosition = (id: string) => {
    setSelectedPositions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
                <p className="text-gray-600">正在加载职位数据...</p>
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
          <PositionsHeader />
        </CardHeader>
        <CardContent>
          <SearchFilterBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            handleFilterChange={handleFilterChange}
            handleExportToExcel={handleExportToExcel}
          />

          <PositionsTable
            positions={sortedPositions}
            selectedPositions={selectedPositions}
            handleSelectPosition={handleSelectPosition}
            handleSelectAll={handleSelectAll}
            sortField={sortField}
            sortOrder={sortOrder}
            handleSort={handleSort}
          />
        </CardContent>
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t">
          <TableFooter
            displayedCount={sortedPositions.length} // 当前页展示条数
            totalCount={totalCount}                  // 全部总数（用于计算总页数）
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </CardFooter>
      </Card>
    </div>
  );
};

export default PositionsList;

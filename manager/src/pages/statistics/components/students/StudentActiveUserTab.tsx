import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SchoolMonthlyTable from './components/SchoolMonthlyTable';
import TablePagination from './components/TablePagination';
import SearchFilterBar from './components/SearchFilterBar';
import { getSchoolActiveUsers } from '@/lib/api'; // 你的接口方法

const itemsPerPage = 5;

const StudentActiveUserTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolData, setSchoolData] = useState<any[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // 获取数据
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getSchoolActiveUsers(searchTerm, currentPage, itemsPerPage);
      if (res.success && res.data) {
        setSchoolData(res.data.schoolActiveUsersData || []);
        setTotalRecords(res.data.totalRecords || 0);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm, currentPage]);

  // 动态生成月份列表
  const monthNames = schoolData[0]?.monthlyData.map(md => md.month) || [];

  // 格式化数据用于表格
  const formattedData = schoolData.map(item => {
    const months: { [key: string]: number } = {};
    item.monthlyData.forEach(md => {
      months[md.month] = md.activeCount;
    });
    return {
      school: item.school,
      months,
      total: item.totalActive
    };
  });

  const totalPages = Math.ceil(totalRecords / itemsPerPage);
  const totalMonthlyActive = formattedData.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>学校近6个月活跃用户详情</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <SearchFilterBar
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              placeholder="搜索学校..."
            />
          </div>

          <SchoolMonthlyTable
            currentItems={formattedData}
            monthNames={monthNames}
            sortField="total"
            sortOrder="desc"
            handleSort={() => {}}
            totalMonthlyActive={totalMonthlyActive}
            sortedData={formattedData}
          />

        <TablePagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={(page: number) => {
    setCurrentPage(page);
  }}
/>

        </CardContent>
      </Card>
    </div>
  );
};

export default StudentActiveUserTab;

import { useState, useEffect } from 'react';
import { getSchoolActiveUsers } from '@/lib/api';
import { SchoolMonthlyActiveData } from './SchoolMonthlyTable';

interface SchoolActiveData {
  school: string;
  monthlyData: { month: string; activeCount: number }[];
  totalActive: number;
}

export const useSchoolMonthlyData = (initialSearchTerm: string = '', initialPage: number = 1, pageSize: number = 5) => {
  const [schoolActiveUsersData, setSchoolActiveUsersData] = useState<SchoolActiveData[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 提取月份（取第一条数据）
  const monthNames = schoolActiveUsersData[0]?.monthlyData.map(md => md.month) || [];

  const fetchData = async (page: number = 1, term: string = '') => {
    try {
      setLoading(true);
      setError(null);

      const res = await getSchoolActiveUsers(term, page, pageSize);
      if (res.success && res.data) {
        setSchoolActiveUsersData(res.data.schoolActiveUsersData || []);
        setTotalRecords(res.data.totalRecords || 0);
      } else {
        setError(res.message || '接口返回数据异常');
      }
    } catch (err: any) {
      setError(err.message || '获取学校活跃用户数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始拉取 & 搜索 term 变化
  useEffect(() => {
    fetchData(1, searchTerm);
    setCurrentPage(1);
  }, [searchTerm]);

  // 翻页
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(page, searchTerm);
  };

  return {
    schoolActiveUsersData,
    totalRecords,
    currentPage,
    pageSize,
    loading,
    error,
    monthNames,
    searchTerm,
    setSearchTerm,
    handlePageChange
  };
};

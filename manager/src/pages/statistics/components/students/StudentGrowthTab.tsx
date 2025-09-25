import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from 'recharts';

interface MonthlyStudentItem {
  name: string;
  value: number;
  percent?: string;
}

const StudentMonthlyNewTab: React.FC = () => {
  const [studentsMonthlyData, setStudentsMonthlyData] = useState<MonthlyStudentItem[]>([]);
  const [totalNewStudents, setTotalNewStudents] = useState<number>(0);
  const [monthlyAverage, setMonthlyAverage] = useState<number>(0);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
useEffect(() => {
  setLoading(true);
  setError(null);

  api.getmonthlyNew()
    .then(res => {
      if (res.success && res.data) {
        const { studentsMonthlyData, totalNewStudents, monthlyAverage, year } = res.data;

        const dataWithPercent = studentsMonthlyData.map(item => ({
          ...item,
          percent: totalNewStudents > 0 ? ((item.value / totalNewStudents) * 100).toFixed(2) + '%' : '0%'
        }));

        setStudentsMonthlyData(dataWithPercent);
        setTotalNewStudents(totalNewStudents);
        setMonthlyAverage(monthlyAverage);
        setYear(year);
      } else {
        setError(res.message || '接口返回数据异常');
      }
    })
    .catch(err => setError(err.message || '获取每月新增学生数据失败'))
    .finally(() => setLoading(false));
}, []);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{year} 年每月新增学生统计</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-gray-500">加载中...</div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">{error}</div>
          ) : studentsMonthlyData.length === 0 ? (
            <div className="text-center py-6 text-gray-400">暂无数据</div>
          ) : (
            <>
             {/* 折线图 */}
              <div className="mt-8" style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={studentsMonthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" name="新增学生" stroke="#4F46E5" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {/* 表格 */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>月份</TableHead>
                    <TableHead>新增学生</TableHead>
                    <TableHead>占比</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsMonthlyData.map(item => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.value}</TableCell>
                      <TableCell>{item.percent}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">年度总计</TableCell>
                    <TableCell className="font-bold">{totalNewStudents}</TableCell>
                    <TableCell className="font-bold">—</TableCell>
                  </TableRow>
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">月均增长</TableCell>
                    <TableCell className="font-bold">{monthlyAverage}</TableCell>
                    <TableCell className="font-bold">—</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

             
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentMonthlyNewTab;

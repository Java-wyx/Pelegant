/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:10:40
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-09-02 16:29:30
 * @FilePath: \pelegant\src\pages\statistics\components\students\StudentUniversityTab.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useEffect, useState } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from '@/lib/api';

interface UniversityDistributionItem {
  continent: string;
  countries: number;
  schools: number;
  students: number;
}

const StudentUniversityTab: React.FC = () => {
  const [universityDistribution, setUniversityDistribution] = useState<UniversityDistributionItem[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setLoading(true);
  setError(null);

  api.getUniversityDistribution()
    .then(res => {
      if (res.success && res.data) {
        const { universityDistribution, totalStudents } = res.data;
        setUniversityDistribution(universityDistribution || []);
        setTotalStudents(totalStudents || 0);
      } else {
        setError(res.message || '接口返回数据异常');
      }
    })
    .catch(err => setError(err.message || '获取学生分布数据失败'))
    .finally(() => setLoading(false));
}, []);


  const totalCountries = universityDistribution.reduce((acc, curr) => acc + curr.countries, 0);
  const totalSchools = universityDistribution.reduce((acc, curr) => acc + curr.schools, 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>University Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-gray-500">加载中...</div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">{error}</div>
          ) : universityDistribution.length === 0 ? (
            <div className="text-center py-6 text-gray-400">暂无数据</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Continent</TableHead>
                  <TableHead>Countries</TableHead>
                  <TableHead>Schools</TableHead>
                  <TableHead>Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {universityDistribution.map((item) => (
                  <TableRow key={item.continent}>
                    <TableCell className="font-medium">{item.continent}</TableCell>
                    <TableCell>{item.countries}</TableCell>
                    <TableCell>{item.schools}</TableCell>
                    <TableCell>{item.students}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-bold">Total</TableCell>
                  <TableCell className="font-bold">{totalCountries}</TableCell>
                  <TableCell className="font-bold">{totalSchools}</TableCell>
                  <TableCell className="font-bold">{totalStudents}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentUniversityTab;

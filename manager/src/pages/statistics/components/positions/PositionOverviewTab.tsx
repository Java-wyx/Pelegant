import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell
} from 'recharts';
import { 
  Briefcase, 
  Building,
  Network,
  Layers
} from 'lucide-react';

// 假设 getJobOverview() 是封装了 API 请求的函数
import { api } from '@/lib/api'; // 导入你的 API 请求函数

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const PositionOverviewTab = () => {
  const [data, setData] = useState(null);

  // 从 API 获取数据
  useEffect(() => {
    api.getJobOverview()  // 调用 getJobOverview 函数
      .then((result) => {
        if (result.success) {
          setData(result.data);  // 将数据保存在 state 中
        }
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, []);

  if (!data) return <div>加载中...</div>;  // 如果数据还在加载中，显示加载中

  // 从 API 返回的数据
  const { locationData, totalPositions, totalInternshipPositions, totalFullTimePositions, companyTypePositions, positionTypeData } = data;

  // 计算全职职位和实习职位的总数
  const totalFullTimePositionsCount = totalFullTimePositions;
  const totalInternshipPositionsCount = totalInternshipPositions;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Positions</CardTitle>
            <Briefcase className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPositions}</div>
            <p className="text-xs text-muted-foreground pt-1">All positions across all companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Full Time Positions</CardTitle>
            <Building className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFullTimePositionsCount}</div>
            <p className="text-xs text-muted-foreground pt-1">
              {((totalFullTimePositionsCount / totalPositions) * 100).toFixed(1)}% of total positions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Internship Positions</CardTitle>
            <Network className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInternshipPositionsCount}</div>
            <p className="text-xs text-muted-foreground pt-1">
              {((totalInternshipPositionsCount / totalPositions) * 100).toFixed(1)}% of total positions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Position Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Position Type Distribution</CardTitle>
          <CardDescription>Breakdown of position types across all companies</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={positionTypeData.map(entry => ({
                    name: entry.type,
                    value: entry.count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {positionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} positions`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Company Types and Positions */}
      <Card>
        <CardHeader>
          <CardTitle>Positions by Company Type</CardTitle>
          <CardDescription>Distribution of positions across different company types</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyTypePositions} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="companyType" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} positions`, 'Count']} />
                <Legend />
                <Bar dataKey="count" name="Positions" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Positions by Location */}
      <Card>
        <CardHeader>
          <CardTitle>Positions by Location</CardTitle>
          <CardDescription>Geographic distribution of positions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={locationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="workLocation" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} positions`, 'Count']} />
                <Legend />
                <Bar dataKey="count" name="Positions" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PositionOverviewTab;

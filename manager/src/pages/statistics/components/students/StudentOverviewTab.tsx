import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, ChevronUp, Globe, Activity } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer
} from 'recharts';
import { ChartContainer } from '@/components/ui/chart';
import { api } from '@/lib/api';

interface StudentData {
  totalStudents: number;
  totalNewStudents: number;
  studentsByGender: {
    male: number;
    female: number;
  };
  studentsByOrigin: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  dailyActiveUsersWeek: Array<{ name: string; value: number }>;
  monthlyActiveUsers6Months: Array<{ name: string; value: number }>;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background p-2 border border-border rounded-md shadow-md">
        <p className="text-sm font-medium">{`${label}`}</p>
        <p className="text-sm text-muted-foreground">
          {`活跃用户: ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

const StudentOverviewTab: React.FC = () => {
  const [data, setData] = useState<StudentData | null>(null);

  useEffect(() => {
  api.getStudentStats()
    .then(res => {
      if (res.success && res.data) {
        setData(res.data);
      } else {
        console.error('获取学生统计数据失败:', res.message);
      }
    })
    .catch(err => console.error('请求学生统计数据失败', err));
}, []);

  if (!data) return <div>加载中...</div>;

  const { totalStudents, totalNewStudents, studentsByGender, studentsByOrigin, dailyActiveUsersWeek, monthlyActiveUsers6Months } = data;

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <User className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs flex items-center mt-1 text-muted-foreground">
              New students this year:
              <span className="font-medium ml-1 flex items-center text-green-500">
                <ChevronUp className="h-3 w-3" /> {totalNewStudents}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Gender Distribution</CardTitle>
            <User className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between mb-2">
              <span className="text-sm">Male:</span>
              <span className="font-medium">
                {studentsByGender.male} ({totalStudents ? Math.round(studentsByGender.male / totalStudents * 100) : 0}%)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Female:</span>
              <span className="font-medium">
                {studentsByGender.female} ({totalStudents ? Math.round(studentsByGender.female / totalStudents * 100) : 0}%)
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Regional Origin</CardTitle>
            <Globe className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            {studentsByOrigin.map(origin => (
              <div key={origin.name} className="flex justify-between text-sm mb-1">
                <span>{origin.name}:</span>
                <span className="font-medium">{origin.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Active Users Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">近一周日活跃用户</CardTitle>
            <Activity className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-0 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActiveUsersWeek} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">近半年月活跃用户</CardTitle>
            <Activity className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent className="pt-0 h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyActiveUsers6Months} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Student Origin Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
            {studentsByOrigin.map((origin) => (
              <div key={origin.name} className="p-4 border-r border-b flex flex-col items-center justify-center">
                <div className="text-sm text-muted-foreground">{origin.name}</div>
                <div className="font-bold text-xl mt-1">{origin.value}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentOverviewTab;

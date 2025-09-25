import { useState, useEffect } from "react";
import { LayoutDashboard, Users, School, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAllData } from '@/lib/api';  // 引入获取数据的函数

const StatCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  color = "text-primary"
}: { 
  title: string; 
  value: string | number; 
  description: string; 
  icon: React.ElementType; 
  trend?: { value: string; positive: boolean };
  color?: string;
}) => (
  <Card className="transition-all hover:shadow-md">
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <CardDescription className="text-xs flex items-center justify-between mt-1">
        <span>{description}</span>
        {trend && (
          <span className={trend.positive ? 'text-green-500' : 'text-red-500'}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </CardDescription>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [data, setData] = useState<any>(null);  // 存储从接口获取的数据
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 使用 useEffect 调用 API 获取数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 调用接口获取数据
        const response = await getAllData();

        if (response.success) {
          setData(response.data);  // 存储数据
        } else {
          setError(response.message);
        }
      } catch (err) {
        setError('数据加载失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 如果正在加载数据，显示 loading 状态
  if (loading) {
    return (
      <div>Loading...</div>
    );
  }

  // 如果数据加载失败，显示错误信息
  if (error) {
    return (
      <div>{error}</div>
    );
  }

  // Helper function to determine the trend
  const getTrend = (percent: string) => {
    const value = parseFloat(percent);
    return {
      value: `${percent}`,
      positive: value > 0
    };
  };

  // 渲染真实数据
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="总用户数" 
          value={data.totalStudents}  // 使用从接口获取的真实数据
          description="系统内注册用户" 
          icon={Users} 
          trend={getTrend(data.totalStudentsincreasePercent)}  // 设置趋势
        />
        <StatCard 
          title="学校数量" 
          value={data.totalSchools}  // 使用从接口获取的真实数据
          description="合作学校机构" 
          icon={School} 
          trend={getTrend(data.totalSchoolsincreasePercent)}  // 设置趋势
          color="text-blue-500"
        />
        <StatCard 
          title="企业数量" 
          value={data.totalCompanies}  // 使用从接口获取的真实数据
          description="已对接企业" 
          icon={Briefcase} 
          trend={getTrend(data.totalCompaniesincreasePercent)}  // 设置趋势
          color="text-purple-500"
        />
        <StatCard 
          title="岗位数量" 
          value={data.totalJobs}  // 使用从接口获取的真实数据
          description="发布职位总数" 
          icon={Briefcase} 
          trend={getTrend(data.totalJobsincreasePercent)}  // 设置趋势
          color="text-amber-500"
        />
      </div>
    </div>
  );
};

export default Dashboard;

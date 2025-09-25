
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  School, 
  Users, 
  Briefcase, 
  ChevronUp, 
  ChevronDown, 
  Download,
  Calendar,
  BarChart3,
  GraduationCap,
  UserRound,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart as ReLineChart, 
  Line, 
  PieChart as RePieChart, 
  Pie, 
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const schoolsData = [
  { name: '一月', value: 15 },
  { name: '二月', value: 8 },
  { name: '三月', value: 12 },
  { name: '四月', value: 10 },
  { name: '五月', value: 18 },
  { name: '六月', value: 14 },
  { name: '七月', value: 12 },
  { name: '八月', value: 9 },
  { name: '九月', value: 16 },
  { name: '十月', value: 11 },
  { name: '十一月', value: 13 },
  { name: '十二月', value: 7 },
];

const studentsData = [
  { name: '一月', value: 320 },
  { name: '二月', value: 210 },
  { name: '三月', value: 290 },
  { name: '四月', value: 380 },
  { name: '五月', value: 450 },
  { name: '六月', value: 520 },
  { name: '七月', value: 490 },
  { name: '八月', value: 210 },
  { name: '九月', value: 350 },
  { name: '十月', value: 410 },
  { name: '十一月', value: 320 },
  { name: '十二月', value: 280 },
];

const usersData = [
  { name: '一月', value: 120 },
  { name: '二月', value: 140 },
  { name: '三月', value: 160 },
  { name: '四月', value: 135 },
  { name: '五月', value: 178 },
  { name: '六月', value: 194 },
  { name: '七月', value: 212 },
  { name: '八月', value: 189 },
  { name: '九月', value: 203 },
  { name: '十月', value: 229 },
  { name: '十一月', value: 247 },
  { name: '十二月', value: 261 },
];

const positionsData = [
  { name: '一月', value: 45 },
  { name: '二月', value: 52 },
  { name: '三月', value: 68 },
  { name: '四月', value: 73 },
  { name: '五月', value: 81 },
  { name: '六月', value: 92 },
  { name: '七月', value: 86 },
  { name: '八月', value: 79 },
  { name: '九月', value: 98 },
  { name: '十月', value: 105 },
  { name: '十一月', value: 112 },
  { name: '十二月', value: 120 },
];

const schoolTypeData = [
  { name: 'Public High School', value: 35 },
  { name: 'Private High School', value: 15 },
  { name: 'Public Middle School', value: 40 },
  { name: 'Private Middle School', value: 20 },
  { name: 'Vocational School', value: 25 },
  { name: 'International School', value: 8 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const userRoles = [
  { name: 'Administrator', value: 15 },
  { name: 'Teacher', value: 120 },
  { name: 'School Admin', value: 45 },
  { name: 'Enterprise User', value: 78 },
  { name: 'System Maintenance', value: 8 },
  { name: 'Data Analyst', value: 22 },
];

const StatCard = ({ 
  title, 
  value, 
  trend, 
  icon: Icon,
  color = "text-primary",
  onClick
}: { 
  title: string; 
  value: string | number; 
  trend: { value: string; positive: boolean }; 
  icon: React.ElementType; 
  color?: string;
  onClick?: () => void;
}) => (
  <Card className="cursor-pointer transition-all hover:shadow-md" onClick={onClick}>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-5 w-5 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs flex items-center mt-1 text-muted-foreground">
        vs last month
        <span className={`font-medium ml-1 flex items-center ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
          {trend.positive ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {trend.value}
        </span>
      </p>
    </CardContent>
  </Card>
);

const StatisticsDashboard = () => {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Data Statistics</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="h-9">
            <Calendar className="mr-2 h-4 w-4" />
            Select Date Range
          </Button>
          <Button variant="outline" size="sm" className="h-9">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Schools" 
          value="243" 
          trend={{ value: "5.2%", positive: true }} 
          icon={School}
          onClick={() => navigate('/statistics/schools')}
        />
        <StatCard 
          title="Students" 
          value="56,789" 
          trend={{ value: "3.8%", positive: true }} 
          icon={GraduationCap}
          color="text-blue-500"
          onClick={() => navigate('/statistics/students')}
        />
        <StatCard 
          title="Users" 
          value="1,458" 
          trend={{ value: "7.5%", positive: true }} 
          icon={UserRound}
          color="text-green-500"
          onClick={() => navigate('/statistics/users')}
        />
        <StatCard 
          title="Positions" 
          value="1,082" 
          trend={{ value: "4.3%", positive: true }} 
          icon={Briefcase}
          color="text-purple-500"
          onClick={() => navigate('/statistics/positions')}
        />
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Growth Trends</CardTitle>
          <CardDescription>Data growth trends over the past 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart
                data={[...Array(12)].map((_, i) => ({
                  name: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][i],
                  Schools: schoolsData[i].value,
                  Students: studentsData[i].value / 30, // Scaled down for visualization
                  Users: usersData[i].value / 10, // Scaled for visualization
                  Positions: positionsData[i].value / 5 // Scaled for visualization
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Schools" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="Students" stroke="#82ca9d" strokeWidth={2} />
                <Line type="monotone" dataKey="Users" stroke="#ff7300" strokeWidth={2} />
                <Line type="monotone" dataKey="Positions" stroke="#0088fe" strokeWidth={2} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/statistics/schools')}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>School Types</CardTitle>
              <CardDescription>Distribution by type</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={schoolTypeData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Schools" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/statistics/users')}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>User Roles</CardTitle>
              <CardDescription>Distribution by role</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userRoles}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" scale="band" />
                  <Tooltip />
                  <Bar dataKey="value" name="Users" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/statistics/students')}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Student Trends</CardTitle>
              <CardDescription>Monthly enrollment</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart
                  data={studentsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Students" stroke="#10b981" strokeWidth={2} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => navigate('/statistics/positions')}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Position Trends</CardTitle>
              <CardDescription>New positions monthly</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ReLineChart
                  data={positionsData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" name="Positions" stroke="#a855f7" strokeWidth={2} />
                </ReLineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StatisticsDashboard;

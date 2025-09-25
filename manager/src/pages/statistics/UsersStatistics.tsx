
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  UserRound, 
  Download, 
  Calendar,
  ChevronUp,
  ChevronDown,
  ArrowRight,
  Shield,
  Users,
  Key
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart, 
  Pie, 
  Cell, 
  Sector 
} from 'recharts';

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

const userRoles = [
  { name: 'Administrator', value: 15 },
  { name: 'Teacher', value: 120 },
  { name: 'School Admin', value: 45 },
  { name: 'Enterprise User', value: 78 },
  { name: 'System Maintenance', value: 8 },
  { name: 'Data Analyst', value: 22 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-midAngle * Math.PI / 180);
  const cos = Math.cos(-midAngle * Math.PI / 180);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`${payload.name}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`${value} (${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};

const UsersStatistics = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">User Statistics</h1>
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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <UserRound className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,458</div>
            <p className="text-xs flex items-center mt-1 text-muted-foreground">
              vs last month
              <span className="font-medium ml-1 flex items-center text-green-500">
                <ChevronUp className="h-3 w-3" />
                7.5%
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,289</div>
            <p className="text-xs flex items-center mt-1 text-muted-foreground">
              vs last month
              <span className="font-medium ml-1 flex items-center text-green-500">
                <ChevronUp className="h-3 w-3" />
                4.2%
              </span>
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">43</div>
            <p className="text-xs flex items-center mt-1 text-muted-foreground">
              vs last month
              <span className="font-medium ml-1 flex items-center text-green-500">
                <ChevronUp className="h-3 w-3" />
                2.1%
              </span>
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Monthly User Growth</CardTitle>
          <CardDescription>New user registrations over the last 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={usersData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name="New Users" stroke="#4ade80" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Role Distribution</CardTitle>
            <CardDescription>Users by role type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={userRoles}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#4ade80"
                    dataKey="value"
                    onMouseEnter={onPieEnter}
                  >
                    {userRoles.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>User Authentication Methods</CardTitle>
            <CardDescription>Distribution by login method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { name: 'Username/Password', count: 864 },
                    { name: 'Google OAuth', count: 378 },
                    { name: 'Microsoft OAuth', count: 165 },
                    { name: 'Apple ID', count: 51 },
                  ]}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" scale="band" />
                  <Tooltip />
                  <Bar dataKey="count" name="Users" fill="#4ade80" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle>Active Users</CardTitle>
            <CardDescription>Most active users this month</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="h-8">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'John Zhang', role: 'Administrator', activity: { value: '98%', positive: true } },
              { name: 'Li Mei', role: 'Teacher', activity: { value: '92%', positive: true } },
              { name: 'Wang Wei', role: 'School Admin', activity: { value: '85%', positive: false } },
              { name: 'Zhao Liu', role: 'Enterprise User', activity: { value: '78%', positive: true } },
              { name: 'Qian Chen', role: 'Data Analyst', activity: { value: '72%', positive: false } },
            ].map((user, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-100 text-green-600 w-6 h-6 rounded-full flex items-center justify-center mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.role}</div>
                  </div>
                </div>
                <div className={`text-xs flex items-center ${user.activity.positive ? 'text-green-500' : 'text-amber-500'}`}>
                  Activity: {user.activity.value}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersStatistics;

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  ChevronUp,
  School,
  Globe,
  MapPin,
  GraduationCap,
  LineChart
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import { api } from '@/lib/api';
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SchoolsStatistics = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.getSchoolStats()
      .then(res => res.success ? setData(res.data) : console.error(res.message))
      .catch(err => console.error("获取学校统计数据失败", err));
  }, []);

  if (!data) return <div>加载中...</div>;

  const monthlyAvg = data.newSchoolsThisYear ? Math.round((data.newSchoolsThisYear / 12) * 10) / 10 : 0;

  return (
    <div className="space-y-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center">
            <School className="mr-2 h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="university" className="flex items-center">
            <GraduationCap className="mr-2 h-4 w-4" /> University
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center">
            <LineChart className="mr-2 h-4 w-4" /> Growth
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Total Schools */}
            <Card>
              <CardHeader className="flex justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Partner Schools</CardTitle>
                <School className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalSchools}</div>
                <p className="text-xs flex items-center mt-1 text-muted-foreground">
                  New schools this year:
                  <span className="font-medium ml-1 flex items-center text-green-500">
                    <ChevronUp className="h-3 w-3" /> {data.newSchoolsThisYear}
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Continents Coverage */}
            <Card>
              <CardHeader className="flex justify-between pb-2">
                <CardTitle className="text-sm font-medium">Continents Coverage</CardTitle>
                <Globe className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.continents?.length}</div>
                <p className="text-xs mt-1 text-muted-foreground">
                  Most schools in 
                  <span className="font-medium ml-1 text-blue-500">
                    {data.mostSchoolsContinent} ({data.mostSchoolsContinentCount})
                  </span>
                </p>
              </CardContent>
            </Card>

            {/* Countries Coverage */}
            <Card>
              <CardHeader className="flex justify-between pb-2">
                <CardTitle className="text-sm font-medium">Countries Coverage</CardTitle>
                <MapPin className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.schoolsByCountry ? Object.keys(data.schoolsByCountry).length : 0}</div>
                <p className="text-xs mt-1 text-muted-foreground">
                  Top country
                  <span className="font-medium ml-1 text-purple-500">
                    {data.topCountry} ({data.topCountryCount})
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Schools by Continent */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
                {Object.entries(data.schoolsByContinent || {}).map(([continent, count]) => (
                  <div key={continent} className="p-4 border-r border-b flex flex-col items-center">
                    <div className="text-sm text-muted-foreground">{continent}</div>
                    <div className="font-bold text-xl mt-1">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* University Tab */}
        <TabsContent value="university" className="space-y-4">
          {/* Schools by Continent */}
          <Card>
            <CardHeader>
              <CardTitle>Schools by Continent</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Continent</TableHead>
                    <TableHead>Schools</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(data.schoolsByContinent || {}).map(([continent, count]) => (
                    <TableRow key={continent}>
                      <TableCell className="font-medium">{continent}</TableCell>
                      <TableCell>{count}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="font-bold">{data.totalSchools}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Schools by Country */}
          <Card>
            <CardHeader>
              <CardTitle>Top Countries by Schools</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rank</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Schools</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(data.schoolsByCountry || {})
                    .sort((a, b) => b[1] - a[1])
                    .map(([country, count], index) => (
                      <TableRow key={country}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{country}</TableCell>
                        <TableCell>{count}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex justify-between items-center">
                <span>Total new schools this year:</span>
                <span className="font-bold text-xl">{data.newSchoolsThisYear}</span>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <ReLineChart
                  data={Object.entries(data.monthlyNewSchools || {}).map(([month, count]) => ({
                    month: `${month}月`,
                    count
                  }))}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                </ReLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
};

export default SchoolsStatistics;

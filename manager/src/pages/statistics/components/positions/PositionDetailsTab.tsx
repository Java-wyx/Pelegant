import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const PositionDetailsTab = () => {
  const [positionType, setPositionType] = useState("fullTime");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getJobDetail()
      .then((result) => {
        if (result.success) {
          setData(result.detailData);
        }
      })
      .catch((error) => console.error('Error fetching data:', error))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return <div className="flex justify-center items-center h-64 text-lg">Loading...</div>;
  if (!data)
    return <div className="flex justify-center items-center h-64 text-lg">No data available</div>;

  const fullTimeChartData = data.fullTimeChartData.map(pos => ({
    name: pos.jobTitle.length > 15 ? `${pos.jobTitle.substring(0, 15)}...` : pos.jobTitle,
    applications: pos.applyCount,
    fullName: pos.jobTitle
  }));

  const internshipChartData = data.internshipChartData.map(pos => ({
    name: pos.jobTitle.length > 15 ? `${pos.jobTitle.substring(0, 15)}...` : pos.jobTitle,
    applications: pos.applyCount,
    fullName: pos.jobTitle
  }));

  const renderChart = (chartData, color) => (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            interval={0} 
            height={60} 
            minTickGap={10} 
          />
          <YAxis />
          <Tooltip 
            formatter={(value) => [value, "Applications"]}
            labelFormatter={(label, props) => props?.[0]?.payload?.fullName ?? label}
          />
          <Legend />
          <Bar dataKey="applications" name="Applications" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderTable = (positions) => (
    <div className="overflow-x-auto max-w-full">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead>Position Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead className="text-right">Applications</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-medium">{position.jobTitle}</TableCell>
              <TableCell>{position.companyName}</TableCell>
              <TableCell className="text-right">{position.applyCount}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-4 space-y-6">
      <Tabs defaultValue="fullTime" onValueChange={setPositionType}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-2 gap-2 md:gap-4">
          <TabsTrigger value="fullTime">Full Time</TabsTrigger>
          <TabsTrigger value="internship">Internship</TabsTrigger>
        </TabsList>

        {/* Full Time */}
        <TabsContent value="fullTime">
          <div className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Full Time Positions Applications</CardTitle>
                <CardDescription>Application counts for full time positions</CardDescription>
              </CardHeader>
              <CardContent>{renderChart(fullTimeChartData, "#8884d8")}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Full Time Positions Details</CardTitle>
                <CardDescription>Application metrics for each position</CardDescription>
              </CardHeader>
              <CardContent>{renderTable(data.fullTimePositions)}</CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Internship */}
        <TabsContent value="internship">
          <div className="space-y-6 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Internship Positions Applications</CardTitle>
                <CardDescription>Application counts for internship positions</CardDescription>
              </CardHeader>
              <CardContent>{renderChart(internshipChartData, "#4ade80")}</CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Internship Positions Details</CardTitle>
                <CardDescription>Application metrics for each position</CardDescription>
              </CardHeader>
              <CardContent>{renderTable(data.internshipPositions)}</CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PositionDetailsTab;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface StudentEducationTabProps {
  studentsByEducationLevel: Array<{
    name: string;
    value: number;
  }>;
  educationDistribution: Array<{
    type: string;
    students: number;
    percentage: number;
  }>;
  totalStudents: number;
}

const StudentEducationTab: React.FC<StudentEducationTabProps> = ({
  studentsByEducationLevel,
  educationDistribution,
  totalStudents
}) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Education Level</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsByEducationLevel.map((level) => (
                <TableRow key={level.name}>
                  <TableCell className="font-medium">{level.name}</TableCell>
                  <TableCell>{level.value}</TableCell>
                  <TableCell>{Math.round((level.value / totalStudents) * 100)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>School Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Type</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {educationDistribution.map((item) => (
                <TableRow key={item.type}>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell>{item.students}</TableCell>
                  <TableCell>{item.percentage}%</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-bold">Total</TableCell>
                <TableCell className="font-bold">{totalStudents}</TableCell>
                <TableCell className="font-bold">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentEducationTab;

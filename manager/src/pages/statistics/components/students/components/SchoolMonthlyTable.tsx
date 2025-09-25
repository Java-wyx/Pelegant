
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Types
export interface SchoolMonthlyActiveData {
  school: string;
  months: {
    [key: string]: number;
  };
  total: number;
}

export type SortField = 'total' | '一月' | '二月' | '三月' | '四月' | '五月' | '六月';
export type SortOrder = 'asc' | 'desc';

interface SchoolMonthlyTableProps {
  currentItems: SchoolMonthlyActiveData[];
  monthNames: string[];
  sortField: SortField;
  sortOrder: SortOrder;
  handleSort: (field: SortField) => void;
  totalMonthlyActive: number;
  sortedData: SchoolMonthlyActiveData[];
}

const SchoolMonthlyTable: React.FC<SchoolMonthlyTableProps> = ({
  currentItems,
  monthNames,
  sortField,
  sortOrder,
  handleSort,
  totalMonthlyActive,
  sortedData
}) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10">学校名称</TableHead>
            {monthNames.map(month => (
              <TableHead key={month}>
                <div className="flex items-center cursor-pointer" onClick={() => handleSort(month as SortField)}>
                  {month}
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                    {sortField === month ? (
                      sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    ) : (
                      <ChevronDown size={16} className="opacity-50" />
                    )}
                  </Button>
                </div>
              </TableHead>
            ))}
            <TableHead>
              <div className="flex items-center cursor-pointer" onClick={() => handleSort('total')}>
                总计
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                  {sortField === 'total' ? (
                    sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                  ) : (
                    <ChevronDown size={16} className="opacity-50" />
                  )}
                </Button>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((item) => (
            <TableRow key={item.school}>
              <TableCell className="font-medium sticky left-0 bg-background z-10">{item.school}</TableCell>
              {monthNames.map(month => (
                <TableCell key={month}>{item.months[month]}</TableCell>
              ))}
              <TableCell className="font-bold">{item.total}</TableCell>
            </TableRow>
          ))}
          <TableRow className="bg-muted/50">
            <TableCell className="font-bold sticky left-0 bg-muted/50 z-10">总计</TableCell>
            {monthNames.map(month => (
              <TableCell key={month} className="font-bold">
                {sortedData.reduce((sum, school) => sum + (school.months[month] || 0), 0)}
              </TableCell>
            ))}
            <TableCell className="font-bold">{totalMonthlyActive}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};

export default SchoolMonthlyTable;

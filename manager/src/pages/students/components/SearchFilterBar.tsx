/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:10:40
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-08-26 16:46:18
 * @FilePath: \pelegant\src\pages\students\components\SearchFilterBar.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */

import { useState } from 'react';
import { SearchIcon, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Student } from '../types';

interface SearchFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setStudents: (students: Student[]) => void;
  mockStudents: Student[];
  handleExportToExcel
}

const SearchFilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  setStudents, handleExportToExcel,
  mockStudents 
}: SearchFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="relative w-full sm:w-auto flex-1 max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索大学生..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex space-x-2 w-full sm:w-auto justify-end">
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setStudents(mockStudents)}>
              全部
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStudents(mockStudents.filter(s => s.status === 'active'))}>
              仅在读
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStudents(mockStudents.filter(s => s.status === 'inactive'))}>
              仅休学
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStudents(mockStudents.filter(s => s.status === 'graduate'))}>
              仅毕业
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
        
        <Button variant="outline" className="h-9" onClick={handleExportToExcel}>
          <Download className="mr-2 h-4 w-4" />
          导出
        </Button>
      </div>
    </div>
  );
};

export default SearchFilterBar;


import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Download, Filter, SearchIcon } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { Position } from '../types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  setPositions: Dispatch<SetStateAction<Position[]>>;
  handleExportToExcel: () => void; 
  handleFilterChange 
}



const SearchFilterBar = ({ searchTerm, setSearchTerm, setPositions,handleExportToExcel,handleFilterChange  }: SearchFilterBarProps) => {
    const handleFilter = (value: string) => {
    handleFilterChange(value);  // 触发父组件的筛选更新
  };

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="relative w-full sm:w-auto flex-1 max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索职位..."
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
            <DropdownMenuItem onClick={() => setPositions(loadPositions)}>
              全部
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPositions(loadPositions.filter(p => p.status === 'active'))}>
              仅招聘中
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPositions(loadPositions.filter(p => p.status === 'inactive'))}>
              仅已暂停
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPositions(loadPositions.filter(p => p.status === 'filled'))}>
              仅已招满
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>  */}

         {/* 筛选条件下拉框 */}
        <Select onValueChange={handleFilter}>
          <SelectTrigger>
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">正在招聘</SelectItem>
            <SelectItem value="filled">已招满</SelectItem>
            <SelectItem value="inactive">暂停招聘</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="h-9" onClick={handleExportToExcel}>
          <Download className="mr-2 h-4 w-4" />
          导出
        </Button>
        
      </div>
      
    </div>
  );
};

export default SearchFilterBar;

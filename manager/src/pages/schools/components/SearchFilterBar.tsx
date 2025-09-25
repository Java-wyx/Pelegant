
import { SearchIcon, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { School } from '../types';

interface SearchFilterBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onFilterChange: (filter: string) => void;
  onExport: () => void;
  handleFilterChange
  handleExportToExcel: () => void;
}

const SearchFilterBar = ({
  searchTerm,
  setSearchTerm,
  onFilterChange,
  handleFilterChange,
  onExport,
  handleExportToExcel
}: SearchFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="relative w-full sm:w-auto flex-1 max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索大学..."
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
            <DropdownMenuItem onClick={() => onFilterChange('all')}>
              全部
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange('active')}>
              仅运行中
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange('inactive')}>
              仅暂停招生
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange('pending')}>
              仅待审核
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
               {/* <Select onValueChange={handleFilterChange}>
          <SelectTrigger>
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="active">运行中</SelectItem>
            <SelectItem value="pending">待审核</SelectItem>
            <SelectItem value="inactive">暂停招生</SelectItem>
          </SelectContent>
        </Select> */}
        <Button variant="outline" className="h-9" onClick={handleExportToExcel}>
          <Download className="mr-2 h-4 w-4" />
          导出
        </Button>
      </div>
    </div>
  );
};

export default SearchFilterBar;


import { Search as SearchIcon, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

interface CrawlerListFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  resetTasks: () => void;
  filterByStatus: (status: string) => void;
}

export const CrawlerListFilters = ({
  searchTerm,
  setSearchTerm,
  resetTasks,
  filterByStatus,
}: CrawlerListFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <div className="relative w-full sm:w-auto flex-1 max-w-md">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="搜索任务名称或目标..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="flex space-x-2 w-full sm:w-auto justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-9">
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={resetTasks}>
              全部
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => filterByStatus('running')}>
              仅运行中
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => filterByStatus('paused')}>
              仅已暂停
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => filterByStatus('completed')}>
              仅已完成
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => filterByStatus('failed')}>
              仅失败
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline" className="h-9">
          <Download className="mr-2 h-4 w-4" />
          导出
        </Button>
      </div>
    </div>
  );
};

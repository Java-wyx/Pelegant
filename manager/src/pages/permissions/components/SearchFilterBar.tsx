
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Filter, Search as SearchIcon } from 'lucide-react';

interface FilterOption {
  label: string;
  action: () => void;
}

interface SearchFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterOptions: FilterOption[];
  placeholder: string;
  hideExport?: boolean;
}

const SearchFilterBar = ({
  searchTerm,
  setSearchTerm,
  filterOptions,
  placeholder,
  hideExport = false,
}: SearchFilterBarProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 w-full">
      <div className="relative w-full">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
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
            {filterOptions.map((option, index) => (
              <DropdownMenuItem key={index} onClick={option.action}>
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        {!hideExport && (
          <Button variant="outline" className="h-9">
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
        )}
      </div>
    </div>
  );
};

export default SearchFilterBar;

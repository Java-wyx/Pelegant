
import { Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SearchFilterBarProps {
  activeTab: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const SearchFilterBar = ({
  activeTab,
  searchTerm,
  setSearchTerm,
}: SearchFilterBarProps) => {
  return (
    <div className="flex space-x-2">
      <div className="relative w-64">
        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={`搜索${activeTab === 'tasks' ? '任务' : activeTab === 'rules' ? '规则' : '结果'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Button variant="outline" className="h-10">
        <Download className="mr-2 h-4 w-4" />
        导出
      </Button>
    </div>
  );
};

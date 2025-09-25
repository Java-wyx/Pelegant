
import { Eye, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { CleanedData, CleaningTask } from '../types/cleaning';

interface CleanedDataTabProps {
  cleanedData: CleanedData[];
  tasks: CleaningTask[];
  searchTerm: string;
  selectedItems: number[];
  setSelectedItems: React.Dispatch<React.SetStateAction<number[]>>;
  onDeleteItem: (id: number, type: string) => void;
}

export const CleanedDataTab = ({
  cleanedData,
  tasks,
  searchTerm,
  selectedItems,
  setSelectedItems,
  onDeleteItem,
}: CleanedDataTabProps) => {
  const { toast } = useToast();
  
  // Filter based on search term
  const filteredData = cleanedData.filter(data =>
    data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    data.source.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to render status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'improved':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">已优化</Badge>;
      case 'unchanged':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">无变化</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">错误</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedItems.length === filteredData.length && filteredData.length > 0} 
                onCheckedChange={() => {
                  if (selectedItems.length === filteredData.length) {
                    setSelectedItems([]);
                  } else {
                    setSelectedItems(filteredData.map(data => data.id));
                  }
                }}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>标题</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>来源</TableHead>
            <TableHead>清洗任务</TableHead>
            <TableHead>清洗时间</TableHead>
            <TableHead>状态</TableHead>
            <TableHead className="w-28 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredData.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                没有找到匹配的清洗结果
              </TableCell>
            </TableRow>
          ) : (
            filteredData.map((data) => (
              <TableRow key={data.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedItems.includes(data.id)} 
                    onCheckedChange={() => {
                      if (selectedItems.includes(data.id)) {
                        setSelectedItems(selectedItems.filter(id => id !== data.id));
                      } else {
                        setSelectedItems([...selectedItems, data.id]);
                      }
                    }}
                    aria-label={`Select ${data.title}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{data.title}</TableCell>
                <TableCell>{data.source}</TableCell>
                <TableCell>{tasks.find(t => t.id === data.cleaningTask)?.name || '未知任务'}</TableCell>
                <TableCell className="text-sm">{data.cleanedAt}</TableCell>
                <TableCell>{getStatusBadge(data.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        toast({
                          title: "对比视图",
                          description: "对比视图功能正在开发中",
                        });
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteItem(data.id, 'data')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

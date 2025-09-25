
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Trash2, ArrowUpDown, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CrawlTask {
  id: number;
  name: string;
  target: string;
  frequency: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number;
  lastRun: string;
  dataCount: number;
}

interface CrawlerListTableProps {
  filteredTasks: CrawlTask[];
  selectedTasks: number[];
  handleSelectAll: () => void;
  handleSelectTask: (id: number) => void;
  handleTaskAction: (id: number, action: 'start' | 'pause') => void;
  handleDelete: (id: number) => void;
}

export const CrawlerListTable = ({
  filteredTasks,
  selectedTasks,
  handleSelectAll,
  handleSelectTask,
  handleTaskAction,
  handleDelete,
}: CrawlerListTableProps) => {
  const navigate = useNavigate();

  // Helper function to render status badges
  const getStatusBadge = (status: CrawlTask['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">运行中</Badge>;
      case 'paused':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">已暂停</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">已完成</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">失败</Badge>;
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
                checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0} 
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>任务名称</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>目标URL</TableHead>
            <TableHead>频率</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>进度</TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>上次运行</span>
              </div>
            </TableHead>
            <TableHead>数据量</TableHead>
            <TableHead className="w-28 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                没有找到匹配的爬虫任务
              </TableCell>
            </TableRow>
          ) : (
            filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedTasks.includes(task.id)} 
                    onCheckedChange={() => handleSelectTask(task.id)}
                    aria-label={`Select ${task.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {task.target}
                </TableCell>
                <TableCell>{task.frequency}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>
                  <div className="w-full max-w-24">
                    <Progress value={task.progress} className="h-2" />
                    <span className="text-xs text-muted-foreground">{task.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{task.lastRun}</TableCell>
                <TableCell>{task.dataCount.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/crawler/${task.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {task.status === 'paused' || task.status === 'failed' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTaskAction(task.id, 'start')}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : task.status === 'running' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleTaskAction(task.id, 'pause')}
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(task.id)}
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

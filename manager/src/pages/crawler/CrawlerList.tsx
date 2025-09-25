
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { DeleteDialog } from './components/DeleteDialog';
import { CrawlerListHeader } from './components/CrawlerListHeader';
import { CrawlerListFilters } from './components/CrawlerListFilters';
import { CrawlerListTable } from './components/CrawlerListTable';
import { CrawlerListPagination } from './components/CrawlerListPagination';

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

const mockTasks: CrawlTask[] = [
  { 
    id: 1, 
    name: '教育新闻爬虫', 
    target: 'https://edu.example.com/news', 
    frequency: '每日', 
    status: 'running', 
    progress: 65, 
    lastRun: '2023-12-10 08:30',
    dataCount: 1245
  },
  { 
    id: 2, 
    name: '高校录取数据', 
    target: 'https://admissions.edu.example.com', 
    frequency: '每周', 
    status: 'completed', 
    progress: 100, 
    lastRun: '2023-12-09 14:15',
    dataCount: 3578
  },
  { 
    id: 3, 
    name: '就业市场分析', 
    target: 'https://jobs.example.com/statistics', 
    frequency: '每月', 
    status: 'paused', 
    progress: 42, 
    lastRun: '2023-11-15 16:20',
    dataCount: 860
  },
  { 
    id: 4, 
    name: '教育政策监控', 
    target: 'https://gov.example.com/education/policies', 
    frequency: '每日', 
    status: 'running', 
    progress: 78, 
    lastRun: '2023-12-10 10:45',
    dataCount: 532
  },
  { 
    id: 5, 
    name: '学科竞赛信息', 
    target: 'https://competitions.example.com', 
    frequency: '每周', 
    status: 'completed', 
    progress: 100, 
    lastRun: '2023-12-08 09:30',
    dataCount: 218
  },
  { 
    id: 6, 
    name: '教育资源索引', 
    target: 'https://resources.edu.example.com', 
    frequency: '每月', 
    status: 'failed', 
    progress: 23, 
    lastRun: '2023-12-01 11:10',
    dataCount: 156
  },
];

const CrawlerList = () => {
  const [tasks, setTasks] = useState<CrawlTask[]>(mockTasks);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const { toast } = useToast();

  const filteredTasks = tasks.filter(task => 
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedTasks.length === filteredTasks.length) {
      setSelectedTasks([]);
    } else {
      setSelectedTasks(filteredTasks.map(task => task.id));
    }
  };

  const handleSelectTask = (id: number) => {
    if (selectedTasks.includes(id)) {
      setSelectedTasks(selectedTasks.filter(taskId => taskId !== id));
    } else {
      setSelectedTasks([...selectedTasks, id]);
    }
  };

  const handleTaskAction = (id: number, action: 'start' | 'pause') => {
    setTasks(tasks.map(task => 
      task.id === id 
        ? { ...task, status: action === 'start' ? 'running' : 'paused' } 
        : task
    ));
    
    toast({
      title: action === 'start' ? '任务已启动' : '任务已暂停',
      description: `爬虫任务 "${tasks.find(t => t.id === id)?.name}" 已${action === 'start' ? '启动' : '暂停'}`,
    });
  };

  const handleDelete = (id: number) => {
    setTaskToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (taskToDelete) {
      setTasks(tasks.filter(task => task.id !== taskToDelete));
      toast({
        title: '删除成功',
        description: '爬虫任务已成功删除',
      });
    }
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const resetTasks = () => {
    setTasks(mockTasks);
  };

  const filterByStatus = (status: string) => {
    setTasks(mockTasks.filter(t => t.status === status));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CrawlerListHeader />
        </CardHeader>
        
        <CardContent>
          <CrawlerListFilters 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            resetTasks={resetTasks}
            filterByStatus={filterByStatus}
          />
          
          <CrawlerListTable 
            filteredTasks={filteredTasks}
            selectedTasks={selectedTasks}
            handleSelectAll={handleSelectAll}
            handleSelectTask={handleSelectTask}
            handleTaskAction={handleTaskAction}
            handleDelete={handleDelete}
          />
        </CardContent>
        <CardFooter>
          <CrawlerListPagination 
            totalItems={mockTasks.length} 
            filteredItems={filteredTasks.length} 
          />
        </CardFooter>
      </Card>

      <DeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemType="task"
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default CrawlerList;

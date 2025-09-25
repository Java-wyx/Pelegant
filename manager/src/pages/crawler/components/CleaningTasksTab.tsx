
import { useState } from 'react';
import { ArrowUpDown, Eye, Play, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CleaningTask } from '../types/cleaning';

interface CleaningTasksTabProps {
  tasks: CleaningTask[];
  setTasks: React.Dispatch<React.SetStateAction<CleaningTask[]>>;
  searchTerm: string;
  selectedItems: number[];
  setSelectedItems: React.Dispatch<React.SetStateAction<number[]>>;
  onDeleteItem: (id: number, type: string) => void;
}

export const CleaningTasksTab = ({
  tasks,
  setTasks,
  searchTerm,
  selectedItems,
  setSelectedItems,
  onDeleteItem,
}: CleaningTasksTabProps) => {
  const { toast } = useToast();
  
  // Filter based on search term
  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.dataSource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to render status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">等待中</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">运行中</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">已完成</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">失败</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const handleStartTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id ? { ...task, status: 'running', progress: 5 } : task
    ));
    
    toast({
      title: '任务已启动',
      description: `清洗任务 "${tasks.find(t => t.id === id)?.name}" 已开始运行`,
    });
    
    // Simulate task progress
    let progress = 5;
    const interval = setInterval(() => {
      if (progress >= 100) {
        clearInterval(interval);
        setTasks(tasks.map(task =>
          task.id === id ? { 
            ...task, 
            status: 'completed', 
            progress: 100,
            lastRun: new Date().toLocaleString('zh-CN', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(/\//g, '-')
          } : task
        ));
        
        toast({
          title: '任务完成',
          description: `清洗任务 "${tasks.find(t => t.id === id)?.name}" 已完成`,
        });
      } else {
        progress += 5;
        setTasks(tasks.map(task =>
          task.id === id ? { ...task, progress } : task
        ));
      }
    }, 1000);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedItems.length === filteredTasks.length && filteredTasks.length > 0} 
                onCheckedChange={() => {
                  if (selectedItems.length === filteredTasks.length) {
                    setSelectedItems([]);
                  } else {
                    setSelectedItems(filteredTasks.map(task => task.id));
                  }
                }}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>任务名称</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>数据来源</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>进度</TableHead>
            <TableHead>上次运行</TableHead>
            <TableHead>处理记录</TableHead>
            <TableHead>变更记录</TableHead>
            <TableHead className="w-28 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                没有找到匹配的清洗任务
              </TableCell>
            </TableRow>
          ) : (
            filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedItems.includes(task.id)} 
                    onCheckedChange={() => {
                      if (selectedItems.includes(task.id)) {
                        setSelectedItems(selectedItems.filter(id => id !== task.id));
                      } else {
                        setSelectedItems([...selectedItems, task.id]);
                      }
                    }}
                    aria-label={`Select ${task.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{task.name}</TableCell>
                <TableCell>{task.dataSource}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>
                  <div className="w-full max-w-24">
                    <Progress value={task.progress} className="h-2" />
                    <span className="text-xs text-muted-foreground">{task.progress}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{task.lastRun}</TableCell>
                <TableCell>{task.recordsProcessed.toLocaleString()}</TableCell>
                <TableCell>{task.recordsChanged.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast({ title: "功能开发中", description: "查看任务详情功能正在开发中" })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {task.status === 'pending' || task.status === 'failed' ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStartTask(task.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    ) : null}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteItem(task.id, 'task')}
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

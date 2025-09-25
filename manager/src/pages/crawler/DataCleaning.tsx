
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

// Import components
import { CleaningRulesTab } from './components/CleaningRulesTab';
import { CleaningTasksTab } from './components/CleaningTasksTab';
import { CleanedDataTab } from './components/CleanedDataTab';
import { DeleteDialog } from './components/DeleteDialog';
import { SearchFilterBar } from './components/SearchFilterBar';

// Import mock data
import { mockRules, mockTasks, mockCleanedData } from './data/mockData';

const DataCleaning = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [rules, setRules] = useState(mockRules);
  const [tasks, setTasks] = useState(mockTasks);
  const [cleanedData, setCleanedData] = useState(mockCleanedData);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number, type: string } | null>(null);
  const { toast } = useToast();

  // Handler for delete button click
  const handleDeleteItem = (id: number, type: string) => {
    setItemToDelete({ id, type });
    setDeleteDialogOpen(true);
  };

  // Handler for delete confirmation
  const confirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'rule') {
        setRules(rules.filter(rule => rule.id !== itemToDelete.id));
        toast({
          title: '删除成功',
          description: '清洗规则已成功删除',
        });
      } else if (itemToDelete.type === 'task') {
        setTasks(tasks.filter(task => task.id !== itemToDelete.id));
        toast({
          title: '删除成功',
          description: '清洗任务已成功删除',
        });
      } else if (itemToDelete.type === 'data') {
        setCleanedData(cleanedData.filter(data => data.id !== itemToDelete.id));
        toast({
          title: '删除成功',
          description: '已清洗数据记录已成功删除',
        });
      }
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl">爬虫数据清洗</CardTitle>
              <CardDescription>管理和执行数据清洗任务</CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button onClick={() => toast({ title: "功能开发中", description: "新建数据清洗规则功能正在开发中" })}>
                新建规则
              </Button>
              <Button onClick={() => toast({ title: "功能开发中", description: "新建清洗任务功能正在开发中" })}>
                新建任务
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tasks" onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="tasks">清洗任务</TabsTrigger>
                <TabsTrigger value="rules">清洗规则</TabsTrigger>
                <TabsTrigger value="results">清洗结果</TabsTrigger>
              </TabsList>
              
              <SearchFilterBar 
                activeTab={activeTab} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
              />
            </div>
            
            <TabsContent value="tasks" className="mt-0">
              <CleaningTasksTab 
                tasks={tasks}
                setTasks={setTasks}
                searchTerm={searchTerm}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                onDeleteItem={handleDeleteItem}
              />
            </TabsContent>
            
            <TabsContent value="rules" className="mt-0">
              <CleaningRulesTab 
                rules={rules}
                setRules={setRules}
                searchTerm={searchTerm}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                onDeleteItem={handleDeleteItem}
              />
            </TabsContent>
            
            <TabsContent value="results" className="mt-0">
              <CleanedDataTab 
                cleanedData={cleanedData}
                tasks={tasks}
                searchTerm={searchTerm}
                selectedItems={selectedItems}
                setSelectedItems={setSelectedItems}
                onDeleteItem={handleDeleteItem}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between items-center px-6 py-4 border-t">
          <div className="text-sm text-muted-foreground">
            显示 {
              activeTab === 'tasks' ? tasks.filter(task =>
                task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                task.dataSource.toLowerCase().includes(searchTerm.toLowerCase())
              ).length : 
              activeTab === 'rules' ? rules.filter(rule =>
                rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rule.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                rule.target.toLowerCase().includes(searchTerm.toLowerCase())
              ).length : 
              cleanedData.filter(data =>
                data.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                data.source.toLowerCase().includes(searchTerm.toLowerCase())
              ).length
            } 条，共 {
              activeTab === 'tasks' ? tasks.length : 
              activeTab === 'rules' ? rules.length : 
              cleanedData.length
            } 条
          </div>
          <div className="flex items-center space-x-6">
            <Button variant="outline" size="sm" disabled>
              上一页
            </Button>
            <div className="text-sm">
              第 <strong>1</strong> 页，共 <strong>1</strong> 页
            </div>
            <Button variant="outline" size="sm" disabled>
              下一页
            </Button>
          </div>
        </CardFooter>
      </Card>

      <DeleteDialog 
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemType={itemToDelete?.type || null}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default DataCleaning;

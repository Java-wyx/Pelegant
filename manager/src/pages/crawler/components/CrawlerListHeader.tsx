
import { Plus, FilterX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardTitle, CardDescription } from '@/components/ui/card';

export const CrawlerListHeader = () => {
  const navigate = useNavigate();
  
  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-xl">爬虫任务管理</CardTitle>
        <CardDescription>管理数据采集任务</CardDescription>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/crawler/cleaning')}>
          <FilterX className="mr-2 h-4 w-4" />
          数据清洗
        </Button>
        <Button onClick={() => navigate('/crawler/new')}>
          <Plus className="mr-2 h-4 w-4" />
          新建任务
        </Button>
      </div>
    </div>
  );
};

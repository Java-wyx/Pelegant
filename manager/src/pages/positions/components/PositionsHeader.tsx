
import { Button } from '@/components/ui/button';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import AddPositionSheet from './AddPositionSheet';

const PositionsHeader = () => {
  const [isAddPositionOpen, setIsAddPositionOpen] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-xl">职位管理</CardTitle>
        <CardDescription>管理系统中的招聘职位信息</CardDescription>
      </div>
      <Button onClick={() => setIsAddPositionOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        添加职位
      </Button>
      
      <AddPositionSheet open={isAddPositionOpen} onOpenChange={setIsAddPositionOpen} />
    </div>
  );
};

export default PositionsHeader;

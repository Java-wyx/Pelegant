
import { GraduationCap, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardTitle, CardDescription } from '@/components/ui/card';

const SchoolsListHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <GraduationCap className="mr-2 h-6 w-6 text-primary"/>
        <div>
          <CardTitle className="text-xl">高校管理</CardTitle>
          <CardDescription>管理系统中的大学信息</CardDescription>
        </div>
      </div>
      <Button onClick={() => navigate('/schools/new')}>
        <Plus className="mr-2 h-4 w-4" />
        添加大学
      </Button>
    </div>
  );
};

export default SchoolsListHeader;

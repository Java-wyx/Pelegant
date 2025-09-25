
import { Users } from 'lucide-react';
import { CardTitle, CardDescription } from '@/components/ui/card';

const StudentsListHeader = () => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <Users className="mr-2 h-6 w-6 text-primary"/>
        <div>
          <CardTitle className="text-xl">学生管理</CardTitle>
          <CardDescription>管理系统中的在校学生信息</CardDescription>
        </div>
      </div>
    </div>
  );
};

export default StudentsListHeader;

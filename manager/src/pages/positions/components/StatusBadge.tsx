
import { Badge } from '@/components/ui/badge';
import { Position } from '../types';

interface StatusBadgeProps {
  status: Position['status'];
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  switch (status) {
    case 'active':
      return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">招聘中</Badge>;
    case 'inactive':
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">已暂停</Badge>;
    case 'filled':
      return <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">已招满</Badge>;
    default:
      return <Badge variant="outline">未知</Badge>;
  }
};

export default StatusBadge;

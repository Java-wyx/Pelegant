
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { Position } from '../types';

interface PositionsTableProps {
  positions: Position[];
  selectedPositions: string[]; // 改为string[]以匹配Position.id类型
  handleSelectPosition: (id: string) => void; // 改为string类型
  handleSelectAll: () => void;
  sortField: 'applicants' | null;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: 'applicants' | null) => void;
}

const PositionsTable = ({
  positions,
  selectedPositions,
  handleSelectPosition,
  handleSelectAll,
  sortField,
  sortOrder,
  handleSort
}: PositionsTableProps) => {
  const navigate = useNavigate();
  
  const getSortIcon = (field: 'applicants' | null) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedPositions.length === positions.length && positions.length > 0} 
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>职位名称</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>所属企业</TableHead>
            <TableHead>工作地点</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>发布日期</TableHead>
            <TableHead>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center space-x-1 -ml-3 px-2 h-8"
                onClick={() => handleSort('applicants')}
              >
                <span>申请人数</span>
                {getSortIcon('applicants')}
              </Button>
            </TableHead>
            <TableHead className="min-w-[150px]">工作内容描述</TableHead>
            <TableHead className="w-16 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                没有找到匹配的职位
              </TableCell>
            </TableRow>
          ) : (
            positions.map((position) => (
              <TableRow key={position.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedPositions.includes(position.id)} 
                    onCheckedChange={() => handleSelectPosition(position.id)}
                    aria-label={`Select ${position.title}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{position.title}</TableCell>
                <TableCell>{position.company}</TableCell>
                <TableCell>{position.location}</TableCell>
                <TableCell>{position.type}</TableCell>
                <TableCell><StatusBadge status={position.status} /></TableCell>
                <TableCell>{position.postDate}</TableCell>
                <TableCell>{position.applicants}</TableCell>
                <TableCell className="max-w-[250px] truncate" title={position.jobDescription}>
                  {position.jobDescription}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/positions/${position.id}`)}
                      title="查看"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/positions/edit/${position.id}`)}
                      title="编辑"
                    >
                      <Pencil className="h-4 w-4" />
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

export default PositionsTable;

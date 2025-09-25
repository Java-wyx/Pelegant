
import { Button } from '@/components/ui/button';
import { CardFooter } from '@/components/ui/card';

interface TableFooterProps {
  totalItems: number;
  filteredItems: number;
}

const TableFooter = ({ totalItems, filteredItems }: TableFooterProps) => {
  return (
    <CardFooter className="flex justify-between items-center px-6 py-4 border-t">
      <div className="text-sm text-muted-foreground">
        显示 {filteredItems} 条，共 {totalItems} 条
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
  );
};

export default TableFooter;

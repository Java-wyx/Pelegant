/*
 * @Author: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @Date: 2025-07-20 22:10:39
 * @LastEditors: error: error: git config user.name & please set dead value or install git && error: git config user.email & please set dead value or install git & please set dead value or install git
 * @LastEditTime: 2025-09-02 19:57:48
 * @FilePath: \pelegant\src\pages\positions\components\TableFooter.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Button } from '@/components/ui/button';

interface TableFooterProps {
  displayedCount: number;
  totalCount: number;
  currentPage: number;  // 当前页
  totalPages: number;   // 总页数
  onPageChange: (page: number) => void;  // 切换页码的回调
}

const TableFooter = ({ displayedCount, totalCount, currentPage, totalPages, onPageChange }: TableFooterProps) => {
  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex justify-between items-center px-6 py-4 border-t">
      <div className="text-sm text-muted-foreground">
        显示 {displayedCount} 条，共 {totalCount} 条
      </div>
      <div className="flex items-center space-x-6">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}  // 如果是第一页，禁用上一页按钮
          onClick={handlePrevPage}
        >
          上一页
        </Button>
        <div className="text-sm">
          第 <strong>{currentPage}</strong> 页，共 <strong>{totalPages}</strong> 页
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}  // 如果是最后一页，禁用下一页按钮
          onClick={handleNextPage}
        >
          下一页
        </Button>
      </div>
    </div>
  );
};

export default TableFooter;

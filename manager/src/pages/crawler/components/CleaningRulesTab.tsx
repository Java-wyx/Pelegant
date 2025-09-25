
import { useState } from 'react';
import { Check, ArrowUpDown, Eye, RefreshCw, X, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CleaningRule } from '../types/cleaning';

interface CleaningRulesTabProps {
  rules: CleaningRule[];
  setRules: React.Dispatch<React.SetStateAction<CleaningRule[]>>;
  searchTerm: string;
  selectedItems: number[];
  setSelectedItems: React.Dispatch<React.SetStateAction<number[]>>;
  onDeleteItem: (id: number, type: string) => void;
}

export const CleaningRulesTab = ({
  rules,
  setRules,
  searchTerm,
  selectedItems,
  setSelectedItems,
  onDeleteItem,
}: CleaningRulesTabProps) => {
  const { toast } = useToast();
  
  // Filter based on search term
  const filteredRules = rules.filter(rule =>
    rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.target.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to render status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">启用</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">未启用</Badge>;
      case 'draft':
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">草稿</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox 
                checked={selectedItems.length === filteredRules.length && filteredRules.length > 0} 
                onCheckedChange={() => {
                  if (selectedItems.length === filteredRules.length) {
                    setSelectedItems([]);
                  } else {
                    setSelectedItems(filteredRules.map(rule => rule.id));
                  }
                }}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <div className="flex items-center space-x-1">
                <span>规则名称</span>
                <ArrowUpDown className="h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>类型</TableHead>
            <TableHead>目标字段</TableHead>
            <TableHead>条件</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>上次运行</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="w-28 text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRules.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                没有找到匹配的清洗规则
              </TableCell>
            </TableRow>
          ) : (
            filteredRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedItems.includes(rule.id)} 
                    onCheckedChange={() => {
                      if (selectedItems.includes(rule.id)) {
                        setSelectedItems(selectedItems.filter(id => id !== rule.id));
                      } else {
                        setSelectedItems([...selectedItems, rule.id]);
                      }
                    }}
                    aria-label={`Select ${rule.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>
                  {rule.type === 'filter' && '过滤'}
                  {rule.type === 'transform' && '转换'}
                  {rule.type === 'normalize' && '标准化'}
                  {rule.type === 'deduplicate' && '去重'}
                </TableCell>
                <TableCell>
                  {rule.target === 'title' && '标题'}
                  {rule.target === 'content' && '内容'}
                  {rule.target === 'url' && 'URL'}
                  {rule.target === 'date' && '日期'}
                  {rule.target === 'all' && '全部'}
                </TableCell>
                <TableCell className="text-xs max-w-xs truncate" title={rule.condition}>
                  {rule.condition}
                </TableCell>
                <TableCell>{getStatusBadge(rule.status)}</TableCell>
                <TableCell className="text-sm">{rule.lastRun}</TableCell>
                <TableCell className="text-sm">{rule.createdAt}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toast({ title: "功能开发中", description: "编辑规则功能正在开发中" })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setRules(rules.map(r => 
                            r.id === rule.id ? { ...r, status: 'active' } : r
                          ));
                          toast({
                            title: '规则已启用',
                            description: `规则 "${rule.name}" 已成功启用`,
                          });
                        }}>
                          <Check className="mr-2 h-4 w-4" />
                          启用规则
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setRules(rules.map(r => 
                            r.id === rule.id ? { ...r, status: 'inactive' } : r
                          ));
                          toast({
                            title: '规则已停用',
                            description: `规则 "${rule.name}" 已成功停用`,
                          });
                        }}>
                          <X className="mr-2 h-4 w-4" />
                          停用规则
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteItem(rule.id, 'rule')}
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

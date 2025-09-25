
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { generateRandomPassword } from '../types';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface PasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (result: any) => void;
  schoolName: string;
  adminEmail: string;
  schoolId?: string;
  schoolIds?: string[];
  isMultiple?: boolean;
  count?: number;
  isReset?: boolean;
}

const PasswordDialog = ({
  open,
  onOpenChange,
  onConfirm,
  schoolName,
  adminEmail,
  schoolId,
  schoolIds,
  isMultiple = false,
  count = 0,
  isReset = false,
}: PasswordDialogProps) => {
  const [password, setPassword] = useState('');
  const [masked, setMasked] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Generate a random password when the dialog opens
  useEffect(() => {
    if (open) {
      generateNewPassword();
    }
  }, [open]);

  const generateNewPassword = () => {
    setPassword(generateRandomPassword());
    setError('');
    setMasked(true);
  };

  const handleSubmit = async () => {
    // if (!isMultiple && password.length < 8) {
    //   setError('密码长度至少为8位');
    //   return;
    // }

    setIsSubmitting(true);
    setError('');

    try {
      // 构建API请求数据
      const resetData = {
        batchOperation: isMultiple,
        resetType: isReset ? 'reset' : 'initial',
        ...(isMultiple ? { schoolIds } : { schoolId })
      };

      // 调用API
      const response = await api.resetSchoolAdminPassword(resetData);

      if (response.success) {
        toast({
          title: isReset ? '重置密码邮件已发送' : '重置密码邮件已发送',
          description: response.message || '操作完成',
        });
        onConfirm(response.data);
        setPassword('');
        setError('');
      } else {
        setError(response.message || '操作失败');
        toast({
          title: '操作失败',
          description: response.message || '请稍后重试',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('密码重置失败:', error);
      const errorMessage = '网络错误，请稍后重试';
      setError(errorMessage);
      toast({
        title: '操作失败',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (isMultiple) {
      return isReset 
        ? `批量发送重置${count}所学校管理员密码邮件`
        : `批量发送设置${count}所学校管理员重置密码邮件`;
    }
    return isReset ? '重置管理员密码' : '设置管理员初始密码';
  };

  const getDescription = () => {
    if (isMultiple) {
      return isReset
        ? `将为选中的${count}所学校的管理员发送重置密码邮件`
        : `将为选中的${count}所学校的管理员发送重置密码邮件`;
    }
    return isReset
      ? `为 ${schoolName} 的管理员 ${adminEmail} 发送重置密码邮件`
      : `为 ${schoolName} 的管理员 ${adminEmail} 发送重置密码邮件`;
  };

  const getMaskedPassword = () => {
    return '••••••••';
  };

return (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{getTitle()}</DialogTitle>
        <DialogDescription>
          {getDescription()}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {/* 移除 Input，只保留说明文字 */}
        <div className="text-sm text-muted-foreground">
          {/* {isMultiple ? 
            "为安全起见，每所学校将生成不同的随机密码。密码将在确认后生成，并且仅展示一次。" :
            isReset ? 
              "管理员当前的登录密码将被重置，请确保将新密码安全地传达给管理员。" :
              "管理员首次登录系统将使用此密码，可在登录后自行修改"
          } */}
        </div>

        {error && (
          <div className="text-destructive text-sm">
            {error}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button onClick={() => onOpenChange(false)} variant="outline" disabled={isSubmitting}>
          取消
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '处理中...' : (isReset ? '确认重置' : '确认设置')}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

};

export default PasswordDialog;

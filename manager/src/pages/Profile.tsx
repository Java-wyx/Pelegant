import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Building, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleChangePassword = () => {
    navigate('/profile/change-password');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">加载用户信息中...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">个人资料</h1>
          <p className="text-muted-foreground">
            管理您的个人信息和账户设置
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 个人信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              个人信息
            </CardTitle>
            <CardDescription>
              您的基本信息和账户详情
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">姓名</p>
                  <p className="text-base">{user.name}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">邮箱</p>
                  <p className="text-base">{user.email}</p>
                </div>
              </div>
              
              <Separator />
              
              {user.department && (
                <>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">部门</p>
                      <p className="text-base">{user.department}</p>
                    </div>
                  </div>
                  
                  <Separator />
                </>
              )}
              
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">权限角色</p>
                  <p className="text-base">
                    {user.role === 'project' ? '项目管理员' : user.role}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 账户设置卡片 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              账户设置
            </CardTitle>
            <CardDescription>
              管理您的账户安全设置
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">修改密码</h3>
                    <p className="text-sm text-muted-foreground">
                      更新您的登录密码以保护账户安全
                    </p>
                  </div>
                  <Button 
                    onClick={handleChangePassword}
                    variant="outline"
                    size="sm"
                  >
                    修改密码
                  </Button>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">账户状态</h3>
                    <p className="text-sm text-muted-foreground">
                      当前账户状态：
                      <span className="ml-1 text-green-600 font-medium">
                        {user.status === 'active' ? '正常' : user.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;

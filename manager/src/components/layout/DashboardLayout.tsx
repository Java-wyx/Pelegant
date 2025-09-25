
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  ChevronLeft, 
  ChevronRight,
  LogOut, 
  User,
  Settings,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sidebar } from './Sidebar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import LanguageSwitcher from '@/components/LanguageSwitcher'

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "已退出登录",
      description: "您已成功退出系统",
    });
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.includes('/dashboard')) return '仪表盘';
    if (path.includes('/profile/change-password')) return '修改密码';
    if (path.includes('/profile')) return '个人资料';
    if (path.includes('/permissions')) return '权限管理';
    if (path.includes('/crawler')) return '爬虫数据管理';
    if (path.includes('/schools')) return '学校管理';
    if (path.includes('/students')) return '学生管理';
    if (path.includes('/enterprises')) return '企业管理';
    if (path.includes('/positions')) return '职位管理';
    if (path.includes('/statistics')) return '数据统计';

    return '管理系统';
  };

  

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
<Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      
      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Top navbar */}
        <header className="z-10 flex items-center justify-between px-4 py-2 bg-white shadow-sm dark:bg-gray-800 h-14">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2"
              aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            >
              {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}

              
            </Button>
            <h1 className="text-xl font-semibold tracking-tight">{getPageTitle()}</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-base">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name || '项目管理员'}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')} className="text-sm">
                  <User className="mr-2 h-4 w-4" />
                  <span>个人资料</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="text-sm">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>系统设置</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        {/* Page content */}
        <main className={cn(
          "flex-1 overflow-y-auto p-6 transition-all duration-300 ease-in-out animate-fade-in",
          sidebarCollapsed ? "ml-0" : "ml-0"
        )}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

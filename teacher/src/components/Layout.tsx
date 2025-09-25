import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Users,
  Building2,
  BarChart,
  Shield,
  Home,
  Menu,
  X,
  ChevronRight,
  Settings,
} from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuthStore } from "@/store/authStore";
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: React.ReactNode;
}


const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuthStore();
  const [username,setUsername ]= useState({
      nickname: "",
  });
  const { t } = useTranslation();


  // const [avatarSrc, setAvatarSrc] = useState("");


const getAvatarUrl = (avatar: string | undefined): string => {
  // 后端基础 URL (替换成 8080 端口)
  const backendUrl = window.location.origin.replace(/:\d+$/, ":8080");

  // 如果 avatar 无效，返回默认头像的完整 URL
  if (!avatar || typeof avatar !== "string") {
    return `${backendUrl}/api/files/default-avatar.jpg`;
  }

  // 如果已经是完整的 URL，就直接返回
  if (/^https?:\/\//i.test(avatar)) {
    return avatar;
  }

  // 修正路径分隔符，并拼接成可访问的文件 URL
  return `${backendUrl}/api/files${avatar.replace(/\\/g, "/")}`;
};

  useEffect(() => {
  if (user?.nickname) {
    setUsername({ nickname: user.nickname });
  }
}, [user]);

  useEffect(() => {
    // Default to closed sidebar on mobile, open on desktop
    setSidebarOpen(!isMobile);
    console.log("tets"+user?.avatar)
  }, [isMobile]);

  // Close sidebar on route change for mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const { getMenus, hasPermission } = useAuthStore();
  const menus = getMenus();

  // 默认菜单配置，包含权限码
  const defaultMenus = [
    { name: t('layout.menu.home'), path: "/", icon: "home", permission: "" },
    {
      name: t('layout.menu.usersRoles'),
      path: "/permissions",
      icon: "shield",
      permission: "system:user:list",
    },
    {
      name: t('layout.menu.students'),
      path: "/students",
      icon: "users",
      permission: "students.manage",
    },
    {
      name: t('layout.menu.enterprises'),
      path: "/enterprises",
      icon: "building",
      permission: "pelegant:company:query",
    },
    {
      name: t('layout.menu.statistics'),
      path: "/statistics",
      icon: "chart",
      permission: "statistics.view",
    },
    { name: t('layout.menu.settings'), path: "/settings", icon: "settings", permission: "" },
  ];

  interface MenuItemWithPermission {
    name: string;
    path: string;
    icon?: string;
    permission?: string;
    children?: MenuItemWithPermission[];
  }

  // 根据权限过滤菜单
  const filterMenusByPermission = (menuItems: MenuItemWithPermission[]) => {
    return menuItems.filter((item) => {
      // 如果没有权限要求或有对应权限，则显示
      const hasRequiredPermission =
        !item.permission || hasPermission(item.permission);

      // 如果有子菜单，递归过滤
      if (item.children && item.children.length > 0) {
        item.children = filterMenusByPermission(item.children);
      }

      return hasRequiredPermission;
    });
  };

  // 只使用默认菜单
  const navItems = filterMenusByPermission(defaultMenus).map((menu) => ({
    name: menu.name,
    path: menu.path,
    icon: getMenuIcon(menu.icon),
    children: menu.children?.map((child) => ({
      name: child.name,
      path: child.path,
      icon: getMenuIcon(child.icon),
    })),
  }));

  function getMenuIcon(iconName?: string) {
    switch (iconName) {
      case "home":
        return <Home className="h-4 w-4" />;
      case "shield":
        return <Shield className="h-4 w-4" />;
      case "users":
        return <Users className="h-4 w-4" />;
      case "building":
        return <Building2 className="h-4 w-4" />;
      case "chart":
        return <BarChart className="h-4 w-4" />;
      case "settings":
        return <Settings className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  // Handler for avatar click to navigate to settings page
  const handleAvatarClick = () => {
    navigate("/settings");
  };

  // Check if the current path matches exactly or is a subpath
  const isActiveRoute = (path: string) => {
    if (path === "/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 w-64 flex-shrink-0 h-screen bg-white shadow-md transition-transform duration-300",
          !sidebarOpen && "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-4">
          <Link
            to="/"
            className="flex-1 text-base font-semibold text-slate-800 hover:text-slate-900 transition-colors truncate"
          >
            {t('layout.title')}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto h-[calc(100vh-3.5rem)]">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.path);

            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md my-0.5 transition-colors relative group",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md",
                    isActive
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-50 text-slate-500"
                  )}
                >
                  {item.icon}
                </span>
                <span className="ml-3 font-medium">{item.name}</span>

                {isActive && (
                  <>
                    <ChevronRight className="ml-auto h-3.5 w-3.5 text-blue-600 opacity-70" />
                    <span className="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 rounded-l-none rounded-r-md" />
                  </>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full overflow-hidden md:pl-0">
        {/* Topbar */}
        <header className="bg-white border-b border-slate-100 shadow-sm z-10 sticky top-0">
          <div className="flex h-14 items-center justify-between px-4">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden"
            >
              {sidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
            <div className="flex items-center gap-3 ml-auto">
              <div
                onClick={handleAvatarClick}
                className="cursor-pointer hover:opacity-80 transition-opacity flex items-center gap-3"
                title={t('layout.profile.goToSettings')}
              >
                <Avatar className="h-8 w-8 ring-2 ring-slate-100">
                  <AvatarImage src={getAvatarUrl(user?.avatar)} />
                  <AvatarFallback className="bg-blue-50 text-blue-600">
                    {user?.username?.charAt(0).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>

                <div className="text-sm hidden sm:block">
                  <p className="font-medium text-slate-800">
                    {username?.nickname || t('layout.user.defaultName')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {user?.email || t('layout.user.noEmail')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6">
          <div className="mx-auto max-w-7xl w-full">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

import { useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShieldCheck,
  Search,
  GraduationCap,
  Users,
  Briefcase,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  collapsed: boolean;
  subItems?: { label: string; to: string }[];
}

const NavItem = ({ icon: Icon, label, to, collapsed, subItems }: NavItemProps) => {
  const [showFloating, setShowFloating] = useState(false);
  const [floatingPos, setFloatingPos] = useState({ top: 0, left: 0 });
  const parentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  const hasSubItems = subItems && subItems.length > 0;

  const handleMouseEnter = () => {
    if (collapsed && hasSubItems && parentRef.current) {
      if (timerRef.current) clearTimeout(timerRef.current);
      const rect = parentRef.current.getBoundingClientRect();
      setFloatingPos({ top: rect.top, left: rect.right + 4 });
      setShowFloating(true);
    }
  };

  const handleMouseLeave = () => {
    if (collapsed) {
      timerRef.current = window.setTimeout(() => setShowFloating(false), 100);
    }
  };

  const handleFloatingMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setShowFloating(true);
  };

  const handleFloatingMouseLeave = () => {
    timerRef.current = window.setTimeout(() => setShowFloating(false), 100);
  };

  return (
    <div
      ref={parentRef}
      className="mb-1 relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 一级菜单 */}
      <NavLink
        to={hasSubItems && collapsed ? subItems![0].to : to}
        className={({ isActive }) =>
          cn(
            "flex items-center px-3 py-2 rounded-md transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground",
            collapsed ? "justify-center" : "space-x-3"
          )
        }
      >
        <Icon className="h-5 w-5" />
        {!collapsed && <span>{label}</span>}
      </NavLink>

      {/* 展开状态二级菜单 */}
      {!collapsed && hasSubItems && (
        <div className="ml-8 mt-1 space-y-1">
          {subItems!.map((subItem, idx) => (
            <NavLink
              key={idx}
              to={subItem.to}
              className={({ isActive }) =>
                cn(
                  "block px-3 py-1 text-sm rounded-md",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground"
                )
              }
            >
              {subItem.label}
            </NavLink>
          ))}
        </div>
      )}

      {/* 收起状态浮层二级菜单 */}
      {collapsed && hasSubItems && showFloating && (
        <div
          className="fixed bg-sidebar shadow-lg rounded-md py-2 w-44 z-50"
          style={{ top: floatingPos.top, left: floatingPos.left }}
          onMouseEnter={handleFloatingMouseEnter}
          onMouseLeave={handleFloatingMouseLeave}
        >
          {subItems!.map((subItem, idx) => (
            <NavLink
              key={idx}
              to={subItem.to}
              className={({ isActive }) =>
                cn(
                  "block px-4 py-2 text-sm rounded-md whitespace-nowrap",
                  "hover:bg-accent hover:text-accent-foreground",
                  isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground"
                )
              }
            >
              {subItem.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  return (
    <div
      className={cn(
        "bg-sidebar h-screen shadow-sm border-r border-border transition-all duration-300 ease-in-out flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* 顶部 */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-border">
        {collapsed ? <span className="font-bold text-primary text-lg">管理</span> : <span className="font-bold text-primary text-lg">管理系统</span>}
        {/* <button onClick={onToggle} className="ml-auto">
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button> */}
      </div>

      {/* 菜单 */}
      <nav className="mt-5 px-2 space-y-1 flex-1 overflow-visible overflow-y-auto">
        <NavItem icon={LayoutDashboard} label="总览" to="/dashboard" collapsed={collapsed} />
        <NavItem
          icon={ShieldCheck}
          label="权限管理"
          to="/permissions"
          collapsed={collapsed}
          subItems={[
            { label: "角色管理", to: "/permissions/roles" },
            { label: "用户权限", to: "/permissions/users" },
          ]}
        />
        <NavItem
          icon={Search}
          label="爬虫数据管理"
          to="/crawler"
          collapsed={collapsed}
          subItems={[
            { label: "数据列表", to: "/crawler/list" },
            { label: "新建任务", to: "/crawler/new" },
            { label: "数据清洗", to: "/crawler/cleaning" },
          ]}
        />
        <NavItem
          icon={GraduationCap}
          label="学校管理"
          to="/schools"
          collapsed={collapsed}
          subItems={[{ label: "学校列表", to: "/schools/list" }]}
        />
        <NavItem
          icon={Users}
          label="学生管理"
          to="/students"
          collapsed={collapsed}
          subItems={[{ label: "学生列表", to: "/students/list" }]}
        />
        <NavItem
          icon={Briefcase}
          label="企业管理"
          to="/enterprises"
          collapsed={collapsed}
          subItems={[
            { label: "目标企业", to: "/enterprises/target" },
            { label: "合作企业", to: "/enterprises/list" },
          ]}
        />
        <NavItem
          icon={Briefcase}
          label="职位管理"
          to="/positions"
          collapsed={collapsed}
          subItems={[{ label: "职位列表", to: "/positions/list" }]}
        />
        <NavItem
          icon={BarChart3}
          label="数据统计"
          to="/statistics"
          collapsed={collapsed}
          subItems={[
            { label: "学校统计", to: "/statistics/schools" },
            { label: "学生统计", to: "/statistics/students" },
            { label: "职位统计", to: "/statistics/positions" },
          ]}
        />
      </nav>
    </div>
  );
};

import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, ClipboardList, Library, Database,
  BarChart3, Share2, Settings, FileText, PieChart, LogOut, Sparkles
} from 'lucide-react';

const menuGroups = [
  {
    title: '主菜单',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: '工作台' },
      { to: '/questionnaires', icon: ClipboardList, label: '问卷管理' },
      { to: '/scales', icon: Library, label: '量表库' },
    ],
  },
  {
    title: '数据与分析',
    items: [
      { to: '/data', icon: Database, label: '数据管理' },
      { to: '/statistics', icon: BarChart3, label: '统计分析' },
    ],
  },
  {
    title: '分发',
    items: [
      { to: '/distribution', icon: Share2, label: '问卷分发' },
    ],
  },
  {
    title: 'AI 报告',
    items: [
      { to: '/reports/config', icon: Settings, label: '报告配置' },
      { to: '/reports', icon: FileText, label: '报告列表' },
      { to: '/reports/aggregate', icon: PieChart, label: '整体分析' },
    ],
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-[260px] min-w-[260px] bg-sidebar-bg flex flex-col h-screen sticky top-0 max-lg:w-[200px] max-lg:min-w-[200px] max-md:hidden border-r border-border">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <Sparkles size={18} />
          </div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            Q-Hub
          </h1>
        </div>
        <p className="text-text-muted text-xs mt-1.5">问卷量表管理平台</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {menuGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-text-muted/70 text-xs font-semibold uppercase tracking-wider px-3 mb-2">
              {group.title}
            </h3>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive(item.to)
                        ? 'bg-primary-light text-primary font-medium'
                        : 'text-text-secondary hover:bg-background hover:text-text-primary'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-primary font-semibold text-sm">
            {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-primary truncate">{user?.displayName || user?.email}</p>
            <p className="text-xs text-text-muted">{user?.role === 'admin' ? '管理员' : '用户'}</p>
          </div>
          <button
            onClick={logout}
            className="text-text-muted hover:text-danger transition-colors p-1"
            title="退出登录"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

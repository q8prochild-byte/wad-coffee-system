import { NavLink } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettingsContext';

interface NavItem {
  path: string;
  icon: string;
  label: string;
}

const navItems: NavItem[] = [
  { path: '/', icon: '📊', label: 'لوحة التحكم' },
  { path: '/products', icon: '📦', label: 'المنتجات' },
  { path: '/sales', icon: '🛒', label: 'المبيعات اليومية' },
  { path: '/reports', icon: '📈', label: 'التقارير' },
  { path: '/settings', icon: '⚙️', label: 'الإعدادات' },
];

export default function Sidebar() {
  const { settings } = useSettings();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">☕</span>
        <span className="sidebar-logo-text">{settings.shopName}</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">نظام إدارة القهوة v1.0</div>
    </aside>
  );
}

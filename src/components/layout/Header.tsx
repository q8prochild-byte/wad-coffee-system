import { useSettings } from '../../hooks/useSettingsContext';
import { useAuth } from '../../hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { settings } = useSettings();
  const { signOut } = useAuth();
  const today = new Date().toLocaleDateString('ar-KW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="menu-toggle-btn" onClick={onMenuClick} aria-label="القائمة">
          ☰
        </button>
        <div className="header-title">☕ {settings.shopName}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="header-date">
          <span>📅</span>
          <span>{today}</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={signOut}>
          🚪 <span className="logout-label">تسجيل الخروج</span>
        </button>
      </div>
    </header>
  );
}

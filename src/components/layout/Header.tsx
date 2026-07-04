import { useSettings } from '../../hooks/useSettingsContext';
import { useAuth } from '../../hooks/useAuth';

export default function Header() {
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
      <div className="header-title">☕ {settings.shopName}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="header-date">
          <span>📅</span>
          <span>{today}</span>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={signOut}>
          🚪 تسجيل الخروج
        </button>
      </div>
    </header>
  );
}
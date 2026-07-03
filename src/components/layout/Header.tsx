import { useSettings } from '../../hooks/useSettingsContext';

export default function Header() {
  const { settings } = useSettings();
  const today = new Date().toLocaleDateString('ar-KW', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="header">
      <div className="header-title">☕ {settings.shopName}</div>
      <div className="header-date">
        <span>📅</span>
        <span>{today}</span>
      </div>
    </header>
  );
}

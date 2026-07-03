import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './hooks/useSettingsContext';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <div className="app-container">
          <Sidebar />
          <div className="main-wrapper">
            <Header />
            <main className="page-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    </SettingsProvider>
  );
}

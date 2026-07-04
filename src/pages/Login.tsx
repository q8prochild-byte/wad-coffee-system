import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { signIn, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await signIn(email, password);
    setSubmitting(false);
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg, #f5f3f0)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{ width: '100%', maxWidth: 380, padding: 32 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>☕</div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>تسجيل الدخول</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            نظام إدارة مبيعات محل القهوة
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">البريد الإلكتروني</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="alert alert-danger">⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ width: '100%', padding: '12px', fontSize: 15 }}
          >
            {submitting ? '⏳ جاري الدخول...' : '🔑 دخول'}
          </button>
        </div>
      </form>
    </div>
  );
}

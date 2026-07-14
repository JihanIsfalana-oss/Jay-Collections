'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json().catch(() => ({}));
      console.log('[LOGIN RESPONSE]', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || 'Login gagal');
      }

      if (data?.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.data.user || {}));
      }

      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f9fafb', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
        <h1 style={{ marginTop: 0, color: '#111827' }}>Masuk</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>Selamat datang di Platform Wedding Invitation Digital Terbaik di Indonesia.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>Username atau email</span>
            <input
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #d1d5db' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>Kata sandi</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #d1d5db' }}
            />
          </label>
          {error ? <p style={{ color: '#b91c1c', margin: 0 }}>{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            style={{ background: '#111827', color: '#fff', padding: '12px 16px', borderRadius: 12, border: 'none', cursor: loading ? 'wait' : 'pointer' }}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
        <p style={{ marginTop: 16, color: '#6b7280' }}>
          Belum punya akun? <Link href="/register" style={{ color: '#d97706' }}>Daftar sekarang</Link>
        </p>
      </div>
    </main>
  );
}

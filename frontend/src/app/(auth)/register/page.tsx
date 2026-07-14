'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const username = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_');
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: name,
          nick_name: name.split(' ')[0],
          birth_date: '1990-01-01',
          birth_place: 'Jakarta',
          username,
          email,
          password,
        }),
      });

      const data = await response.json().catch(() => ({}));
      console.log('[REGISTER RESPONSE]', response.status, data);

      if (!response.ok) {
        throw new Error(data.message || 'Registrasi gagal');
      }

      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registrasi gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f9fafb', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
        <h1 style={{ marginTop: 0, color: '#111827' }}>Daftar</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>Buat akun untuk mulai mengatur undangan digital Anda.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>Nama lengkap</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              style={{ padding: '12px 14px', borderRadius: 12, border: '1px solid #d1d5db' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
            {loading ? 'Memproses...' : 'Daftar'}
          </button>
        </form>
        <p style={{ marginTop: 16, color: '#6b7280' }}>
          Sudah punya akun? <Link href="/login" style={{ color: '#d97706' }}>Masuk</Link>
        </p>
      </div>
    </main>
  );
}

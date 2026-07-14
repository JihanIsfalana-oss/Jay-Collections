'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UserProfile {
  username?: string;
  email?: string;
  nama_lengkap?: string;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = window.localStorage.getItem('auth_token');
    const savedUser = window.localStorage.getItem('auth_user');

    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      const parsedUser = savedUser ? (JSON.parse(savedUser) as UserProfile) : null;
      const decodedUser = decodeJwtPayload(token) as UserProfile | null;
      setUser(parsedUser || decodedUser || { username: 'Pengguna' });
    } catch {
      setUser({ username: 'Pengguna' });
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    window.localStorage.removeItem('auth_token');
    window.localStorage.removeItem('auth_user');
    router.replace('/login');
  };

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', padding: 32, background: '#f9fafb' }}>
        <p>Memuat dashboard...</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', padding: 32, background: '#f9fafb' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ margin: 0, color: '#d97706', fontWeight: 700 }}>Selamat datang</p>
            <h1 style={{ margin: '4px 0 0', color: '#111827' }}>Dashboard</h1>
          </div>
          <button onClick={handleLogout} style={{ border: '1px solid #d1d5db', background: '#fff', padding: '10px 14px', borderRadius: 999, cursor: 'pointer' }}>
            Keluar
          </button>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ background: '#f9fafb', borderRadius: 16, padding: 16 }}>
            <p style={{ margin: 0, color: '#6b7280' }}>Nama pengguna</p>
            <p style={{ margin: '6px 0 0', fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {user?.nama_lengkap || user?.username || 'Pengguna'}
            </p>
          </div>
          <div style={{ background: '#f9fafb', borderRadius: 16, padding: 16 }}>
            <p style={{ margin: 0, color: '#6b7280' }}>Email</p>
            <p style={{ margin: '6px 0 0', fontSize: 18, color: '#111827' }}>
              {user?.email || 'Belum tersedia'}
            </p>
          </div>
          <div style={{ background: '#fff7ed', borderRadius: 16, padding: 16, border: '1px solid #fed7aa' }}>
            <p style={{ margin: 0, color: '#9a2c00' }}>Status</p>
            <p style={{ margin: '6px 0 0', color: '#111827' }}>Anda sudah berhasil masuk ke sistem Jay Collections.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
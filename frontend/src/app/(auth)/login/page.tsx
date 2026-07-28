'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import {
  ButtonLink,
  PageShell,
  Pill,
  Surface,
  bodyTextStyle,
  cardStyle,
  containerStyle,
  gridTwoStyle,
  inputStyle,
  labelStyle,
  mutedSurfaceStyle,
  subtitleStyle,
  titleStyle,
} from '../../../components/site-kit';

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
    <PageShell>
      <div style={{ ...containerStyle, padding: '32px 0 56px' }}>
        <div style={{ ...gridTwoStyle, alignItems: 'stretch' }}>
          <section style={{ ...cardStyle, borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
            <Pill>Akses Pengguna</Pill>
            <h1 style={{ ...titleStyle, marginTop: 18, fontSize: 'clamp(2.3rem, 4.5vw, 4rem)' }}>Masuk dengan alur yang ringkas, aman, dan jelas.</h1>
            <p style={{ ...subtitleStyle, maxWidth: 620 }}>
              Gunakan kredensial Anda untuk mengelola referensi desain, memeriksa status pesanan, dan meninjau informasi akun pada satu ruang kerja yang lebih tertata.
            </p>

            <div style={{ display: 'grid', gap: 14, marginTop: 28 }}>
              <article style={{ ...mutedSurfaceStyle, borderRadius: 24, padding: 18 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>Kejelasan akses</p>
                <p style={{ ...bodyTextStyle, marginTop: 8 }}>Login diarahkan ke pengalaman yang singkat tanpa mengorbankan kejelasan informasi.</p>
              </article>
              <article style={{ ...mutedSurfaceStyle, borderRadius: 24, padding: 18 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>Bahasa baku</p>
                <p style={{ ...bodyTextStyle, marginTop: 8 }}>Seluruh label dan pesan disusun dengan bahasa Indonesia formal sesuai standar KBBI.</p>
              </article>
            </div>
          </section>

          <Surface style={{ borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#b78b2e', fontSize: 12, fontWeight: 800 }}>Formulir masuk</p>
            <h2 style={{ margin: '10px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '2rem', color: '#1f2937' }}>Selamat datang kembali</h2>
            <p style={{ ...bodyTextStyle, marginTop: 10 }}>Masukkan alamat email atau nama pengguna beserta kata sandi Anda.</p>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
              <label style={labelStyle}>
                <span>Nama pengguna atau email</span>
                <input
                  type="text"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                  placeholder="Masukkan alamat email atau nama pengguna"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                <span>Kata sandi</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="Masukkan kata sandi"
                  style={inputStyle}
                />
              </label>

              {error ? (
                <p style={{ margin: 0, color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: '12px 14px' }}>{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...inputStyle,
                  minHeight: 50,
                  cursor: loading ? 'wait' : 'pointer',
                  background: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
                  color: '#fff',
                  fontWeight: 700,
                }}
              >
                {loading ? 'Memproses...' : 'Masuk ke dashboard'}
              </button>
            </form>

            <p style={{ ...bodyTextStyle, marginTop: 20 }}>
              Belum memiliki akun?{' '}
              <Link href="/register" style={{ color: '#b78b2e', fontWeight: 700, textDecoration: 'none' }}>
                Daftar sekarang
              </Link>
            </p>
            <div style={{ marginTop: 20 }}>
              <ButtonLink href="/">Kembali ke beranda</ButtonLink>
            </div>
          </Surface>
          <GoogleLoginButton />
        </div>
      </div>
    </PageShell>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
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
    <PageShell>
      <div style={{ ...containerStyle, padding: '32px 0 56px' }}>
        <div style={{ ...gridTwoStyle, alignItems: 'stretch' }}>
          <section style={{ ...cardStyle, borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
            <Pill>Buat Akun</Pill>
            <h1 style={{ ...titleStyle, marginTop: 18, fontSize: 'clamp(2.3rem, 4.5vw, 4rem)' }}>Daftar untuk membangun halaman undangan yang lebih tertata.</h1>
            <p style={{ ...subtitleStyle, maxWidth: 620 }}>
              Registrasi disusun singkat agar Anda segera dapat masuk ke ruang kerja, memilih referensi desain, dan menyesuaikan detail acara.
            </p>

            <div style={{ display: 'grid', gap: 14, marginTop: 28 }}>
              <article style={{ ...mutedSurfaceStyle, borderRadius: 24, padding: 18 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>Data utama</p>
                <p style={{ ...bodyTextStyle, marginTop: 8 }}>Gunakan nama lengkap, alamat email, dan kata sandi yang mudah Anda kelola.</p>
              </article>
              <article style={{ ...mutedSurfaceStyle, borderRadius: 24, padding: 18 }}>
                <p style={{ margin: 0, fontWeight: 700, color: '#1f2937' }}>Konsistensi bahasa</p>
                <p style={{ ...bodyTextStyle, marginTop: 8 }}>Seluruh antarmuka mengikuti bahasa Indonesia baku demi kesan profesional.</p>
              </article>
            </div>
          </section>

          <Surface style={{ borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#b78b2e', fontSize: 12, fontWeight: 800 }}>Formulir pendaftaran</p>
            <h2 style={{ margin: '10px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '2rem', color: '#1f2937' }}>Buat akun baru</h2>
            <p style={{ ...bodyTextStyle, marginTop: 10 }}>Isi identitas dasar Anda untuk memulai proses penggunaan aplikasi.</p>

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
              <label style={labelStyle}>
                <span>Nama lengkap</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  placeholder="Masukkan nama lengkap"
                  style={inputStyle}
                />
              </label>
              <label style={labelStyle}>
                <span>Alamat email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="Masukkan alamat email"
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
                  placeholder="Buat kata sandi"
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
                {loading ? 'Memproses...' : 'Daftar sekarang'}
              </button>
            </form>

            <p style={{ ...bodyTextStyle, marginTop: 20 }}>
              Sudah memiliki akun?{' '}
              <Link href="/login" style={{ color: '#b78b2e', fontWeight: 700, textDecoration: 'none' }}>
                Masuk
              </Link>
            </p>
            <div style={{ marginTop: 20 }}>
              <ButtonLink href="/">Kembali ke beranda</ButtonLink>
            </div>
          </Surface>
        </div>
      </div>
    </PageShell>
  );
}

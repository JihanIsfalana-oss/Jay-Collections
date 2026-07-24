'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Pisahkan impor komponen fungsi utama
import { ButtonLink, PageShell, Pill, SectionTitle, Surface } from '../../../components/site-kit';

// Pisahkan impor konstanta objek style bawaan
import {
  cardStyle,
  containerStyle,
  gridThreeStyle,
  helpTextStyle,
  metricCardStyle,
  subtitleStyle,
  titleStyle,
} from '../../../components/site-kit';


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
      <PageShell>
        <div style={{ ...containerStyle, padding: '40px 0' }}>
          <Surface>
            <p style={{ margin: 0 }}>Memuat dashboard...</p>
          </Surface>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div style={{ ...containerStyle, padding: '32px 0 56px' }}>
        <section style={{ ...cardStyle, borderRadius: 34, padding: '32px clamp(24px, 4vw, 44px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <Pill>Ruang Kerja</Pill>
              <h1 style={{ ...titleStyle, marginTop: 16, fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>Dashboard pengguna Jay Digital Invitation</h1>
              <p style={{ ...subtitleStyle, maxWidth: 760 }}>
                Ruang kerja ini menampilkan ringkasan akun, akses cepat ke referensi desain, dan jalur navigasi yang lebih jelas.
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                ...cardStyle,
                borderRadius: 999,
                padding: '12px 18px',
                minHeight: 48,
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.92)',
                fontWeight: 700,
              }}
            >
              Keluar
            </button>
          </div>

          <div style={{ ...gridThreeStyle, marginTop: 28 }}>
            <article style={metricCardStyle}>
              <p style={{ margin: 0, color: '#b78b2e', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Nama pengguna</p>
              <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '1.9rem', color: '#1f2937' }}>{user?.nama_lengkap || user?.username || 'Pengguna'}</p>
            </article>
            <article style={metricCardStyle}>
              <p style={{ margin: 0, color: '#b78b2e', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Alamat email</p>
              <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '1.9rem', color: '#1f2937' }}>{user?.email || 'Belum tersedia'}</p>
            </article>
            <article style={metricCardStyle}>
              <p style={{ margin: 0, color: '#b78b2e', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Status</p>
              <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '1.8rem', color: '#1f2937' }}>Aktif</p>
            </article>
          </div>

          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)', marginTop: 24 }}>
            <Surface style={{ borderRadius: 28, padding: 24 }}>
              <SectionTitle
                eyebrow="Aksi cepat"
                title="Akses yang paling sering dipakai"
                summary="Pilih jalur kerja yang relevan tanpa perlu kembali ke beranda terlebih dahulu."
              />
              <div style={{ display: 'grid', gap: 12, marginTop: 20 }}>
                <ButtonLink href="/referensi-design">Buka referensi desain</ButtonLink>
                <ButtonLink href="/statistik" variant="secondary">
                  Lihat statistik layanan
                </ButtonLink>
                <ButtonLink href="/profil" variant="ghost">
                  Buka profil pengguna
                </ButtonLink>
              </div>
            </Surface>

            <Surface style={{ borderRadius: 28, padding: 24 }}>
              <SectionTitle
                eyebrow="Kondisi akun"
                title="Ringkasan status sesi"
                summary="Bagian ini menggantikan tampilan kosong dengan informasi yang lebih fungsional."
              />
              <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                <div style={{ padding: 16, borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Sesi autentikasi</p>
                  <p style={{ ...helpTextStyle, marginTop: 8 }}>Tersambung dan siap digunakan untuk navigasi berikutnya.</p>
                </div>
                <div style={{ padding: 16, borderRadius: 18, background: '#f8f7f3', border: '1px solid #d6d3cc' }}>
                  <p style={{ margin: 0, fontWeight: 700 }}>Ruang kerja</p>
                  <p style={{ ...helpTextStyle, marginTop: 8 }}>Dashboard, profil, dan order kini memiliki halaman yang lebih lengkap.</p>
                </div>
              </div>
            </Surface>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
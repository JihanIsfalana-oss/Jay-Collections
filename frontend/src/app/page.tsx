import Link from 'next/link';

const highlights = [
  {
    title: 'Desain undangan premium',
    description: 'Pilih template elegan, modern, dan sesuai tema pernikahan Anda.',
  },
  {
    title: 'Upload foto & video',
    description: 'Simpan momen penting dan bagikan ulang dengan keluarga dan tamu.',
  },
  {
    title: 'Pembayaran praktis',
    description: 'Selesaikan pesanan dengan alur yang sederhana dan aman.',
  },
];

export default function HomePage() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff8f0 0%, #fef3c7 100%)', padding: '48px 24px' }}>
      <section style={{ maxWidth: 1100, margin: '0 auto', background: '#ffffff', borderRadius: 24, boxShadow: '0 20px 45px rgba(15, 23, 42, 0.08)', padding: '48px' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '0.2em', color: '#d97706', fontWeight: 700 }}>Jay Collections</p>
        <h1 style={{ fontSize: '2.5rem', margin: '12px 0', color: '#111827' }}>Buat undangan digital yang elegan dan mudah dibagikan.</h1>
        <p style={{ fontSize: '1.05rem', color: '#4b5563', maxWidth: 720, lineHeight: 1.7 }}>
          Platform ini membantu pasangan memesan undangan digital, mengatur konten, dan menampilkan desain terbaik untuk hari istimewa.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
          <Link href="/register" style={{ background: '#111827', color: '#fff', padding: '12px 18px', borderRadius: 999, textDecoration: 'none' }}>Buat akun</Link>
          <Link href="/login" style={{ border: '1px solid #d1d5db', color: '#111827', padding: '12px 18px', borderRadius: 999, textDecoration: 'none' }}>Masuk</Link>
        </div>
      </section>

      <section style={{ maxWidth: 1100, margin: '24px auto 0', display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        {highlights.map((item) => (
          <article key={item.title} style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
            <h2 style={{ marginTop: 0, color: '#111827' }}>{item.title}</h2>
            <p style={{ color: '#6b7280', lineHeight: 1.6 }}>{item.description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

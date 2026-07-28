import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/seo/JsonLd';
import { localBusinessSchema, organizationSchema, websiteSchema } from '@/components/seo/schema';
import styles from './page.module.css';

const features = [
  {
    title: 'Tata visual yang tenang',
    description: 'Palet gray, white, dan gold menjaga kesan premium tanpa terlihat berlebihan.',
  },
  {
    title: 'Bahasa formal dan baku',
    description: 'Seluruh salinan antarmuka diarahkan ke bahasa Indonesia baku yang profesional.',
  },
  {
    title: 'Alur yang lengkap',
    description: 'Dari referensi desain sampai dashboard, pengalaman dibuat utuh dan mudah ditelusuri.',
  },
];

const processSteps = [
  {
    step: '01',
    title: 'Pilih referensi',
    description: 'Telusuri kategori desain untuk menemukan gaya yang paling sesuai dengan karakter acara.',
  },
  {
    step: '02',
    title: 'Sesuaikan konten',
    description: 'Lengkapi informasi pasangan, galeri, jadwal, dan susunan acara secara rapi.',
  },
  {
    step: '03',
    title: 'Publikasikan',
    description: 'Bagikan tautan undangan digital yang konsisten, elegan, dan siap dipresentasikan.',
  },
];

const showcase = [
  {
    title: 'Elegan klasik',
    description: 'Cocok untuk pasangan yang menginginkan suasana formal dan berwibawa.',
  },
  {
    title: 'Minimalis modern',
    description: 'Memberikan ruang bernapas yang cukup dengan komposisi visual yang bersih.',
  },
  {
    title: 'Tradisional hangat',
    description: 'Menonjolkan nuansa adat dan keakraban tanpa mengorbankan keterbacaan.',
  },
];

export const metadata: Metadata = {
  title: 'Undangan Digital Pernikahan Elegan',
  description:
    'Buat undangan digital pernikahan klasik modern yang elegan, mudah dipersonalisasi, dan siap dibagikan kepada tamu.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <main className={styles.page}>
      <JsonLd data={websiteSchema} />
      <JsonLd data={organizationSchema} />
      <JsonLd data={localBusinessSchema} />

      <div className={styles.container}>
        <section className={`${styles.surface} ${styles.hero}`}>
          <div className={styles.heroBar}>
            <span className={styles.pill}>Jay Digital Invitation</span>
            <div className={styles.inlineActions}>
              <Link className={`${styles.action} ${styles.actionSecondary}`} href="/referensi-design">
                Lihat referensi
              </Link>
              <Link className={`${styles.action} ${styles.actionPrimary}`} href="/register">
                Buat akun
              </Link>
            </div>
          </div>

          <div className={styles.heroContent}>
            <div>
              <h1 className={styles.heroTitle}>Undangan digital dengan karakter klasik modern yang tertata dan berkelas.</h1>
              <p className={styles.subtitle}>
                Jay Digital Invitation merancang pengalaman undangan digital yang lebih rapi, formal, dan otomatisasi pembagian undangan, dengan penekanan pada estetika abu, putih, dan emas yang konsisten.
              </p>
              <div className={styles.inlineActions}>
                <Link className={`${styles.action} ${styles.actionPrimary}`} href="/dashboard">
                  Masuk ke dashboard
                </Link>
                <Link className={`${styles.action} ${styles.actionSecondary}`} href="/login">
                  Masuk ke akun
                </Link>
              </div>
              <div className={styles.metrics}>
                <article className={styles.metricCard}>
                  <p className={styles.metricLabel}>Kategori</p>
                  <p className={styles.metricValue}>18+</p>
                  <p className={styles.helpText}>Referensi desain yang terkurasi.</p>
                </article>
                <article className={styles.metricCard}>
                  <p className={styles.metricLabel}>Layanan</p>
                  <p className={styles.metricValue}>24 jam</p>
                  <p className={styles.helpText}>Akses dan pemantauan sepanjang waktu.</p>
                </article>
                <article className={styles.metricCard}>
                  <p className={styles.metricLabel}>Bahasa baku</p>
                  <p className={styles.metricValue}>100%</p>
                  <p className={styles.helpText}>Seluruh antarmuka ditulis formal.</p>
                </article>
              </div>
            </div>

            <section className={`${styles.surface} ${styles.showcasePanel}`} aria-labelledby="showcase-title">
              <h2 id="showcase-title" className={styles.eyebrow}>Sorotan singkat</h2>
              <div className={styles.showcaseList}>
                {showcase.map((item) => (
                  <article key={item.title} className={styles.showcaseItem}>
                    <h3 className={styles.itemTitle}>{item.title}</h3>
                    <p className={styles.bodyText}>{item.description}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className={`${styles.section} ${styles.threeColumnGrid}`} aria-labelledby="features-title">
          <h2 id="features-title" className={styles.visuallyHidden}>Keunggulan Jay Digital Invitation</h2>
          {features.map((item) => (
            <article key={item.title} className={styles.card}>
              <p className={styles.eyebrow}>Keunggulan</p>
              <h3 className={styles.cardTitle}>{item.title}</h3>
              <p className={styles.bodyText}>{item.description}</p>
            </article>
          ))}
        </section>

        <section className={`${styles.section} ${styles.card}`} aria-labelledby="workflow-title">
          <header>
            <p className={styles.eyebrow}>Alur kerja</p>
            <h2 id="workflow-title" className={styles.sectionTitle}>Rangkaian pengalaman yang utuh dari pemilihan hingga publikasi</h2>
            <p className={styles.sectionSummary}>Seluruh halaman disusun agar pengunjung memahami perjalanan layanan tanpa harus menebak-nebak fungsi setiap bagian.</p>
          </header>
          <div className={`${styles.threeColumnGrid} ${styles.topGap}`}>
            {processSteps.map((item) => (
              <article key={item.step} className={styles.stepCard}>
                <p className={styles.stepNumber}>{item.step}</p>
                <h3 className={styles.stepTitle}>{item.title}</h3>
                <p className={styles.bodyText}>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.section} ${styles.twoColumnGrid}`}>
          <section className={`${styles.surface} ${styles.card}`} aria-labelledby="palette-title">
            <header>
              <p className={styles.eyebrow}>Sorotan desain</p>
              <h2 id="palette-title" className={styles.sectionTitle}>Palet warna tenang untuk menegaskan kesan premium</h2>
              <p className={styles.sectionSummary}>Perpaduan gray, putih, dan gold menjaga tampilan tetap formal, bersih, serta mudah dipindai pada layar kecil maupun besar.</p>
            </header>
            <dl className={styles.detailList}>
              <div className={styles.detailRow}>
                <dt>Warna dominan</dt>
                <dd>Gray, putih, emas</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Nada bahasa</dt>
                <dd>Baku, formal, profesional</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Arah pengalaman</dt>
                <dd>Lengkap dan konsisten</dd>
              </div>
            </dl>
          </section>

          <section className={`${styles.surface} ${styles.card}`} aria-labelledby="quick-access-title">
            <header>
              <p className={styles.eyebrow}>Akses cepat</p>
              <h2 id="quick-access-title" className={styles.sectionTitle}>Masuk ke area kerja dan katalog referensi</h2>
              <p className={styles.sectionSummary}>Halaman publik dan halaman internal dipisahkan dengan jelas agar navigasi tetap efisien.</p>
            </header>
            <nav className={styles.stackedActions} aria-label="Akses cepat">
              <Link className={`${styles.action} ${styles.actionPrimary}`} href="/referensi-design">
                Buka katalog desain
              </Link>
              <Link className={`${styles.action} ${styles.actionSecondary}`} href="/statistik">
                Lihat statistik layanan
              </Link>
              <Link className={`${styles.action} ${styles.actionGhost}`} href="/dashboard">
                Buka dashboard pengguna
              </Link>
            </nav>
          </section>
        </section>

        <section className={`${styles.section} ${styles.card}`} aria-labelledby="catalog-title">
          <header>
            <p className={styles.eyebrow}>Katalog singkat</p>
            <h2 id="catalog-title" className={styles.sectionTitle}>Kategori referensi yang menampilkan pilihan paling relevan</h2>
            <p className={styles.sectionSummary}>Tampilan ini menggantikan halaman kosong dengan konteks yang benar-benar berguna bagi pengunjung pertama kali.</p>
          </header>
          <div className={`${styles.threeColumnGrid} ${styles.topGap}`}>
            {['Elegan formal', 'Floral lembut', 'Tradisional modern'].map((item) => (
              <article key={item} className={styles.stepCard}>
                <p className={styles.eyebrow}>Kategori</p>
                <h3 className={styles.stepTitle}>{item}</h3>
                <p className={styles.bodyText}>Disusun untuk memberikan arah visual yang jelas pada calon pengguna.</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

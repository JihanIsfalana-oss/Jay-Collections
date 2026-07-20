import Link from 'next/link';
import type { CSSProperties, ReactNode } from 'react';

const palette = {
  ink: '#1f2937',
  softInk: '#4b5563',
  mist: '#f3f4f6',
  pearl: '#fafafa',
  gold: '#b78b2e',
  goldSoft: '#e8dcc0',
  goldDeep: '#7a5a18',
  line: '#d6d3cc',
  surface: 'rgba(255, 255, 255, 0.84)',
};

export const pageShellStyle: CSSProperties = {
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  background:
    'radial-gradient(circle at top left, rgba(183, 139, 46, 0.16), transparent 28%), radial-gradient(circle at top right, rgba(31, 41, 55, 0.08), transparent 22%), linear-gradient(180deg, #f8f7f3 0%, #eef0f2 100%)',
  color: palette.ink,
};

export const pageGlowStyle: CSSProperties = {
  position: 'absolute',
  inset: 'auto auto 6% -8%',
  width: 320,
  height: 320,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(183, 139, 46, 0.24) 0%, rgba(183, 139, 46, 0.04) 56%, transparent 72%)',
  filter: 'blur(4px)',
  pointerEvents: 'none',
};

export const topGlowStyle: CSSProperties = {
  position: 'absolute',
  inset: '-5% -8% auto auto',
  width: 280,
  height: 280,
  borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(31, 41, 55, 0.08) 0%, rgba(31, 41, 55, 0.02) 58%, transparent 75%)',
  pointerEvents: 'none',
};

export const containerStyle: CSSProperties = {
  width: 'min(1180px, calc(100% - 40px))',
  margin: '0 auto',
  position: 'relative',
  zIndex: 1,
};

export const surfaceStyle: CSSProperties = {
  background: palette.surface,
  border: `1px solid ${palette.line}`,
  boxShadow: '0 24px 70px rgba(31, 41, 55, 0.08)',
  backdropFilter: 'blur(18px)',
};

export const mutedSurfaceStyle: CSSProperties = {
  ...surfaceStyle,
  background: 'rgba(255, 255, 255, 0.72)',
};

export const sectionSpacingStyle: CSSProperties = {
  marginTop: 28,
};

export const eyebrowStyle: CSSProperties = {
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.24em',
  fontSize: 12,
  fontWeight: 800,
  color: palette.gold,
};

export const titleStyle: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-heading), serif',
  fontSize: 'clamp(2rem, 4vw, 4.4rem)',
  lineHeight: 1.02,
  color: palette.ink,
};

export const subtitleStyle: CSSProperties = {
  margin: '16px 0 0',
  color: palette.softInk,
  lineHeight: 1.8,
  fontSize: '1.02rem',
};

export const sectionTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading), serif',
  fontSize: 'clamp(1.5rem, 2vw, 2.4rem)',
  lineHeight: 1.12,
  color: palette.ink,
};

export const bodyTextStyle: CSSProperties = {
  color: palette.softInk,
  lineHeight: 1.8,
  margin: 0,
};

export const cardStyle: CSSProperties = {
  ...surfaceStyle,
  borderRadius: 28,
  padding: 24,
};

export const compactCardStyle: CSSProperties = {
  ...surfaceStyle,
  borderRadius: 22,
  padding: 20,
};

export const gridTwoStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
};

export const gridThreeStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
};

export const gridFourStyle: CSSProperties = {
  display: 'grid',
  gap: 20,
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
};

export const actionPrimaryStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 48,
  padding: '0 20px',
  borderRadius: 999,
  background: 'linear-gradient(135deg, #1f2937 0%, #4b5563 100%)',
  color: '#ffffff',
  textDecoration: 'none',
  fontWeight: 700,
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 16px 36px rgba(31, 41, 55, 0.22)',
};

export const actionSecondaryStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  minHeight: 48,
  padding: '0 20px',
  borderRadius: 999,
  background: 'rgba(255, 255, 255, 0.92)',
  color: palette.ink,
  textDecoration: 'none',
  fontWeight: 700,
  border: `1px solid ${palette.line}`,
};

export const actionGhostStyle: CSSProperties = {
  ...actionSecondaryStyle,
  background: 'transparent',
};

export const inputStyle: CSSProperties = {
  width: '100%',
  minHeight: 48,
  borderRadius: 14,
  border: `1px solid ${palette.line}`,
  background: 'rgba(255, 255, 255, 0.9)',
  padding: '0 14px',
  font: 'inherit',
  color: palette.ink,
  outline: 'none',
};

export const textAreaStyle: CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  padding: '14px',
  resize: 'vertical',
};

export const labelStyle: CSSProperties = {
  display: 'grid',
  gap: 8,
  fontSize: 14,
  fontWeight: 600,
  color: palette.ink,
};

export const helpTextStyle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: palette.softInk,
  lineHeight: 1.6,
};

export const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  borderRadius: 999,
  border: `1px solid ${palette.goldSoft}`,
  background: 'rgba(255, 248, 230, 0.84)',
  color: palette.goldDeep,
  padding: '8px 14px',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

export const metricCardStyle: CSSProperties = {
  ...compactCardStyle,
  borderRadius: 24,
  padding: 20,
};

export const dividerStyle: CSSProperties = {
  border: 0,
  borderTop: `1px solid ${palette.line}`,
  margin: '20px 0',
};

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main style={pageShellStyle}>
      <div style={topGlowStyle} />
      <div style={pageGlowStyle} />
      {children}
    </main>
  );
}

export function Surface({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <section style={{ ...cardStyle, ...(style ?? {}) }}>{children}</section>;
}

export function SectionTitle({
  eyebrow,
  title,
  summary,
  align = 'left',
}: {
  eyebrow: string;
  title: string;
  summary?: string;
  align?: 'left' | 'center';
}) {
  return (
    <header style={{ textAlign: align }}>
      <p style={eyebrowStyle}>{eyebrow}</p>
      <h2 style={{ ...sectionTitleStyle, marginTop: 8 }}>{title}</h2>
      {summary ? <p style={{ ...subtitleStyle, marginTop: 12, fontSize: '0.98rem' }}>{summary}</p> : null}
    </header>
  );
}

export function ButtonLink({
  href,
  children,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  const style = variant === 'primary' ? actionPrimaryStyle : variant === 'ghost' ? actionGhostStyle : actionSecondaryStyle;
  return (
    <Link href={href} style={style}>
      {children}
    </Link>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span style={badgeStyle}>{children}</span>;
}

export function MetricCard({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <article style={metricCardStyle}>
      <p style={{ margin: 0, color: palette.gold, fontSize: 13, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</p>
      <p style={{ margin: '10px 0 0', fontFamily: 'var(--font-heading), serif', fontSize: '2rem', color: palette.ink }}>{value}</p>
      {note ? <p style={{ ...helpTextStyle, marginTop: 8 }}>{note}</p> : null}
    </article>
  );
}

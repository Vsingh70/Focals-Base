import type { CSSProperties, ReactNode } from 'react';
import { Wordmark } from '@/components/brand/Wordmark';
import { LT } from './tokens';

/**
 * Static web-app screens shown inside <BrowserFrame> on the landing pages.
 * Purely presentational — the prototype's landing-mocks.jsx was not
 * included in the design handoff, so these are rebuilt to match the real
 * app's modules (Projects / Clients / Finances) in the marketing palette.
 */

type Tone = 'inquiry' | 'upcoming' | 'progress' | 'delivered';

const TONES: Record<Tone, { label: string; color: string; bg: string }> = {
  inquiry: { label: 'Inquiry', color: LT.text2, bg: LT.bg3 },
  upcoming: { label: 'Upcoming', color: LT.accent, bg: LT.accentA14 },
  progress: { label: 'In progress', color: LT.warning, bg: LT.warningA12 },
  delivered: { label: 'Delivered', color: LT.success, bg: LT.successA12 },
};

function Pill({ tone }: { tone: Tone }) {
  const t = TONES[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: 999,
        fontFamily: LT.ui,
        fontSize: 11,
        fontWeight: 600,
        color: t.color,
        background: t.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {t.label}
    </span>
  );
}

const NAV = ['Dashboard', 'Projects', 'Clients', 'Finances', 'Contracts', 'Calendar', 'Gear'];

function Shell({ active, title, children }: { active: string; title: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100%', background: LT.bg, fontFamily: LT.ui }}>
      <aside
        style={{
          width: 158,
          flex: '0 0 auto',
          borderRight: `0.5px solid ${LT.border}`,
          padding: '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <div style={{ padding: '2px 8px 12px' }}>
          <Wordmark fontSize="15px" />
        </div>
        {NAV.map((n) => (
          <div
            key={n}
            style={{
              padding: '6px 8px',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: n === active ? 600 : 500,
              color: n === active ? LT.text : LT.text2,
              background: n === active ? LT.bg2 : 'transparent',
            }}
          >
            {n}
          </div>
        ))}
      </aside>
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '13px 18px',
            borderBottom: `0.5px solid ${LT.border}`,
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: LT.text }}>{title}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 26,
                padding: '0 12px',
                borderRadius: 7,
                border: `0.5px solid ${LT.border}`,
                background: LT.bg2,
                fontSize: 11.5,
                color: LT.text3,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              Search…
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 26,
                padding: '0 12px',
                borderRadius: 7,
                background: LT.accent,
                color: '#0a0a0a',
                fontSize: 11.5,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              + New
            </span>
          </span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
}

const rowGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 2.1fr) minmax(0, 1fr) minmax(0, 0.8fr) minmax(0, 0.7fr)',
  gap: 10,
  alignItems: 'center',
  padding: '10px 18px',
};

const PROJECTS = [
  { name: 'Harper & Cole — Wedding', client: 'Harper Quinn', tone: 'upcoming' as Tone, date: 'Jun 21', bal: '$1,200' },
  { name: 'Aster Skincare — Brand', client: 'Mia Tanaka', tone: 'progress' as Tone, date: 'Jun 14', bal: '$850' },
  { name: 'Loft 27 Editorial', client: 'Devon Lee', tone: 'upcoming' as Tone, date: 'Jun 28', bal: '$2,400' },
  { name: 'Velo Cycles — Product', client: 'Jonah Park', tone: 'progress' as Tone, date: 'Jun 17', bal: '$1,600' },
  { name: 'Reyes Family Portraits', client: 'Sofia Reyes', tone: 'delivered' as Tone, date: 'Jun 2', bal: 'Paid' },
  { name: 'Maya & Iris — Engagement', client: 'Maya Chen', tone: 'inquiry' as Tone, date: '—', bal: '—' },
  { name: 'Northside Realty Interiors', client: 'Priya Anand', tone: 'delivered' as Tone, date: 'May 28', bal: 'Paid' },
  { name: 'Cedar & Salt — Lookbook', client: 'Theo Marsh', tone: 'upcoming' as Tone, date: 'Jul 5', bal: '$3,100' },
];

export function WebDashboard() {
  return (
    <Shell active="Projects" title="Projects">
      <div
        style={{
          ...rowGrid,
          padding: '8px 18px',
          borderBottom: `0.5px solid ${LT.border}`,
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: LT.text3,
        }}
      >
        <span>Project</span>
        <span>Status</span>
        <span>Shoot</span>
        <span style={{ textAlign: 'right' }}>Balance</span>
      </div>
      {PROJECTS.map((p) => (
        <div key={p.name} style={{ ...rowGrid, borderBottom: `0.5px solid ${LT.border}` }}>
          <span style={{ minWidth: 0 }}>
            <span
              style={{
                display: 'block',
                fontSize: 13,
                fontWeight: 600,
                color: LT.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {p.name}
            </span>
            <span style={{ display: 'block', fontSize: 11.5, color: LT.text2 }}>{p.client}</span>
          </span>
          <span>
            <Pill tone={p.tone} />
          </span>
          <span style={{ fontSize: 12.5, color: LT.text2 }}>{p.date}</span>
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              textAlign: 'right',
              color: p.bal === 'Paid' ? LT.success : LT.text,
            }}
          >
            {p.bal}
          </span>
        </div>
      ))}
    </Shell>
  );
}

const CLIENTS = [
  { name: 'Harper Quinn', email: 'harper@quinn.co', projects: 3, ltv: '$6,400', last: 'Jun 21' },
  { name: 'Mia Tanaka', email: 'mia@asterskin.com', projects: 5, ltv: '$11,250', last: 'Jun 14' },
  { name: 'Devon Lee', email: 'devon@loft27.studio', projects: 2, ltv: '$4,800', last: 'May 30' },
  { name: 'Sofia Reyes', email: 'sofia.reyes@me.com', projects: 4, ltv: '$3,950', last: 'Jun 2' },
  { name: 'Jonah Park', email: 'jonah@velocycles.com', projects: 6, ltv: '$14,200', last: 'Jun 17' },
  { name: 'Priya Anand', email: 'priya@northside.realty', projects: 8, ltv: '$9,600', last: 'May 28' },
  { name: 'Theo Marsh', email: 'theo@cedarsalt.com', projects: 1, ltv: '$3,100', last: '—' },
];

export function WebClients() {
  return (
    <Shell active="Clients" title="Clients">
      <div
        style={{
          ...rowGrid,
          gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 0.8fr) minmax(0, 0.8fr) minmax(0, 0.7fr)',
          padding: '8px 18px',
          borderBottom: `0.5px solid ${LT.border}`,
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: LT.text3,
        }}
      >
        <span>Client</span>
        <span>Projects</span>
        <span>Lifetime</span>
        <span style={{ textAlign: 'right' }}>Last shoot</span>
      </div>
      {CLIENTS.map((c) => (
        <div
          key={c.name}
          style={{
            ...rowGrid,
            gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 0.8fr) minmax(0, 0.8fr) minmax(0, 0.7fr)',
            borderBottom: `0.5px solid ${LT.border}`,
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: 999,
                flex: '0 0 auto',
                background: LT.accentA14,
                color: LT.accent,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10.5,
                fontWeight: 600,
              }}
            >
              {c.name
                .split(' ')
                .map((w) => w[0])
                .join('')}
            </span>
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: LT.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {c.name}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  color: LT.text2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {c.email}
              </span>
            </span>
          </span>
          <span style={{ fontSize: 12.5, color: LT.text2 }}>{c.projects}</span>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: LT.text }}>{c.ltv}</span>
          <span style={{ fontSize: 12.5, color: LT.text2, textAlign: 'right' }}>{c.last}</span>
        </div>
      ))}
    </Shell>
  );
}

const BARS = [34, 46, 38, 58, 50, 72, 64, 86, 70, 92, 78, 100];
const MONTHS = ['J', 'A', 'S', 'O', 'N', 'D', 'J', 'F', 'M', 'A', 'M', 'J'];

export function WebFinances() {
  const kpis = [
    { label: 'Revenue MTD', value: '$12,400', sub: '+18% vs May', subColor: LT.success },
    { label: 'Outstanding', value: '$3,150', sub: '4 invoices', subColor: LT.warning },
    { label: 'Booked ahead', value: '$8,900', sub: 'next 60 days', subColor: LT.text3 },
  ];
  return (
    <Shell active="Finances" title="Finances">
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {kpis.map((k) => (
            <div
              key={k.label}
              style={{
                background: LT.bg2,
                border: `0.5px solid ${LT.border}`,
                borderRadius: 12,
                padding: '12px 14px',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: LT.text3,
                }}
              >
                {k.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 600, color: LT.text, margin: '4px 0 2px' }}>
                {k.value}
              </div>
              <div style={{ fontSize: 11, color: k.subColor }}>{k.sub}</div>
            </div>
          ))}
        </div>
        <div
          style={{
            background: LT.bg2,
            border: `0.5px solid ${LT.border}`,
            borderRadius: 12,
            padding: '14px 16px 10px',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: LT.text, marginBottom: 12 }}>
            Revenue — trailing 12 months
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 96 }}>
            {BARS.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div
                  style={{
                    height: Math.round((b / 100) * 84),
                    borderRadius: 4,
                    background: i === BARS.length - 1 ? LT.accent : LT.accentA33,
                  }}
                />
                <div style={{ fontSize: 9, color: LT.text3, textAlign: 'center' }}>{MONTHS[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: LT.bg2,
            border: `0.5px solid ${LT.border}`,
            borderRadius: 12,
            padding: '12px 16px',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: LT.text, marginBottom: 8 }}>
            Outstanding invoices
          </div>
          {[
            ['Aster Skincare — Brand', '$850 · due Friday'],
            ['Velo Cycles — Product', '$1,600 · due Jun 24'],
          ].map(([n, d]) => (
            <div
              key={n}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                padding: '6px 0',
                fontSize: 12,
              }}
            >
              <span style={{ color: LT.text2 }}>{n}</span>
              <span style={{ color: LT.warning, fontWeight: 600, whiteSpace: 'nowrap' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

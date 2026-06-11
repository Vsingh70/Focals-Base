import type { ReactNode } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  FolderPlus,
  House,
  MoreHorizontal,
  User,
} from 'lucide-react';
import { LT } from './tokens';

/**
 * Static iPhone screens shown inside <PhoneFrame> on the iOS landing page.
 * Purely presentational — the prototype's landing-mocks.jsx was not
 * included in the design handoff, so these are rebuilt to match the real
 * app's modules in the marketing palette.
 */

function TabBar({ active }: { active: string }) {
  const tabs = [
    { name: 'Home', Icon: House },
    { name: 'Projects', Icon: FolderPlus },
    { name: 'Clients', Icon: User },
    { name: 'Finances', Icon: DollarSign },
    { name: 'More', Icon: MoreHorizontal },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'space-around',
        padding: '9px 8px 18px',
        borderTop: `0.5px solid ${LT.border}`,
        background: LT.bg,
      }}
    >
      {tabs.map((t) => (
        <span
          key={t.name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: t.name === active ? LT.accent : LT.text3,
          }}
        >
          <t.Icon size={17} />
          <span style={{ fontFamily: LT.ui, fontSize: 8.5, fontWeight: 600 }}>{t.name}</span>
        </span>
      ))}
    </div>
  );
}

function Screen({ children, tab }: { children: ReactNode; tab?: string }) {
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        background: LT.bg,
        fontFamily: LT.ui,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '10px 16px 0', height: '100%', overflow: 'hidden' }}>{children}</div>
      {tab && <TabBar active={tab} />}
    </div>
  );
}

function ScreenTitle({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: LT.serif,
        fontSize: 24,
        fontWeight: 500,
        letterSpacing: '-0.02em',
        color: LT.text,
        margin: '4px 0 12px',
      }}
    >
      {children}
    </div>
  );
}

// ── Projects pipeline ────────────────────────────────────────

const CHIPS = [
  { label: 'Inquiries', n: 3, on: false },
  { label: 'Upcoming', n: 4, on: true },
  { label: 'In progress', n: 2, on: false },
  { label: 'Delivered', n: 12, on: false },
];

const CARDS = [
  { name: 'Harper & Cole — Wedding', client: 'Harper Quinn', date: 'Sat, Jun 21', bal: '$1,200' },
  { name: 'Loft 27 Editorial', client: 'Devon Lee', date: 'Sat, Jun 28', bal: '$2,400' },
  { name: 'Cedar & Salt — Lookbook', client: 'Theo Marsh', date: 'Sat, Jul 5', bal: '$3,100' },
  { name: 'Nadia — Maternity', client: 'Nadia Brooks', date: 'Sun, Jul 13', bal: '$450' },
];

export function MockProjects() {
  return (
    <Screen tab="Projects">
      <ScreenTitle>Projects</ScreenTitle>
      <div style={{ display: 'flex', gap: 6, overflow: 'hidden', marginBottom: 14 }}>
        {CHIPS.map((c) => (
          <span
            key={c.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              color: c.on ? '#0a0a0a' : LT.text2,
              background: c.on ? LT.accent : LT.bg2,
              border: `0.5px solid ${c.on ? LT.accent : LT.border}`,
            }}
          >
            {c.label}
            <span style={{ opacity: 0.65 }}>{c.n}</span>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {CARDS.map((p) => (
          <div
            key={p.name}
            style={{
              background: LT.bg2,
              border: `0.5px solid ${LT.border}`,
              borderRadius: 14,
              padding: '12px 13px',
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 600, color: LT.text }}>{p.name}</div>
            <div style={{ fontSize: 11.5, color: LT.text2, margin: '2px 0 8px' }}>{p.client}</div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 11.5,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: LT.text2 }}>
                <Calendar size={12} />
                {p.date}
              </span>
              <span style={{ fontWeight: 600, color: LT.accent }}>{p.bal}</span>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

// ── Project detail ───────────────────────────────────────────

export function MockDetail() {
  const stats = [
    { label: 'Shoot', value: 'Jun 21' },
    { label: 'Balance', value: '$1,200' },
    { label: 'Paid', value: '$800' },
  ];
  const rows = [
    ['Payments', '$800 of $2,000'],
    ['Contract', 'Signed'],
    ['Location', 'Forest House, Sonoma'],
    ['Notes', 'Golden hour + rain plan'],
  ];
  return (
    <Screen>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          color: LT.accent,
          fontSize: 13,
          fontWeight: 500,
          margin: '2px 0 10px',
        }}
      >
        <ChevronLeft size={16} />
        Projects
      </div>
      <div
        style={{
          fontFamily: LT.serif,
          fontSize: 21,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          color: LT.text,
        }}
      >
        Harper &amp; Cole — Wedding
      </div>
      <div style={{ fontSize: 12, color: LT.text2, margin: '3px 0 14px' }}>
        Harper Quinn · Upcoming
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 7, marginBottom: 12 }}>
        {stats.map((s) => (
          <div
            key={s.label}
            style={{
              background: LT.bg2,
              border: `0.5px solid ${LT.border}`,
              borderRadius: 12,
              padding: '10px 10px 9px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 9.5,
                fontWeight: 600,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: LT.text3,
              }}
            >
              {s.label}
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 600, color: LT.text, marginTop: 3 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rows.map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              background: LT.bg2,
              border: `0.5px solid ${LT.border}`,
              borderRadius: 12,
              padding: '11px 13px',
            }}
          >
            <span style={{ fontSize: 12.5, fontWeight: 600, color: LT.text }}>{label}</span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11.5,
                color: LT.text2,
                minWidth: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {value}
              <ChevronRight size={13} style={{ color: LT.text3, flex: '0 0 auto' }} />
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

// ── Finances ─────────────────────────────────────────────────

const PHONE_BARS = [38, 52, 44, 66, 58, 80, 70, 100];

export function MockFinances() {
  return (
    <Screen tab="Finances">
      <ScreenTitle>Finances</ScreenTitle>
      <div
        style={{
          background: LT.bg2,
          border: `0.5px solid ${LT.border}`,
          borderRadius: 14,
          padding: '13px 14px',
          marginBottom: 10,
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
          Revenue · June
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, margin: '4px 0 10px' }}>
          <span style={{ fontSize: 23, fontWeight: 600, color: LT.text }}>$12,400</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: LT.success }}>+18% vs May</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 54 }}>
          {PHONE_BARS.map((b, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: Math.round((b / 100) * 54),
                borderRadius: 3,
                background: i === PHONE_BARS.length - 1 ? LT.accent : LT.accentA33,
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
          color: LT.text3,
          margin: '12px 0 8px',
        }}
      >
        Outstanding
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          ['Aster Skincare — Brand', '$850', 'due Friday'],
          ['Velo Cycles — Product', '$1,600', 'due Jun 24'],
          ['Harper & Cole — Wedding', '$1,200', 'due on delivery'],
        ].map(([name, amt, due]) => (
          <div
            key={name}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              background: LT.bg2,
              border: `0.5px solid ${LT.border}`,
              borderRadius: 12,
              padding: '11px 13px',
            }}
          >
            <span style={{ minWidth: 0 }}>
              <span
                style={{
                  display: 'block',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: LT.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {name}
              </span>
              <span style={{ display: 'block', fontSize: 11, color: LT.text3 }}>{due}</span>
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: LT.warning, whiteSpace: 'nowrap' }}>
              {amt}
            </span>
          </div>
        ))}
      </div>
    </Screen>
  );
}

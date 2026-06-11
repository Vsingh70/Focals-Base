// landing-mocks.jsx — static app mock screens for the landing pages.
// Reuses LT (tokens) + Icon from pdata/landing-shared. Purely presentational.

// Small helpers
function pill(tone, label) {
  const c = { neutral: LT.text2, accent: LT.accent, warning: LT.warning, success: LT.success, danger: LT.danger }[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', fontFamily: LT.ui, fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: c, background: c + '1f', padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}>{label}</span>
  );
}
function miniBar(frac) {
  const done = frac >= 1;
  return (
    <div style={{ height: 4, borderRadius: 999, background: LT.bg3, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: (frac * 100) + '%', borderRadius: 999, background: done ? LT.success : LT.accent }} />
    </div>
  );
}

// Phone screen frame (no device bezel — caller wraps in IOSDevice or a plain frame)
function ScreenShell({ title, action, children, pad = 14 }) {
  return (
    <div style={{ height: '100%', background: LT.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 18px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: LT.ui, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: LT.text }}>{title}</span>
          {action}
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: `0 ${pad}px` }}>{children}</div>
    </div>
  );
}

// ── Projects (Cards) ─────────────────────────────────────────
const MOCK_CARDS = [
  { phase: 'Upcoming', color: LT.accent, items: [
    { t: 'Amara & Theo', c: 'Amara Okafor', tone: 'accent', s: 'Booked', price: 4800, paid: 1500, when: 'Sat, Jun 21', loc: 'Riverside Estate' },
    { t: 'Sofia — Senior Portraits', c: 'Sofia Reyes', tone: 'accent', s: 'Booked', price: 650, paid: 0, when: 'Tue, Jun 17', loc: 'Zilker Garden' },
  ]},
  { phase: 'In progress', color: LT.warning, items: [
    { t: 'Maison — SS26 Editorial', c: 'Maison Atelier', tone: 'warning', s: 'Editing', price: 5400, paid: 2700, when: 'Jun 5', loc: 'Downtown Loft' },
    { t: 'Nordic Goods — Brand', c: 'Nordic Goods Co.', tone: 'warning', s: 'In Progress', price: 3200, paid: 3200, when: 'Jun 2', loc: 'Studio 7' },
  ]},
];

function MockProjects() {
  return (
    <ScreenShell title="Projects" action={<div style={{ width: 34, height: 34, borderRadius: 999, background: LT.bg2, border: `0.5px solid ${LT.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: LT.text }}><Icon name="plus" size={18} /></div>}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 10, padding: '0 10px', height: 36, marginBottom: 6 }}>
        <span style={{ color: LT.text3 }}><Icon name="search" size={15} /></span>
        <span style={{ fontFamily: LT.ui, fontSize: 13.5, color: LT.text3 }}>Search projects</span>
      </div>
      {MOCK_CARDS.map((g) => (
        <div key={g.phase}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '13px 2px 8px' }}>
            <span style={{ width: 3, height: 11, borderRadius: 2, background: g.color }} />
            <span style={{ fontFamily: LT.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: LT.text2 }}>{g.phase}</span>
            <span style={{ fontFamily: LT.ui, fontSize: 11, fontWeight: 600, color: LT.text3 }}>{g.items.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {g.items.map((p) => {
              const frac = p.price ? p.paid / p.price : 0; const done = frac >= 1;
              return (
                <div key={p.t} style={{ background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 13, padding: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: LT.ui, fontSize: 14.5, fontWeight: 600, color: LT.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.t}</div>
                      <div style={{ fontFamily: LT.ui, fontSize: 12, color: LT.text2, marginTop: 2 }}>{p.c}</div>
                    </div>
                    {pill(p.tone, p.s)}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {miniBar(frac)}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: LT.ui, fontSize: 11 }}>
                      <span style={{ color: LT.text2 }}>${p.paid.toLocaleString()} of ${p.price.toLocaleString()}</span>
                      <span style={{ color: done ? LT.success : LT.warning, fontWeight: 600 }}>{done ? 'Paid in full' : '$' + (p.price - p.paid).toLocaleString() + ' due'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 13, color: LT.text3, fontFamily: LT.ui, fontSize: 11 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icon name="calendar" size={12} />{p.when}</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 0 }}><Icon name="pin" size={12} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.loc}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </ScreenShell>
  );
}

// ── Project detail ───────────────────────────────────────────
function tile(label, value, sub, accent, ring) {
  return (
    <div style={{ flex: 1, background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 11, padding: '11px 11px 12px', minWidth: 0 }}>
      <div style={{ fontFamily: LT.ui, fontSize: 9.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: LT.text3, marginBottom: 6 }}>{label}</div>
      {ring || <><div style={{ fontFamily: LT.ui, fontSize: 16, fontWeight: 600, color: accent || LT.text, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
      {sub && <div style={{ fontFamily: LT.ui, fontSize: 10.5, color: LT.text2, marginTop: 2 }}>{sub}</div>}</>}
    </div>
  );
}
function detailRow(label, value, accent, last) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', minHeight: 40, padding: '0 14px', borderBottom: last ? 'none' : `0.5px solid ${LT.border}` }}>
      <span style={{ fontFamily: LT.ui, fontSize: 13, color: LT.text2, flex: 1 }}>{label}</span>
      <span style={{ fontFamily: LT.ui, fontSize: 13, color: accent || LT.text, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function MockDetail() {
  const frac = 1500 / 4800;
  const r = 15, c = 2 * Math.PI * r;
  return (
    <div style={{ height: '100%', background: LT.bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 12px', gap: 4 }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: LT.bg2, border: `0.5px solid ${LT.border2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: LT.text }}><Icon name="back" size={17} /></div>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: LT.ui, fontSize: 14, fontWeight: 600, color: LT.text }}>Amara & Theo</div>
        <span style={{ fontFamily: LT.ui, fontSize: 14, fontWeight: 600, color: LT.accent, paddingRight: 8 }}>Edit</span>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', padding: '4px 14px', display: 'flex', flexDirection: 'column', gap: 13 }}>
        <div>
          <div style={{ fontFamily: LT.serif, fontSize: 23, fontWeight: 500, color: LT.text, letterSpacing: '-0.01em' }}>Amara & Theo</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 7 }}>
            {pill('accent', 'Booked')}
            <span style={{ fontFamily: LT.ui, fontSize: 12, color: LT.text2 }}>Amara Okafor · Wedding</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tile('Shoot', 'in 9d', 'Jun 21')}
          {tile('Balance', '$3,300', 'due', LT.warning)}
          {tile('Paid', null, null, null,
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="30" height="30" viewBox="0 0 34 34"><circle cx="17" cy="17" r={r} fill="none" stroke={LT.bg3} strokeWidth="4" /><circle cx="17" cy="17" r={r} fill="none" stroke={LT.accent} strokeWidth="4" strokeDasharray={c} strokeDashoffset={c * (1 - frac)} strokeLinecap="round" transform="rotate(-90 17 17)" /></svg>
              <span style={{ fontFamily: LT.ui, fontSize: 15, fontWeight: 600, color: LT.text }}>31%</span>
            </div>
          )}
        </div>
        <div style={{ background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {detailRow('Package price', '$4,800')}
          {detailRow('Amount paid', '$1,500')}
          {detailRow('Balance due', '$3,300', LT.warning, true)}
        </div>
        <div style={{ background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {detailRow('Shoot date', 'Sat, Jun 21 · 1:00 PM')}
          {detailRow('Location', 'Riverside Estate', LT.accent, true)}
        </div>
      </div>
    </div>
  );
}

// ── Finances ─────────────────────────────────────────────────
function MockFinances() {
  const rows = [
    { t: 'Nordic Goods — Brand', d: 'Final payment', a: '+$1,600', tone: 'success' },
    { t: 'Amara & Theo', d: 'Deposit', a: '+$1,500', tone: 'success' },
    { t: 'B&H Photo', d: '85mm f/1.4 lens', a: '−$1,699', tone: 'danger' },
    { t: 'Maison — SS26', d: 'Milestone 2', a: '+$2,700', tone: 'success' },
    { t: 'Adobe', d: 'Creative Cloud', a: '−$59.99', tone: 'danger' },
  ];
  return (
    <ScreenShell title="Finances">
      <div style={{ display: 'flex', gap: 9, marginBottom: 12 }}>
        <div style={{ flex: 1, background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 13, padding: '13px 14px' }}>
          <div style={{ fontFamily: LT.ui, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: LT.text3 }}>Revenue · Jun</div>
          <div style={{ fontFamily: LT.ui, fontSize: 24, fontWeight: 700, color: LT.text, marginTop: 5, letterSpacing: '-0.02em' }}>$14,280</div>
          <div style={{ fontFamily: LT.ui, fontSize: 11, color: LT.success, marginTop: 3 }}>▲ 18% vs May</div>
        </div>
        <div style={{ flex: 1, background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 13, padding: '13px 14px' }}>
          <div style={{ fontFamily: LT.ui, fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: LT.text3 }}>Outstanding</div>
          <div style={{ fontFamily: LT.ui, fontSize: 24, fontWeight: 700, color: LT.warning, marginTop: 5, letterSpacing: '-0.02em' }}>$5,250</div>
          <div style={{ fontFamily: LT.ui, fontSize: 11, color: LT.text2, marginTop: 3 }}>3 invoices due</div>
        </div>
      </div>
      {/* tiny bar chart */}
      <div style={{ background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 13, padding: '14px 14px 12px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 64 }}>
          {[34, 52, 41, 68, 47, 88].map((h, i) => (
            <div key={i} style={{ flex: 1, height: h + '%', borderRadius: 4, background: i === 5 ? LT.accent : LT.bg3 }} />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 7, fontFamily: LT.ui, fontSize: 9.5, color: LT.text3 }}>
          {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
      <div style={{ background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 13, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderBottom: i < rows.length - 1 ? `0.5px solid ${LT.border}` : 'none' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: LT.ui, fontSize: 13, fontWeight: 500, color: LT.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.t}</div>
              <div style={{ fontFamily: LT.ui, fontSize: 11, color: LT.text2 }}>{r.d}</div>
            </div>
            <span style={{ fontFamily: LT.ui, fontSize: 13, fontWeight: 600, color: r.tone === 'success' ? LT.success : LT.text }}>{r.a}</span>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

// ── Web dashboard (for the browser hero) ─────────────────────
function WebDashboard() {
  const nav = [
    { icon: 'folderPlus', label: 'Projects', active: true },
    { icon: 'person', label: 'Clients' },
    { icon: 'dollar', label: 'Finances' },
    { icon: 'note', label: 'Contracts' },
    { icon: 'calendar', label: 'Calendar' },
    { icon: 'tag', label: 'Gear' },
  ];
  const rows = [
    { t: 'Amara & Theo', c: 'Amara Okafor', cat: 'Wedding', tone: 'accent', s: 'Booked', when: 'Jun 21', frac: 0.31, pay: '$3,300 due', payTone: 'warning' },
    { t: 'Sofia — Senior Portraits', c: 'Sofia Reyes', cat: 'Portrait', tone: 'accent', s: 'Booked', when: 'Jun 17', frac: 0, pay: '$650 due', payTone: 'warning' },
    { t: 'Maison — SS26 Editorial', c: 'Maison Atelier', cat: 'Editorial', tone: 'warning', s: 'Editing', when: 'Jun 5', frac: 0.5, pay: '$2,700 due', payTone: 'warning' },
    { t: 'Nordic Goods — Brand', c: 'Nordic Goods Co.', cat: 'Brand', tone: 'warning', s: 'In Progress', when: 'Jun 2', frac: 1, pay: 'Paid', payTone: 'success' },
    { t: 'Halvorsen Family', c: 'Erik Halvorsen', cat: 'Family', tone: 'success', s: 'Delivered', when: 'May 24', frac: 1, pay: 'Paid', payTone: 'success' },
  ];
  return (
    <div style={{ display: 'flex', height: '100%', background: LT.bg, fontFamily: LT.ui }}>
      {/* sidebar */}
      <div style={{ width: 196, flexShrink: 0, borderRight: `0.5px solid ${LT.border}`, background: LT.bg2, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ padding: '2px 8px 16px' }}><Wordmark size={18} /></div>
        {nav.map((n) => (
          <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 9px', borderRadius: 8, background: n.active ? LT.bg3 : 'transparent', color: n.active ? LT.text : LT.text2 }}>
            <span style={{ color: n.active ? LT.accent : LT.text3 }}><Icon name={n.icon} size={16} /></span>
            <span style={{ fontSize: 13, fontWeight: n.active ? 600 : 500 }}>{n.label}</span>
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 9px' }}>
          <div style={{ width: 26, height: 26, borderRadius: 999, background: LT.accentMuted, color: LT.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>JC</div>
          <span style={{ fontSize: 12.5, color: LT.text2 }}>Jordan Cole</span>
        </div>
      </div>
      {/* main */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: `0.5px solid ${LT.border}` }}>
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: LT.text }}>Projects</span>
          <span style={{ fontSize: 12, color: LT.text3, fontWeight: 600, background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 6, padding: '3px 7px', whiteSpace: 'nowrap', flexShrink: 0 }}>11 active</span>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 9, padding: '0 11px', height: 34, width: 180, flexShrink: 0 }}>
            <span style={{ color: LT.text3 }}><Icon name="search" size={14} /></span>
            <span style={{ fontSize: 12.5, color: LT.text3 }}>Search</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 9, background: LT.accent, color: '#0a0a0a', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <Icon name="plus" size={15} /> New project
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'hidden', padding: '6px 0' }}>
          {/* table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 1fr 1.4fr', gap: 12, padding: '8px 22px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: LT.text3, borderBottom: `0.5px solid ${LT.border}` }}>
            <span>Project</span><span>Status</span><span>Shoot</span><span>Payment</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr 1fr 1.4fr', gap: 12, padding: '12px 22px', alignItems: 'center', borderBottom: `0.5px solid ${LT.border}` }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: LT.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.t}</div>
                <div style={{ fontSize: 11.5, color: LT.text2, marginTop: 1 }}>{r.c} · {r.cat}</div>
              </div>
              <div>{pill(r.tone, r.s)}</div>
              <div style={{ fontSize: 12.5, color: LT.text2 }}>{r.when}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ flex: 1, maxWidth: 90 }}>{miniBar(r.frac)}</div>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: r.payTone === 'success' ? LT.success : LT.warning, whiteSpace: 'nowrap' }}>{r.pay}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Shared web sidebar
function WebSidebar(active) {
  const nav = [
    { icon: 'folderPlus', label: 'Projects' },
    { icon: 'person', label: 'Clients' },
    { icon: 'dollar', label: 'Finances' },
    { icon: 'note', label: 'Contracts' },
    { icon: 'calendar', label: 'Calendar' },
    { icon: 'tag', label: 'Gear' },
  ];
  return (
    <div style={{ width: 196, flexShrink: 0, borderRight: `0.5px solid ${LT.border}`, background: LT.bg2, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ padding: '2px 8px 16px' }}><Wordmark size={18} /></div>
      {nav.map((n) => (
        <div key={n.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 9px', borderRadius: 8, background: n.label === active ? LT.bg3 : 'transparent', color: n.label === active ? LT.text : LT.text2 }}>
          <span style={{ color: n.label === active ? LT.accent : LT.text3 }}><Icon name={n.icon} size={16} /></span>
          <span style={{ fontSize: 13, fontWeight: n.label === active ? 600 : 500 }}>{n.label}</span>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 9px' }}>
        <div style={{ width: 26, height: 26, borderRadius: 999, background: LT.accentMuted, color: LT.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>JC</div>
        <span style={{ fontSize: 12.5, color: LT.text2 }}>Jordan Cole</span>
      </div>
    </div>
  );
}

function WebHeader(title, count, cta) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: `0.5px solid ${LT.border}` }}>
      <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: LT.text }}>{title}</span>
      {count && <span style={{ fontSize: 12, color: LT.text3, fontWeight: 600, background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 6, padding: '3px 7px', whiteSpace: 'nowrap', flexShrink: 0 }}>{count}</span>}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 9, padding: '0 11px', height: 34, width: 160, flexShrink: 0 }}>
        <span style={{ color: LT.text3 }}><Icon name="search" size={14} /></span>
        <span style={{ fontSize: 12.5, color: LT.text3 }}>Search</span>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 34, padding: '0 13px', borderRadius: 9, background: LT.accent, color: '#0a0a0a', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
        <Icon name="plus" size={15} /> {cta}
      </div>
    </div>
  );
}

function WebClients() {
  const rows = [
    { n: 'Amara Okafor', e: 'amara@okafor.co', proj: 2, ltv: '$6,000', last: 'Jun 21', tone: 'accent', tag: 'Wedding' },
    { n: 'Maison Atelier', e: 'press@maison.studio', proj: 4, ltv: '$21,600', last: 'Jun 5', tone: 'warning', tag: 'Editorial' },
    { n: 'Nordic Goods Co.', e: 'studio@nordicgoods.com', proj: 3, ltv: '$9,600', last: 'Jun 2', tone: 'success', tag: 'Brand' },
    { n: 'Sofia Reyes', e: 'sofia.reyes@gmail.com', proj: 1, ltv: '$650', last: 'Jun 17', tone: 'accent', tag: 'Portrait' },
    { n: 'Erik Halvorsen', e: 'erik.h@me.com', proj: 2, ltv: '$1,800', last: 'May 24', tone: 'success', tag: 'Family' },
  ];
  return (
    <div style={{ display: 'flex', height: '100%', background: LT.bg, fontFamily: LT.ui }}>
      {WebSidebar('Clients')}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {WebHeader('Clients', '48 total', 'New client')}
        <div style={{ flex: 1, overflow: 'hidden', padding: '6px 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.8fr 1fr 1fr', gap: 12, padding: '8px 22px', fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: LT.text3, borderBottom: `0.5px solid ${LT.border}` }}>
            <span>Client</span><span>Projects</span><span>Lifetime</span><span>Last shoot</span>
          </div>
          {rows.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2.2fr 0.8fr 1fr 1fr', gap: 12, padding: '12px 22px', alignItems: 'center', borderBottom: `0.5px solid ${LT.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                <div style={{ width: 30, height: 30, borderRadius: 999, background: LT.accentMuted, color: LT.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{r.n.split(' ').map((x) => x[0]).join('').slice(0, 2)}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: LT.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.n}</div>
                  <div style={{ fontSize: 11.5, color: LT.text2 }}>{r.e}</div>
                </div>
              </div>
              <div>{pill(r.tone, r.proj + ' proj')}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: LT.text }}>{r.ltv}</div>
              <div style={{ fontSize: 12.5, color: LT.text2 }}>{r.last}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WebFinances() {
  const rows = [
    { t: 'Nordic Goods — Brand', d: 'Final payment · Jun 2', a: '+$1,600', tone: 'success' },
    { t: 'Amara & Theo', d: 'Deposit · Jun 1', a: '+$1,500', tone: 'success' },
    { t: 'B&H Photo', d: '85mm f/1.4 lens · May 30', a: '−$1,699', tone: 'danger' },
    { t: 'Maison — SS26', d: 'Milestone 2 · May 28', a: '+$2,700', tone: 'success' },
  ];
  return (
    <div style={{ display: 'flex', height: '100%', background: LT.bg, fontFamily: LT.ui }}>
      {WebSidebar('Finances')}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {WebHeader('Finances', null, 'New invoice')}
        <div style={{ flex: 1, overflow: 'hidden', padding: '18px 22px' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            {[{ l: 'Revenue · June', v: '$14,280', c: LT.text, s: '▲ 18% vs May', sc: LT.success }, { l: 'Outstanding', v: '$5,250', c: LT.warning, s: '3 invoices due', sc: LT.text2 }, { l: 'Booked ahead', v: '$28,400', c: LT.text, s: 'Next 90 days', sc: LT.text2 }].map((s) => (
              <div key={s.l} style={{ flex: 1, background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 13, padding: '15px 16px' }}>
                <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: LT.text3 }}>{s.l}</div>
                <div style={{ fontSize: 27, fontWeight: 700, color: s.c, marginTop: 6, letterSpacing: '-0.02em' }}>{s.v}</div>
                <div style={{ fontSize: 11.5, color: s.sc, marginTop: 3 }}>{s.s}</div>
              </div>
            ))}
          </div>
          <div style={{ background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 13, padding: '16px 18px 14px', marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: LT.text2, marginBottom: 14 }}>Revenue · last 6 months</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, height: 90 }}>
              {[34, 52, 41, 68, 47, 88].map((h, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: '100%', height: h + '%', borderRadius: 5, background: i === 5 ? LT.accent : LT.bg3 }} />
                  <span style={{ fontSize: 10.5, color: LT.text3 }}>{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 13, overflow: 'hidden' }}>
            {rows.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: i < rows.length - 1 ? `0.5px solid ${LT.border}` : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: LT.text }}>{r.t}</div>
                  <div style={{ fontSize: 11.5, color: LT.text2 }}>{r.d}</div>
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: r.tone === 'success' ? LT.success : LT.text }}>{r.a}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MockProjects, MockDetail, MockFinances, WebDashboard, WebClients, WebFinances });

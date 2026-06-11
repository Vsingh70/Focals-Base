// landing-shared.jsx — shared marketing system for Lenslate landing pages.
// Depends on pdata.jsx (T, Icon). Exports building blocks to window.

const LT = {
  ...T, // brand tokens (bg, accent, text, etc.)
  maxW: 1180,
  serif: '"Newsreader", "New York", Georgia, serif',
  ui: '-apple-system, "Inter", system-ui, sans-serif',
};

// ── Scroll reveal — CSS entrance with a guaranteed-visible fallback ──
// Entrance animates from hidden; a safety timer locks content visible so it
// can never stay hidden (and verification can force it via .lp-shown).
(function injectRevealCSS() {
  if (document.getElementById('lp-reveal-css')) return;
  const s = document.createElement('style');
  s.id = 'lp-reveal-css';
  s.textContent =
    '@keyframes lpReveal{from{opacity:0;transform:translateY(var(--lp-ry,22px));}to{opacity:1;transform:none;}}' +
    '.lp-reveal{animation:lpReveal .72s cubic-bezier(.22,.7,.25,1) both;}' +
    '.lp-shown .lp-reveal{animation:none !important;opacity:1 !important;transform:none !important;}' +
    '@media (prefers-reduced-motion: reduce){.lp-reveal{animation:none;opacity:1;transform:none;}}';
  document.head.appendChild(s);
  const lock = () => document.body && document.body.classList.add('lp-shown');
  setTimeout(lock, 2200);
  // also lock if the tab was backgrounded (animation clock frozen) then shown
  document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(lock, 1200); });
})();

function useReveal() {
  const ref = React.useRef(null);
  return [ref, true];
}

function Reveal({ children, delay = 0, y = 22, style }) {
  return (
    <div className="lp-reveal" style={{ '--lp-ry': y + 'px', animationDelay: delay + 'ms', ...style }}>{children}</div>
  );
}

// Scroll progress (0..1) of an element through the viewport.
function useScrollProgress(ref, { start = 0.9, end = 0.1 } = {}) {
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const total = r.height + vh * (start - end);
        const passed = vh * start - r.top;
        setP(Math.max(0, Math.min(1, passed / total)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return p;
}

// ── Brand ────────────────────────────────────────────────────
function Wordmark({ size = 22, color }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'flex-end', fontFamily: LT.serif, fontSize: size, fontWeight: 500, letterSpacing: '-0.01em', color: color || LT.text, lineHeight: 1, whiteSpace: 'nowrap' }}>
      Lenslate
      <span aria-hidden="true" style={{ width: '0.16em', height: '0.16em', borderRadius: '50%', background: LT.accent, marginLeft: '0.1em', marginBottom: '0.13em', flex: '0 0 auto' }} />
    </span>
  );
}

// ── ScaledCanvas — render a fixed-size mock and scale it to fit ──
// Measures its own width and scales a fixed designWidth×designHeight canvas to
// match (like a screenshot). Keeps proportions/spacing perfect at ANY size and
// never reflows or overflows. Used by PhoneFrame + BrowserFrame.
function ScaledCanvas({ designWidth, designHeight, maxScale = 1, maxWidth, children, style }) {
  const ref = React.useRef(null);
  const [scale, setScale] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(Math.min(maxScale, w / designWidth));
    };
    measure();
    const raf = requestAnimationFrame(measure);
    const t = setTimeout(measure, 200);
    let ro;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(measure); ro.observe(el); }
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); if (ro) ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [designWidth, maxScale]);

  return (
    <div ref={ref} style={{ width: '100%', maxWidth: maxWidth || designWidth * maxScale, margin: '0 auto', height: scale ? Math.round(designHeight * scale) : designHeight * (maxWidth ? 1 : 0.5), ...style }}>
      <div style={{ width: designWidth, height: designHeight, transform: `scale(${scale || 0.5})`, transformOrigin: 'top left', visibility: scale ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </div>
  );
}

// ── Phone bezel (marketing scale, fluid) ─────────────────────
function PhoneFrame({ children, width = 320, glow = true }) {
  const ratio = 844 / 390;
  const h = Math.round(width * ratio);
  return (
    <ScaledCanvas designWidth={width} designHeight={h} maxScale={1} maxWidth={width} style={{ overflow: 'visible' }}>
      <div style={{ position: 'relative', width, height: h }}>
        {glow && <div style={{ position: 'absolute', inset: '-12% -18%', background: `radial-gradient(60% 50% at 50% 38%, ${LT.accent}22, transparent 70%)`, filter: 'blur(8px)', pointerEvents: 'none' }} />}
        <div style={{
          position: 'relative', width: '100%', height: '100%', borderRadius: width * 0.135,
          background: '#000', padding: width * 0.028,
          boxShadow: `0 1px 0 1px #1d1d1d, 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px ${LT.border2}`,
        }}>
          <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: width * 0.11, overflow: 'hidden', background: LT.bg }}>
            {/* status bar strip */}
            <div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', position: 'relative', zIndex: 5, background: LT.bg }}>
              <span style={{ fontFamily: '-apple-system, "SF Pro", system-ui', fontSize: 12, fontWeight: 600, color: LT.text }}>9:41</span>
              <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <svg width="15" height="10" viewBox="0 0 19 12"><rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={LT.text}/><rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={LT.text}/><rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={LT.text}/><rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={LT.text}/></svg>
                <svg width="22" height="11" viewBox="0 0 27 13"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={LT.text} strokeOpacity="0.4" fill="none"/><rect x="2" y="2" width="18" height="9" rx="2" fill={LT.text}/></svg>
              </span>
              {/* notch */}
              <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: width * 0.32, height: 19, background: '#000', borderRadius: 12 }} />
            </div>
            <div style={{ position: 'absolute', top: 30, left: 0, right: 0, bottom: 0 }}>{children}</div>
            {/* home indicator */}
            <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: width * 0.34, height: 4, borderRadius: 999, background: LT.text2, opacity: 0.5, zIndex: 6 }} />
          </div>
        </div>
      </div>
    </ScaledCanvas>
  );
}

// ── Rotating word (audience) ─────────────────────────────────
function RotatingWord({ words, color, interval = 2200 }) {
  const [i, setI] = React.useState(0);
  const [on, setOn] = React.useState(true);
  React.useEffect(() => {
    const t = setInterval(() => {
      setOn(false);
      setTimeout(() => { setI((x) => (x + 1) % words.length); setOn(true); }, 320);
    }, interval);
    return () => clearInterval(t);
  }, []);
  return (
    <span style={{ display: 'inline-block', position: 'relative', color: color || LT.accent, fontStyle: 'italic', whiteSpace: 'nowrap' }}>
      <span style={{ display: 'inline-block', opacity: on ? 1 : 0, transform: on ? 'translateY(0)' : 'translateY(0.25em)', transition: 'opacity .32s ease, transform .32s ease' }}>{words[i]}</span>
    </span>
  );
}

// ── Browser chrome (fixed design canvas, scaled to fit) ──────
// The app content renders at designWidth×designHeight and scales like a
// screenshot — perfect spacing at any window size, no reflow/cramping.
function BrowserFrame({ children, designWidth = 900, designHeight = 440, maxScale = 1.45, maxWidth, url = 'app.lenslate.com/projects', glow = true }) {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: maxWidth || 'none', margin: '0 auto' }}>
      {glow && <div style={{ position: 'absolute', inset: '-8% -6% -14%', background: `radial-gradient(50% 60% at 50% 30%, ${LT.accent}1c, transparent 70%)`, filter: 'blur(10px)', pointerEvents: 'none' }} />}
      <div style={{ position: 'relative', width: '100%', borderRadius: 14, overflow: 'hidden', border: `0.5px solid ${LT.border2}`, background: LT.bg2, boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 42, padding: '0 14px', borderBottom: `0.5px solid ${LT.border}`, background: LT.bg2 }}>
          <div style={{ display: 'flex', gap: 7 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 11, height: 11, borderRadius: 999, background: c, opacity: 0.9 }} />)}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: 26, padding: '0 14px', borderRadius: 7, background: LT.bg3, border: `0.5px solid ${LT.border}`, maxWidth: 340 }}>
              <svg width="11" height="11" viewBox="0 0 20 20" fill="none" stroke={LT.text3} strokeWidth="1.8"><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/></svg>
              <span style={{ fontFamily: LT.ui, fontSize: 12.5, color: LT.text2 }}>{url}</span>
            </div>
          </div>
          <div style={{ width: 52 }} />
        </div>
        <ScaledCanvas designWidth={designWidth} designHeight={designHeight} maxScale={maxScale} maxWidth={9999} style={{ overflow: 'hidden' }}>
          {children}
        </ScaledCanvas>
      </div>
    </div>
  );
}

// ── Browser chrome — end ─────────────────────────────────────

// ── Buttons ──────────────────────────────────────────────────
function Btn({ children, kind = 'primary', href = '#', onClick, size = 'md', icon }) {
  const pad = size === 'lg' ? '0 22px' : '0 16px';
  const h = size === 'lg' ? 52 : 44;
  const styles = {
    primary: { background: LT.accent, color: '#0a0a0a', border: '1px solid ' + LT.accent },
    ghost: { background: 'transparent', color: LT.text, border: `1px solid ${LT.border2}` },
    quiet: { background: LT.bg2, color: LT.text, border: `1px solid ${LT.border}` },
  }[kind];
  return (
    <a href={href} onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
      height: h, padding: pad, borderRadius: 11, textDecoration: 'none',
      fontFamily: LT.ui, fontSize: size === 'lg' ? 16 : 15, fontWeight: 600, letterSpacing: '-0.01em',
      cursor: 'pointer', whiteSpace: 'nowrap', transition: 'transform .15s ease, filter .15s ease, background .15s',
      ...styles,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.06)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none'; }}>
      {icon}{children}
    </a>
  );
}

// App Store badge (drawn, not an image) + a "Start on web" pill
function AppStoreBadge({ size = 'lg' }) {
  const h = size === 'lg' ? 52 : 46;
  return (
    <a href="#download" style={{
      display: 'inline-flex', alignItems: 'center', gap: 11, height: h, padding: '0 18px 0 16px',
      borderRadius: 11, background: LT.text, color: '#0a0a0a', textDecoration: 'none',
      border: '1px solid ' + LT.text, transition: 'transform .15s, filter .15s',
    }}
    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.filter = 'brightness(1.05)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none'; }}>
      <svg width="22" height="26" viewBox="0 0 22 26" fill="#0a0a0a"><path d="M17.6 13.8c0-2.6 2.1-3.9 2.2-4-1.2-1.8-3.1-2-3.8-2-1.6-.2-3.1.9-3.9.9s-2.1-.9-3.4-.9c-1.8 0-3.4 1-4.3 2.6-1.8 3.2-.5 7.9 1.3 10.5.9 1.3 1.9 2.7 3.2 2.6 1.3-.1 1.8-.8 3.3-.8s2 .8 3.4.8c1.4 0 2.3-1.3 3.2-2.6.7-1 1-1.5 1.5-2.6-3.9-1.5-3.4-5-.4-5.1zM15 4.2c.7-.9 1.2-2.1 1-3.2-1 0-2.3.7-3 1.5-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3.1-1.4z"/></svg>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, fontFamily: LT.ui }}>
        <span style={{ fontSize: 10.5, fontWeight: 500, opacity: 0.7 }}>Download on the</span>
        <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: '-0.02em' }}>App Store</span>
      </span>
    </a>
  );
}

// ── Section primitives ───────────────────────────────────────
function Eyebrow({ children }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: LT.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: LT.accent }}>
      <span style={{ width: 18, height: 1, background: LT.accent, opacity: 0.6 }} />
      {children}
    </div>
  );
}

function SectionTitle({ children, max = 620, align = 'left' }) {
  return (
    <h2 style={{ fontFamily: LT.serif, fontWeight: 500, fontSize: 'clamp(30px, 4.4vw, 50px)', lineHeight: 1.06, letterSpacing: '-0.02em', color: LT.text, margin: 0, maxWidth: max, textAlign: align, textWrap: 'balance' }}>{children}</h2>
  );
}

function Lead({ children, max = 560 }) {
  return <p style={{ fontFamily: LT.ui, fontSize: 'clamp(16px, 1.7vw, 19px)', lineHeight: 1.55, color: LT.text2, margin: 0, maxWidth: max, textWrap: 'pretty' }}>{children}</p>;
}

// ── Top nav ──────────────────────────────────────────────────
function TopNav({ links, cta, platform }) {
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const f = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', f, { passive: true }); f();
    return () => window.removeEventListener('scroll', f);
  }, []);
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled ? 'rgba(10,10,10,0.72)' : 'transparent',
      backdropFilter: scrolled ? 'saturate(140%) blur(16px)' : 'none',
      WebkitBackdropFilter: scrolled ? 'saturate(140%) blur(16px)' : 'none',
      borderBottom: `0.5px solid ${scrolled ? LT.border : 'transparent'}`,
      transition: 'background .3s, border-color .3s, backdrop-filter .3s',
    }}>
      <div style={{ maxWidth: LT.maxW, margin: '0 auto', height: 64, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 18 }}>
        <a href="#top" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9 }}>
          <Wordmark size={21} />
          {platform && <span style={{ fontFamily: LT.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: LT.text2, border: `1px solid ${LT.border2}`, borderRadius: 6, padding: '3px 6px' }}>{platform}</span>}
        </a>
        <div style={{ flex: 1 }} />
        <div className="lp-navlinks" style={{ display: 'flex', alignItems: 'center', gap: 26 }}>
          {links.map((l) => (
            <a key={l.label} href={l.href} style={{ fontFamily: LT.ui, fontSize: 14, fontWeight: 500, color: LT.text2, textDecoration: 'none', transition: 'color .15s' }}
              onMouseEnter={(e) => e.currentTarget.style.color = LT.text}
              onMouseLeave={(e) => e.currentTarget.style.color = LT.text2}>{l.label}</a>
          ))}
        </div>
        <div style={{ marginLeft: 6 }}>{cta}</div>
      </div>
    </div>
  );
}

// ── Feature grid ─────────────────────────────────────────────
const FEATURES = [
  { icon: 'folderPlus', name: 'Projects', desc: 'Every shoot in one pipeline — from inquiry to delivered, grouped by status at a glance.' },
  { icon: 'person', name: 'Clients', desc: 'A living address book that links each contact to their shoots, invoices, and contracts.' },
  { icon: 'dollar', name: 'Finances', desc: 'Track package prices, deposits, and balances. Know what’s owed without a spreadsheet.' },
  { icon: 'note', name: 'Contracts', desc: 'Send, sign, and store agreements. Every PDF stamped and filed against the project.' },
  { icon: 'calendar', name: 'Calendar', desc: 'Shoots sync straight to iOS Calendar with travel time, locations, and reminders.' },
  { icon: 'tag', name: 'Gear', desc: 'Log bodies, lenses, and kit. See what shot what, and what’s due for service.' },
];

function FeatureGrid() {
  return (
    <div className="lp-fgrid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {FEATURES.map((f, i) => (
        <Reveal key={f.name} delay={(i % 3) * 70}>
          <div style={{ background: LT.bg2, border: `0.5px solid ${LT.border}`, borderRadius: 16, padding: '22px 22px 24px', height: '100%', transition: 'border-color .2s, transform .2s, background .2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = LT.border2; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = LT.border; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: LT.accent + '14', border: `0.5px solid ${LT.accent}33`, color: LT.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon name={f.icon} size={20} />
            </div>
            <div style={{ fontFamily: LT.ui, fontSize: 17, fontWeight: 600, color: LT.text, marginBottom: 6, letterSpacing: '-0.01em' }}>{f.name}</div>
            <div style={{ fontFamily: LT.ui, fontSize: 14, lineHeight: 1.55, color: LT.text2 }}>{f.desc}</div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

// ── Waitlist ─────────────────────────────────────────────────
// POSTs { email, source, ts } as JSON to window.LENSLATE_WAITLIST_ENDPOINT.
// If no endpoint is configured the form runs in demo mode (no network call).
// See design_handoff_lenslate_waitlist/ for the server endpoint spec.
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function Waitlist({ note, source = 'landing' }) {
  const [email, setEmail] = React.useState('');
  const [hp, setHp] = React.useState(''); // honeypot — humans never fill this
  const [status, setStatus] = React.useState('idle'); // idle | submitting | success | error
  const [errMsg, setErrMsg] = React.useState('');
  const ok = EMAIL_RE.test(email.trim());

  const submit = async (e) => {
    e.preventDefault();
    if (!ok || status === 'submitting') return;

    // Honeypot tripped → silently "succeed" without sending anything.
    if (hp.trim() !== '') { setStatus('success'); return; }

    setStatus('submitting'); setErrMsg('');

    const endpoint = ((typeof window !== 'undefined' && window.LENSLATE_WAITLIST_ENDPOINT) || '').trim();
    const token = ((typeof window !== 'undefined' && window.LENSLATE_WAITLIST_TOKEN) || '').trim();
    const payload = { email: email.trim().toLowerCase(), source, ts: new Date().toISOString(), hp };

    // Demo mode — no endpoint wired yet.
    if (!endpoint) {
      await new Promise((r) => setTimeout(r, 650));
      setStatus('success');
      return;
    }
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['X-Waitlist-Token'] = token;
      const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (res.ok || res.status === 409) { // 409 = already on the list → treat as success
        setStatus('success');
        return;
      }
      let m = 'Something went wrong. Please try again.';
      try { const j = await res.json(); if (j && j.error) m = j.error; } catch (_) {}
      setErrMsg(m); setStatus('error');
    } catch (_) {
      setErrMsg('Network error — check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ maxWidth: 460, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: LT.bg2, border: `0.5px solid ${LT.success}44`, borderRadius: 12, padding: '16px 18px' }}>
          <span style={{ color: LT.success }}><Icon name="check" size={20} /></span>
          <div style={{ fontFamily: LT.ui }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: LT.text }}>You’re on the list.</div>
            <div style={{ fontSize: 13, color: LT.text2 }}>We’ll email {email.trim().toLowerCase()} when your invite is ready.</div>
          </div>
        </div>
      </div>
    );
  }

  const busy = status === 'submitting';
  return (
    <div style={{ maxWidth: 460, width: '100%' }}>
      <form onSubmit={submit} style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
        {/* Honeypot: off-screen, not tabbable, hidden from AT. Bots fill it; people don't. */}
        <input type="text" name="company" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true"
          style={{ position: 'absolute', left: '-9999px', top: 'auto', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }} />
        <input value={email} onChange={(e) => { setEmail(e.target.value); if (status === 'error') setStatus('idle'); }} type="email" placeholder="you@studio.com" disabled={busy} autoComplete="email"
          style={{ flex: '1 1 220px', minWidth: 0, height: 50, padding: '0 16px', borderRadius: 11, border: `1px solid ${status === 'error' ? LT.danger : LT.border2}`, background: LT.bg2, color: LT.text, fontFamily: LT.ui, fontSize: 15, outline: 'none', opacity: busy ? 0.6 : 1 }}
          onFocus={(e) => { if (status !== 'error') e.target.style.borderColor = LT.accent; }}
          onBlur={(e) => { if (status !== 'error') e.target.style.borderColor = LT.border2; }} />
        <button type="submit" disabled={!ok || busy} style={{
          height: 50, padding: '0 22px', borderRadius: 11, border: 'none', cursor: (ok && !busy) ? 'pointer' : 'default',
          background: (ok && !busy) ? LT.accent : LT.bg3, color: (ok && !busy) ? '#0a0a0a' : LT.text3,
          fontFamily: LT.ui, fontSize: 15, fontWeight: 600, transition: 'background .2s, color .2s', whiteSpace: 'nowrap',
        }}>{busy ? 'Joining…' : 'Request invite'}</button>
      </form>
      {status === 'error' && <div style={{ fontFamily: LT.ui, fontSize: 12.5, color: LT.danger, marginTop: 11 }}>{errMsg}</div>}
      {note && status !== 'error' && <div style={{ fontFamily: LT.ui, fontSize: 12.5, color: LT.text3, marginTop: 11 }}>{note}</div>}
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────
function Footer({ other }) {
  const cols = [
    { h: 'Product', items: ['Projects', 'Clients', 'Finances', 'Contracts', 'Calendar', 'Gear'] },
    { h: 'Company', items: ['About', 'Careers', 'Press', 'Contact'] },
    { h: 'Resources', items: ['Help center', 'Guides', 'Status', 'Changelog'] },
    { h: 'Legal', items: ['Privacy', 'Terms', 'Security', 'Licenses'] },
  ];
  return (
    <footer style={{ borderTop: `0.5px solid ${LT.border}`, background: LT.bg, padding: '64px 24px 40px' }}>
      <div style={{ maxWidth: LT.maxW, margin: '0 auto' }}>
        <div className="lp-footgrid" style={{ display: 'grid', gridTemplateColumns: '1.6fr repeat(4, 1fr)', gap: 32, paddingBottom: 48 }}>
          <div>
            <Wordmark size={24} />
            <p style={{ fontFamily: LT.ui, fontSize: 13.5, lineHeight: 1.55, color: LT.text2, maxWidth: 260, marginTop: 14 }}>The studio operating system for photographers, videographers, and media teams.</p>
            <div style={{ marginTop: 18 }}>{other}</div>
          </div>
          {cols.map((c) => (
            <div key={c.h}>
              <div style={{ fontFamily: LT.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: LT.text3, marginBottom: 14 }}>{c.h}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {c.items.map((it) => (
                  <a key={it} href="#" style={{ fontFamily: LT.ui, fontSize: 14, color: LT.text2, textDecoration: 'none', transition: 'color .15s' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = LT.text}
                    onMouseLeave={(e) => e.currentTarget.style.color = LT.text2}>{it}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 26, borderTop: `0.5px solid ${LT.border}` }}>
          <span style={{ fontFamily: LT.ui, fontSize: 13, color: LT.text3 }}>© 2026 Lenslate Studio, Inc. All rights reserved.</span>
          <span style={{ fontFamily: LT.ui, fontSize: 13, color: LT.text3 }}>Made for people behind the lens.</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, {
  LT, useReveal, Reveal, useScrollProgress, Wordmark, Btn, AppStoreBadge,
  Eyebrow, SectionTitle, Lead, TopNav, FeatureGrid, FEATURES, Waitlist, Footer,
  PhoneFrame, RotatingWord, BrowserFrame, ScaledCanvas,
});

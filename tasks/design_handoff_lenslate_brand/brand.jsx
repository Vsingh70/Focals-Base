// brand.jsx — Lenslate temporary identity + in-context mocks

// Light-theme token overrides (mirrors .light in globals.css)
const LIGHT_VARS = {
  '--color-bg': '#ffffff',
  '--color-bg-secondary': '#f7f7f5',
  '--color-bg-tertiary': '#efefec',
  '--color-border': '#e5e5e1',
  '--color-border-secondary': '#d4d4d0',
  '--color-text-primary': '#111111',
  '--color-text-secondary': '#555555',
  '--color-text-tertiary': '#888888',
  '--color-accent': '#3a3530',
  '--color-accent-muted': '#e8e0d0',
};

// ---- Aperture mark (temporary, minimal lens motif) ----
function ApertureMark({ size = 28, color = 'var(--color-accent)', stroke = 1.5 }) {
  const s = size;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" fill="none" aria-hidden="true"
         style={{ display: 'block', flex: '0 0 auto' }}>
      <circle cx="24" cy="24" r="19" stroke={color} strokeWidth={stroke} />
      <circle cx="24" cy="24" r="10.5" stroke={color} strokeWidth={stroke} opacity="0.55" />
      <circle cx="24" cy="24" r="3.4" fill={color} />
      <path d="M24 5 A19 19 0 0 1 41.5 17" stroke={color} strokeWidth={stroke} opacity="0.9" strokeLinecap="round" />
    </svg>
  );
}

// ---- Wordmark + optional mark lockup ----
function LogoLockup({ variant = 'A', size = 'lg', color = 'var(--color-text-primary)' }) {
  const fontSize = size === 'lg' ? '3rem' : size === 'md' ? '1.75rem' : '1.125rem';
  const markSize = size === 'lg' ? 40 : size === 'md' ? 26 : 20;
  const gap = size === 'lg' ? '0.95rem' : '0.6rem';
  const word = (
    <span style={{
      fontFamily: 'var(--font-display)',
      fontSize,
      fontWeight: 500,
      letterSpacing: size === 'lg' ? '-0.02em' : '-0.01em',
      color,
      lineHeight: 1,
      whiteSpace: 'nowrap',
    }}>
      Lenslate
    </span>
  );
  if (variant === 'A') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        {word}
        <span style={{
          display: 'inline-block',
          width: size === 'lg' ? 8 : 5,
          height: size === 'lg' ? 8 : 5,
          borderRadius: '50%',
          background: 'var(--color-accent)',
          marginLeft: size === 'lg' ? 6 : 4,
          marginBottom: size === 'lg' ? 4 : 2,
          alignSelf: 'flex-end',
        }} />
      </div>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      <ApertureMark size={markSize} stroke={size === 'lg' ? 1.6 : 1.5} />
      {word}
    </div>
  );
}

// ---- Stages ----
function WordmarkStage({ children, light = false, caption = 'Wordmark' }) {
  return (
    <div style={{
      ...(light ? LIGHT_VARS : {}),
      width: '100%', height: '100%',
      background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 14, left: 18,
        fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '0.14em',
        textTransform: 'uppercase', color: 'var(--color-text-tertiary)',
      }}>{caption}</div>
      {children}
    </div>
  );
}

function IconStage({ children, light = false }) {
  return (
    <div style={{
      ...(light ? LIGHT_VARS : {}),
      width: '100%', height: '100%',
      background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28,
    }}>
      {children}
    </div>
  );
}

function AppIcon({ px = 132 }) {
  return (
    <div style={{
      width: px, height: px, borderRadius: px * 0.227,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-secondary)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    }}>
      <span style={{
        fontFamily: 'var(--font-display)', fontSize: px * 0.56, fontWeight: 500,
        color: 'var(--color-accent)', lineHeight: 1, letterSpacing: '-0.02em',
      }}>L</span>
    </div>
  );
}

// ---- Login screen (faithful to (auth)/login/page.tsx) ----
function LoginScreen({ variant = 'A', light = false }) {
  return (
    <div style={{
      ...(light ? LIGHT_VARS : {}),
      width: '100%', height: '100%', background: 'var(--color-bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: 380,
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem 2.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2.5rem',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <LogoLockup variant={variant} size="md" />
        </div>
        <button style={{
          width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.75rem', padding: '0.875rem 1.25rem',
          background: 'var(--color-bg-tertiary)', color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--radius-md)',
          fontSize: '1rem', fontWeight: 500, fontFamily: 'var(--font-sans)', cursor: 'pointer',
        }}>
          <GoogleG />
          Continue with Google
        </button>
        <p style={{
          fontSize: '0.8125rem', color: 'var(--color-text-tertiary)', textAlign: 'center',
          margin: 0, lineHeight: 1.5, fontFamily: 'var(--font-sans)',
        }}>
          By signing in you agree to the terms of service.
        </p>
      </div>
    </div>
  );
}

function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.5 29.5 4.5 24 4.5 16.3 4.5 9.7 8.9 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 43.5c5.4 0 10.3-1.9 14.1-5.2l-6.5-5.5C29.6 34.4 26.9 35.5 24 35.5c-5.2 0-9.6-3.3-11.3-7.9l-6.6 5.1C9.6 39.1 16.2 43.5 24 43.5z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5c-.5.4 6.8-4.9 6.8-14.9 0-1.2-.1-2.3-.3-3.5z"/>
    </svg>
  );
}

// ---- Sidebar (faithful to layout/Sidebar.tsx) ----
const PRIMARY_NAV = [
  { label: 'Dashboard', icon: 'house', active: true },
  { label: 'Inbox', icon: 'inbox' },
  { label: 'Calendar', icon: 'calendar-days' },
  { label: 'Projects', icon: 'folder-open' },
  { label: 'Clients', icon: 'users' },
  { label: 'Finances', icon: 'dollar-sign' },
  { label: 'Contracts', icon: 'file-text' },
];
const SECONDARY_NAV = [
  { label: 'Gear', icon: 'camera' },
  { label: 'Forms', icon: 'clipboard-list' },
  { label: 'Links', icon: 'link' },
  { label: 'Help', icon: 'circle-help' },
  { label: 'Settings', icon: 'settings' },
];

function NavRow({ item }) {
  return (
    <li style={{ listStyle: 'none' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.625rem',
        padding: '0.625rem 0.75rem', fontSize: '0.875rem',
        color: item.active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
        background: item.active ? 'var(--color-bg-tertiary)' : 'transparent',
        borderRadius: 'var(--radius-md)', fontWeight: item.active ? 500 : 400,
        fontFamily: 'var(--font-sans)',
      }}>
        <i data-lucide={item.icon} style={{ width: 16, height: 16, color: 'currentColor' }}></i>
        <span>{item.label}</span>
      </div>
    </li>
  );
}

function SidebarMock({ variant = 'A', light = false }) {
  React.useEffect(() => {
    let n = 0;
    const tick = () => {
      if (window.lucide) window.lucide.createIcons();
      if (++n < 5) setTimeout(tick, 80);
    };
    tick();
  }, []);
  const sectionLabel = {
    fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.08em',
    color: 'var(--color-text-tertiary)', padding: '0 0.75rem', margin: '0 0 0.375rem',
    fontFamily: 'var(--font-sans)',
  };
  return (
    <div style={{
      ...(light ? LIGHT_VARS : {}),
      width: '100%', height: '100%',
      background: 'var(--color-bg-secondary)',
      borderRight: '1px solid var(--color-border)',
      padding: '1.5rem 0.75rem',
      display: 'flex', flexDirection: 'column', gap: '1.5rem',
    }}>
      <div style={{ padding: '0 0.75rem' }}>
        <LogoLockup variant={variant} size="sm" />
      </div>
      <nav style={{ display: 'grid', gap: '1rem', flex: 1 }}>
        <div>
          <p style={sectionLabel}>Main</p>
          <ul style={{ padding: 0, margin: 0, display: 'grid', gap: '0.125rem' }}>
            {PRIMARY_NAV.map((it) => <NavRow key={it.label} item={it} />)}
          </ul>
        </div>
        <div>
          <p style={sectionLabel}>More</p>
          <ul style={{ padding: 0, margin: 0, display: 'grid', gap: '0.125rem' }}>
            {SECONDARY_NAV.map((it) => <NavRow key={it.label} item={it} />)}
          </ul>
        </div>
      </nav>
    </div>
  );
}

Object.assign(window, {
  ApertureMark, LogoLockup, WordmarkStage, IconStage, AppIcon,
  LoginScreen, SidebarMock,
});

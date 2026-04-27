'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = { href: string; label: string };

const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/inbox', label: 'Inbox' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/projects', label: 'Projects' },
  { href: '/clients', label: 'Clients' },
  { href: '/shoots', label: 'Shoots' },
  { href: '/finances', label: 'Finances' },
  { href: '/contracts', label: 'Contracts' },
];

const SECONDARY_NAV: NavItem[] = [
  { href: '/gear', label: 'Gear' },
  { href: '/forms', label: 'Forms' },
  { href: '/links', label: 'Links' },
  { href: '/help', label: 'Help' },
  { href: '/settings', label: 'Settings' },
];

export const ALL_NAV_ITEMS: NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV];

const navItemStyle = (active: boolean): React.CSSProperties => ({
  display: 'block',
  padding: '0.625rem 0.75rem',
  fontSize: '0.875rem',
  color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
  background: active ? 'var(--color-bg-tertiary)' : 'transparent',
  borderRadius: 'var(--radius-md)',
  textDecoration: 'none',
  fontWeight: active ? 500 : 400,
  transition: 'background 0.15s, color 0.15s',
});

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.6875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--color-text-tertiary)',
  padding: '0 0.75rem',
  margin: '0 0 0.375rem',
};

export function NavBody({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <Link
        href="/"
        onClick={onNavigate}
        style={{
          padding: '0 0.75rem',
          fontFamily: 'var(--font-display)',
          fontSize: '1.125rem',
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          textDecoration: 'none',
          letterSpacing: '-0.01em',
        }}
      >
        {process.env.NEXT_PUBLIC_APP_NAME}
      </Link>

      <nav style={{ display: 'grid', gap: '1rem', flex: 1 }}>
        <div>
          <p style={sectionLabelStyle}>Main</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.125rem' }}>
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  style={navItemStyle(isActive(item.href))}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p style={sectionLabelStyle}>More</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.125rem' }}>
            {SECONDARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  style={navItemStyle(isActive(item.href))}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}

export function Sidebar() {
  return (
    <aside
      className="app-desktop-sidebar"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '220px',
        background: 'var(--color-bg-secondary)',
        borderRight: '1px solid var(--color-border)',
        padding: '1.5rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        overflowY: 'auto',
        zIndex: 50,
      }}
    >
      <NavBody />
    </aside>
  );
}

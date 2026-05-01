'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Inbox as InboxIcon,
  CalendarDays,
  FolderOpen,
  Users,
  DollarSign,
  FileText,
  Camera,
  ClipboardList,
  Link as LinkIcon,
  CircleHelp,
  Settings as SettingsIcon,
  type LucideIcon,
} from 'lucide-react';

type NavItem = { href: string; label: string; icon: LucideIcon };

const PRIMARY_NAV: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/inbox', label: 'Inbox', icon: InboxIcon },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/finances', label: 'Finances', icon: DollarSign },
  { href: '/contracts', label: 'Contracts', icon: FileText },
];

const SECONDARY_NAV: NavItem[] = [
  { href: '/gear', label: 'Gear', icon: Camera },
  { href: '/forms', label: 'Forms', icon: ClipboardList },
  { href: '/links', label: 'Links', icon: LinkIcon },
  { href: '/help', label: 'Help', icon: CircleHelp },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export const ALL_NAV_ITEMS: NavItem[] = [...PRIMARY_NAV, ...SECONDARY_NAV];

const navItemStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.625rem',
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
        prefetch={true}
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
                  prefetch={true}
                  onClick={onNavigate}
                  style={navItemStyle(isActive(item.href))}
                >
                  <item.icon size={16} strokeWidth={1.75} />
                  <span>{item.label}</span>
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
                  prefetch={true}
                  onClick={onNavigate}
                  style={navItemStyle(isActive(item.href))}
                >
                  <item.icon size={16} strokeWidth={1.75} />
                  <span>{item.label}</span>
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

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ALL_NAV_ITEMS, NavBody } from './Sidebar';

const MOBILE_TOP_BAR_HEIGHT = 56;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer whenever route changes (back/forward + nav clicks).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock scroll when drawer open + Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const currentItem = ALL_NAV_ITEMS.find((it) =>
    it.href === '/' ? pathname === '/' : pathname === it.href || pathname.startsWith(`${it.href}/`)
  );
  const title = currentItem?.label ?? process.env.NEXT_PUBLIC_APP_NAME ?? '';

  return (
    <>
      {/* Top bar — only visible on mobile via .app-mobile-only */}
      <header
        className="app-mobile-only"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: MOBILE_TOP_BAR_HEIGHT,
          background: 'var(--color-bg-secondary)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0 0.75rem',
        }}
      >
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            fontSize: '1.5rem',
            lineHeight: 1,
          }}
        >
          {open ? '×' : '☰'}
        </button>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1rem',
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
      </header>

      {/* Drawer — only renders when open. Always behind .app-mobile-only too. */}
      {open ? (
        <div className="app-mobile-only" aria-hidden={!open}>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              top: MOBILE_TOP_BAR_HEIGHT,
              background: 'rgba(0, 0, 0, 0.6)',
              zIndex: 45,
              animation: 'fade-in 0.15s ease',
            }}
          />
          <aside
            style={{
              position: 'fixed',
              top: MOBILE_TOP_BAR_HEIGHT,
              left: 0,
              bottom: 0,
              width: 'min(280px, 80vw)',
              background: 'var(--color-bg-secondary)',
              borderRight: '1px solid var(--color-border)',
              padding: '1.25rem 0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              overflowY: 'auto',
              zIndex: 46,
              animation: 'slide-in-left 0.2s ease',
            }}
          >
            <NavBody onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}
    </>
  );
}

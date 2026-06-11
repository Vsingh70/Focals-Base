import type { ReactNode } from 'react';
import { LT } from './tokens';

// ── Phone bezel (marketing scale) ────────────────────────────

type PhoneFrameProps = {
  children: ReactNode;
  width?: number;
  glow?: boolean;
};

export function PhoneFrame({ children, width = 320, glow = true }: PhoneFrameProps) {
  const ratio = 844 / 390;
  const h = Math.round(width * ratio);
  return (
    <div style={{ position: 'relative', width, height: h }}>
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: '-12% -18%',
            background: `radial-gradient(60% 50% at 50% 38%, ${LT.accentA22}, transparent 70%)`,
            filter: 'blur(8px)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: width * 0.135,
          background: '#000',
          padding: width * 0.028,
          boxShadow: `0 1px 0 1px #1d1d1d, 0 40px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px ${LT.border2}`,
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            borderRadius: width * 0.11,
            overflow: 'hidden',
            background: LT.bg,
          }}
        >
          {/* status bar strip */}
          <div
            style={{
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 20px',
              position: 'relative',
              zIndex: 5,
              background: LT.bg,
              color: LT.text,
            }}
          >
            <span
              style={{
                fontFamily: '-apple-system, "SF Pro", system-ui',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              9:41
            </span>
            <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <svg width="15" height="10" viewBox="0 0 19 12" fill="currentColor" aria-hidden="true">
                <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" />
                <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" />
                <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" />
                <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" />
              </svg>
              <svg width="22" height="11" viewBox="0 0 27 13" aria-hidden="true">
                <rect
                  x="0.5"
                  y="0.5"
                  width="23"
                  height="12"
                  rx="3.5"
                  stroke="currentColor"
                  strokeOpacity="0.4"
                  fill="none"
                />
                <rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor" />
              </svg>
            </span>
            {/* notch */}
            <div
              style={{
                position: 'absolute',
                top: 7,
                left: '50%',
                transform: 'translateX(-50%)',
                width: width * 0.32,
                height: 19,
                background: '#000',
                borderRadius: 12,
              }}
            />
          </div>
          <div style={{ position: 'absolute', top: 30, left: 0, right: 0, bottom: 0 }}>
            {children}
          </div>
          {/* home indicator */}
          <div
            style={{
              position: 'absolute',
              bottom: 7,
              left: '50%',
              transform: 'translateX(-50%)',
              width: width * 0.34,
              height: 4,
              borderRadius: 999,
              background: LT.text2,
              opacity: 0.5,
              zIndex: 6,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Browser chrome (responsive, fluid width) ─────────────────

type BrowserFrameProps = {
  children: ReactNode;
  height?: number;
  url?: string;
  glow?: boolean;
};

export function BrowserFrame({
  children,
  height = 560,
  url = 'app.lenslate.com/projects',
  glow = true,
}: BrowserFrameProps) {
  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: '-8% -6% -14%',
            background: `radial-gradient(50% 60% at 50% 30%, ${LT.accentA1c}, transparent 70%)`,
            filter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />
      )}
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 14,
          overflow: 'hidden',
          border: `0.5px solid ${LT.border2}`,
          background: LT.bg2,
          boxShadow: '0 40px 90px -30px rgba(0,0,0,0.8)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            height: 42,
            padding: '0 14px',
            borderBottom: `0.5px solid ${LT.border}`,
            background: LT.bg2,
          }}
        >
          <div style={{ display: 'flex', gap: 7 }}>
            {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
              <span
                key={c}
                style={{ width: 11, height: 11, borderRadius: 999, background: c, opacity: 0.9 }}
              />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                height: 26,
                padding: '0 14px',
                borderRadius: 7,
                background: LT.bg3,
                border: `0.5px solid ${LT.border}`,
                maxWidth: 340,
              }}
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                style={{ color: LT.text3 }}
                aria-hidden="true"
              >
                <rect x="4" y="9" width="12" height="8" rx="1.5" />
                <path d="M7 9V6.5a3 3 0 0 1 6 0V9" />
              </svg>
              <span style={{ fontFamily: LT.ui, fontSize: 12.5, color: LT.text2 }}>{url}</span>
            </div>
          </div>
          <div style={{ width: 52 }} />
        </div>
        <div style={{ height, overflow: 'hidden' }}>{children}</div>
      </div>
    </div>
  );
}

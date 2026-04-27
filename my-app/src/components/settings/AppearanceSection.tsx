'use client';

import { useTheme, ACCENT_PRESETS, type ThemeMode } from '@/components/theme/ThemeProvider';

const modes: { id: ThemeMode; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'system', label: 'System' },
];

const labelStyle: React.CSSProperties = {
  fontSize: '0.8125rem',
  color: 'var(--color-text-secondary)',
  marginBottom: '0.5rem',
};

function modeButton(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '0.625rem 1rem',
    background: active ? 'var(--color-bg-tertiary)' : 'transparent',
    color: active ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    border: '1px solid',
    borderColor: active ? 'var(--color-accent)' : 'var(--color-border-secondary)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
  };
}

export function AppearanceSection() {
  const { mode, accent, setMode, setAccent, resolved } = useTheme();

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <div>
        <p style={labelStyle}>Theme</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              style={modeButton(mode === m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-tertiary)',
            margin: '0.5rem 0 0',
          }}
        >
          Currently displaying: <strong>{resolved}</strong>. Theme preferences are saved in
          your browser.
        </p>
      </div>

      <div>
        <p style={labelStyle}>Accent color</p>
        <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
          {ACCENT_PRESETS.map((preset) => {
            const isActive = accent === preset.id;
            const swatch = resolved === 'dark' ? preset.color : preset.lightColor;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setAccent(preset.id)}
                aria-label={preset.label}
                title={preset.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.625rem 0.375rem 0.375rem',
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid',
                  borderColor: isActive
                    ? 'var(--color-accent)'
                    : 'var(--color-border-secondary)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  color: 'var(--color-text-primary)',
                  fontSize: '0.8125rem',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: swatch,
                    border: '1px solid var(--color-border)',
                  }}
                />
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

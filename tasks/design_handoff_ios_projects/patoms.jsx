// patoms.jsx — shared UI atoms (dark, Focals tokens). Globals from pdata.jsx.

function Pill({ tone = 'neutral', children, size = 11 }) {
  const c = toneColor(tone);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontFamily: T.ui, fontSize: size, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.06em',
      color: c, background: c + '1f',
      padding: '3px 7px', borderRadius: 5, lineHeight: 1, whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

function Dot({ color, size = 8 }) {
  return <span style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />;
}

function Bar({ frac, height = 5, full }) {
  const done = frac >= 1;
  return (
    <div style={{ height, borderRadius: 999, background: T.bg3, overflow: 'hidden', width: full ? '100%' : undefined, flex: full ? undefined : 1 }}>
      <div style={{ height: '100%', width: (frac * 100) + '%', borderRadius: 999, background: done ? T.success : T.accent, transition: 'width .4s cubic-bezier(.3,.7,.3,1)' }} />
    </div>
  );
}

function Ring({ frac, size = 40, stroke = 4 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const done = frac >= 1;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.bg3} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={done ? T.success : T.accent} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={c * (1 - frac)} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: 'stroke-dashoffset .5s cubic-bezier(.3,.7,.3,1)' }} />
    </svg>
  );
}

// A compact stat tile (Shoot / Balance / Paid)
function StatTile({ label, value, sub, accent, children }) {
  return (
    <div style={{
      flex: 1, background: T.bg2, border: `0.5px solid ${T.border}`, borderRadius: 12,
      padding: '12px 12px 13px', minWidth: 0,
      display: 'flex', flexDirection: 'column', gap: 5,
    }}>
      <div style={{ fontFamily: T.ui, fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.text3 }}>{label}</div>
      {children || (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontFamily: T.ui, fontSize: 19, fontWeight: 600, color: accent || T.text, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
          {sub && <div style={{ fontFamily: T.ui, fontSize: 11.5, color: T.text2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>}
        </div>
      )}
    </div>
  );
}

// Custom dark navigation bar. variant: 'large' | 'inline'
function NavBar({ variant = 'large', title, leading, trailing, onScrollShadow = false }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 12,
      paddingTop: 56, background: T.bg,
      borderBottom: onScrollShadow ? `0.5px solid ${T.border}` : '0.5px solid transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '0 8px', gap: 4 }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start' }}>{leading}</div>
        {variant === 'inline' && (
          <div style={{ flex: 2, textAlign: 'center', fontFamily: T.ui, fontSize: 16, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        )}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>{trailing}</div>
      </div>
      {variant === 'large' && (
        <div style={{ padding: '2px 20px 12px', fontFamily: T.ui, fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: T.text }}>{title}</div>
      )}
    </div>
  );
}

// Round glass-ish toolbar button (icon)
function NavButton({ icon, label, onClick, tone }) {
  if (label) {
    return (
      <button onClick={onClick} style={{
        border: 'none', background: 'transparent', cursor: 'pointer',
        fontFamily: T.ui, fontSize: 16, fontWeight: tone === 'bold' ? 600 : 400,
        color: tone === 'disabled' ? T.text3 : T.accent, padding: '8px 10px',
      }} disabled={tone === 'disabled'}>{label}</button>
    );
  }
  return (
    <button onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 999, cursor: 'pointer',
      border: `0.5px solid ${T.border2}`, background: T.bg2,
      color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
    }}>
      <Icon name={icon} size={19} />
    </button>
  );
}

function SearchField({ value, onChange, placeholder = 'Search projects' }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      background: T.bg2, border: `0.5px solid ${T.border}`, borderRadius: 10,
      padding: '0 10px', height: 38,
    }}>
      <span style={{ color: T.text3 }}><Icon name="search" size={17} /></span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: T.text, fontFamily: T.ui, fontSize: 15 }} />
      {value && (
        <button onClick={() => onChange('')} style={{ border: 'none', background: 'transparent', color: T.text3, cursor: 'pointer', padding: 2, display: 'flex' }}>
          <Icon name="x" size={15} />
        </button>
      )}
    </div>
  );
}

// Section header for grouped lists: colored tick + label + count
function GroupHeader({ group, count }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 4px 9px' }}>
      <span style={{ width: 3, height: 13, borderRadius: 2, background: group.color }} />
      <span style={{ fontFamily: T.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.text2 }}>{group.label}</span>
      <span style={{ fontFamily: T.ui, fontSize: 12, fontWeight: 600, color: T.text3 }}>{count}</span>
    </div>
  );
}

// iOS-style inset grouped container + rows (for detail & form)
function InsetGroup({ label, children, footer }) {
  const kids = React.Children.toArray(children).filter(Boolean);
  return (
    <div>
      {label && <div style={{ fontFamily: T.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.text3, padding: '0 4px 8px' }}>{label}</div>}
      <div style={{ background: T.bg2, border: `0.5px solid ${T.border}`, borderRadius: 14, overflow: 'hidden' }}>
        {kids.map((c, i) => (
          <div key={i}>
            {c}
            {i < kids.length - 1 && <div style={{ height: 0.5, background: T.border, marginLeft: 16 }} />}
          </div>
        ))}
      </div>
      {footer && <div style={{ fontFamily: T.ui, fontSize: 12, color: T.text3, padding: '8px 4px 0', lineHeight: 1.4 }}>{footer}</div>}
    </div>
  );
}

// A single row inside an InsetGroup
function Row({ label, children, onClick, chevron, value, valueColor, multiline, minHeight = 48 }) {
  const interactive = !!onClick;
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: multiline ? 'flex-start' : 'center',
      minHeight, padding: '0 16px', gap: 12,
      cursor: interactive ? 'pointer' : 'default',
      flexDirection: multiline ? 'column' : 'row',
      paddingTop: multiline ? 12 : 0, paddingBottom: multiline ? 12 : 0,
    }}>
      {label && <div style={{ fontFamily: T.ui, fontSize: 15, color: T.text2, flexShrink: 0, paddingTop: multiline ? 0 : 0 }}>{label}</div>}
      {!multiline && <div style={{ flex: 1 }} />}
      <div style={{
        fontFamily: T.ui, fontSize: 15, color: valueColor || T.text,
        display: 'flex', alignItems: 'center', gap: 6, minWidth: 0,
        width: multiline ? '100%' : undefined, justifyContent: multiline ? 'flex-start' : 'flex-end',
        textAlign: multiline ? 'left' : 'right',
      }}>
        {children != null ? children : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: multiline ? 'normal' : 'nowrap' }}>{value}</span>}
        {chevron && <span style={{ color: T.text3, display: 'flex' }}><Icon name="chevron" size={16} /></span>}
      </div>
    </div>
  );
}

// Segmented control
function Segmented({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', background: T.bg3, borderRadius: 9, padding: 2, gap: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            flex: 1, border: 'none', cursor: 'pointer', borderRadius: 7,
            padding: '7px 4px', fontFamily: T.ui, fontSize: 13, fontWeight: active ? 600 : 500,
            color: active ? T.text : T.text2,
            background: active ? T.bg2 : 'transparent',
            boxShadow: active ? '0 1px 2px rgba(0,0,0,0.4)' : 'none', transition: 'all .15s',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

// Text input field row (label above, input below) for forms
function FieldInput({ label, value, onChange, placeholder, prefix, keyboard, multiline }) {
  const common = {
    width: '100%', border: 'none', outline: 'none', background: 'transparent',
    color: T.text, fontFamily: T.ui, fontSize: 15, resize: 'none',
  };
  return (
    <div style={{ display: 'flex', alignItems: multiline ? 'flex-start' : 'center', minHeight: 48, padding: '0 16px', gap: 12 }}>
      <div style={{ fontFamily: T.ui, fontSize: 15, color: T.text2, width: 96, flexShrink: 0, paddingTop: multiline ? 14 : 0 }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 4, paddingTop: multiline ? 13 : 0, paddingBottom: multiline ? 13 : 0 }}>
        {prefix && <span style={{ color: T.text2, fontFamily: T.ui, fontSize: 15 }}>{prefix}</span>}
        {multiline ? (
          <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} style={common} />
        ) : (
          <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={keyboard}
            style={{ ...common, textAlign: 'left' }} />
        )}
      </div>
    </div>
  );
}

// Bottom-sheet modal wrapper
function Sheet({ open, onClose, children }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
        opacity: open ? 1 : 0, transition: 'opacity .32s ease',
      }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: 52,
        background: T.bg2, borderTopLeftRadius: 16, borderTopRightRadius: 16,
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform .36s cubic-bezier(.32,.72,0,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 2px' }}>
          <div style={{ width: 36, height: 5, borderRadius: 999, background: T.border2 }} />
        </div>
        {children}
      </div>
    </div>
  );
}

// Simple popover menu (action sheet style) anchored top-right
function PopMenu({ open, onClose, items }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 30 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0 }} />
      <div style={{
        position: 'absolute', top: 96, right: 14, minWidth: 220,
        background: T.bg3, border: `0.5px solid ${T.border2}`, borderRadius: 14,
        boxShadow: '0 12px 40px rgba(0,0,0,0.6)', overflow: 'hidden',
      }}>
        {items.map((it, i) => (
          <div key={i}>
            <button onClick={() => { it.onClick(); onClose(); }} style={{
              width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              padding: '13px 16px', fontFamily: T.ui, fontSize: 15.5,
              color: it.tone === 'danger' ? T.danger : T.text,
            }}>
              <span>{it.label}</span>
              <span style={{ color: it.tone === 'danger' ? T.danger : T.text2, display: 'flex' }}><Icon name={it.icon} size={18} /></span>
            </button>
            {i < items.length - 1 && <div style={{ height: 0.5, background: T.border, marginLeft: 16 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  Pill, Dot, Bar, Ring, StatTile, NavBar, NavButton, SearchField,
  GroupHeader, InsetGroup, Row, Segmented, FieldInput, Sheet, PopMenu,
});

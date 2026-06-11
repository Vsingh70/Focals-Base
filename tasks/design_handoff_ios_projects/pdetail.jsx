// pdetail.jsx — redesigned Project detail. Globals from pdata/patoms.

function MapPlaceholder({ location }) {
  return (
    <div>
      <div style={{ fontFamily: T.ui, fontSize: 12.5, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: T.text3, padding: '0 4px 8px' }}>Location</div>
      <div style={{
        height: 150, borderRadius: 14, border: `0.5px solid ${T.border}`, overflow: 'hidden', position: 'relative',
        background: `repeating-linear-gradient(45deg, ${T.bg2}, ${T.bg2} 11px, ${T.bg3} 11px, ${T.bg3} 22px)`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 7,
      }}>
        <span style={{ color: T.accent }}><Icon name="pin" size={22} /></span>
        <span style={{ fontFamily: 'ui-monospace, "SF Mono", monospace', fontSize: 11, color: T.text2, letterSpacing: '0.04em' }}>MAP SNAPSHOT</span>
        <span style={{ fontFamily: T.ui, fontSize: 13, color: T.text, maxWidth: '80%', textAlign: 'center' }}>{location}</span>
      </div>
    </div>
  );
}

function ConfirmDelete({ open, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <div onClick={onCancel} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)' }} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 300, background: T.bg3, borderRadius: 18, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ padding: '20px 20px 16px', textAlign: 'center' }}>
          <div style={{ fontFamily: T.ui, fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 6 }}>Delete this project?</div>
          <div style={{ fontFamily: T.ui, fontSize: 13, color: T.text2, lineHeight: 1.45 }}>Linked finances and contracts keep their data; their reference to this project is cleared.</div>
        </div>
        <div style={{ height: 0.5, background: T.border }} />
        <div style={{ display: 'flex' }}>
          <button onClick={onCancel} style={{ flex: 1, border: 'none', background: 'transparent', padding: '14px', cursor: 'pointer', fontFamily: T.ui, fontSize: 16, color: T.accent }}>Cancel</button>
          <div style={{ width: 0.5, background: T.border }} />
          <button onClick={onConfirm} style={{ flex: 1, border: 'none', background: 'transparent', padding: '14px', cursor: 'pointer', fontFamily: T.ui, fontSize: 16, fontWeight: 600, color: T.danger }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function DetailScreen({ project: p, onBack, onEdit, onDelete }) {
  const [confirm, setConfirm] = React.useState(false);
  const [calToast, setCalToast] = React.useState(false);
  const f = fraction(p);
  const bal = balance(p);
  const cn = clientName(p.clientId);

  const shootTile = !p.shoot
    ? { label: 'Shoot', value: '—', sub: 'Not scheduled' }
    : p.shoot.past
      ? { label: 'Shot', value: p.shoot.rel, sub: 'Completed' }
      : { label: 'Shoot', value: p.shoot.rel, sub: p.shoot.full.split(' · ')[0].replace(/^[A-Za-z]+, /, '') };

  const addCal = () => {
    setCalToast(true);
    setTimeout(() => setCalToast(false), 1900);
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg, position: 'relative' }}>
      <NavBar
        variant="inline"
        title={p.title}
        leading={<NavButton icon="back" onClick={onBack} />}
        trailing={<NavButton label="Edit" tone="bold" onClick={onEdit} />}
      />

      <div style={{ padding: '8px 16px 40px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* Hero */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 4 }}>
          <div style={{ fontFamily: T.serif, fontSize: 27, fontWeight: 500, color: T.text, letterSpacing: '-0.01em', lineHeight: 1.1 }}>{p.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Pill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Pill>
            <span style={{ fontFamily: T.ui, fontSize: 14, color: T.text2 }}>{cn || 'No client'} · {p.category}</span>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 10 }}>
          <StatTile label={shootTile.label} value={shootTile.value} sub={shootTile.sub} />
          <StatTile label="Balance" value={p.price > 0 ? money(bal) : '—'} sub={p.price > 0 ? (bal > 0 ? 'due' : 'settled') : 'No price'} accent={p.price > 0 ? (bal > 0 ? T.warning : T.success) : T.text} />
          <StatTile label="Paid">
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <Ring frac={f} size={34} stroke={4} />
              <span style={{ fontFamily: T.ui, fontSize: 17, fontWeight: 600, color: T.text }}>{p.price > 0 ? Math.round(f * 100) + '%' : '—'}</span>
            </div>
          </StatTile>
        </div>

        {/* Payment */}
        <InsetGroup label="Payment">
          <Row label="Package price" value={money(p.price)} />
          <Row label="Amount paid" value={money(p.paid)} />
          <Row label="Balance due" value={money(bal)} valueColor={bal > 0 ? T.warning : T.success} />
          <Row label="Status"><Pill tone={p.pay === 'paid' ? 'success' : p.pay === 'partial' ? 'warning' : 'neutral'}>{p.pay}</Pill></Row>
          {p.price > 0 && (
            <div style={{ padding: '12px 16px' }}><Bar frac={f} full height={6} /></div>
          )}
        </InsetGroup>

        {/* Details */}
        <InsetGroup label="Details">
          {cn && <Row label="Client" value={cn} valueColor={T.accent} chevron onClick={() => {}} />}
          <Row label="Category" value={p.category} />
          {p.shoot && <Row label="Shoot date" value={p.shoot.full} />}
          {p.location && <Row label="Location" value={p.location} valueColor={T.accent} chevron onClick={() => {}} />}
        </InsetGroup>

        {/* Map */}
        {p.location && <MapPlaceholder location={p.location} />}

        {/* Notes */}
        {p.notes && (
          <InsetGroup label="Notes">
            <Row multiline minHeight={0}><span style={{ lineHeight: 1.5, color: T.text }}>{p.notes}</span></Row>
          </InsetGroup>
        )}

        {/* Actions */}
        {p.shoot && !p.shoot.past && (
          <button onClick={addCal} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            minHeight: 48, borderRadius: 12, cursor: 'pointer',
            border: `0.5px solid ${T.border2}`, background: T.bg2, color: T.accent,
            fontFamily: T.ui, fontSize: 15, fontWeight: 500,
          }}>
            <Icon name="calPlus" size={18} /> Add to iOS Calendar
          </button>
        )}

        <button onClick={() => setConfirm(true)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          minHeight: 48, borderRadius: 12, cursor: 'pointer',
          border: `0.5px solid ${T.danger}33`, background: T.danger + '14', color: T.danger,
          fontFamily: T.ui, fontSize: 15, fontWeight: 500,
        }}>
          <Icon name="trash" size={17} /> Delete project
        </button>
      </div>

      {calToast && (
        <div style={{ position: 'absolute', top: 104, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: T.bg3, border: `0.5px solid ${T.border2}`, color: T.text, fontFamily: T.ui, fontSize: 13.5, fontWeight: 500, padding: '9px 15px', borderRadius: 999, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
            <span style={{ color: T.success }}><Icon name="check" size={16} /></span> Added to iOS Calendar
          </div>
        </div>
      )}

      <ConfirmDelete open={confirm} onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); onDelete(p); }} />
    </div>
  );
}

Object.assign(window, { DetailScreen });

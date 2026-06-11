// pform.jsx — Project create/edit form. Save is confirmed via the nav-bar
// "Done" button (no separate bottom save button). Globals from pdata/patoms.

const FORM_NOW = new Date('2026-06-12T10:00:00');

function fmtShoot(date) {
  if (!date) return null;
  const d0 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const n0 = new Date(FORM_NOW.getFullYear(), FORM_NOW.getMonth(), FORM_NOW.getDate());
  const diff = Math.round((d0 - n0) / 86400000);
  const md = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let rel;
  if (diff < 0) rel = md;
  else if (diff === 0) rel = 'Today';
  else if (diff === 1) rel = 'Tomorrow';
  else rel = 'in ' + diff + 'd';
  const full = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return { rel, full, past: diff < 0 };
}

function toLocalInput(date) {
  if (!date) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

// Picker overlay (bottom sheet) inside the form
function Picker({ open, title, options, selected, onSelect, onClose }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 20, pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', opacity: open ? 1 : 0, transition: 'opacity .25s' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '70%',
        background: T.bg3, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden',
        transform: open ? 'translateY(0)' : 'translateY(100%)', transition: 'transform .3s cubic-bezier(.32,.72,0,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 16px 10px', fontFamily: T.ui, fontSize: 15, fontWeight: 600, color: T.text, textAlign: 'center', borderBottom: `0.5px solid ${T.border}` }}>{title}</div>
        <div style={{ overflowY: 'auto' }}>
          {options.map((o, i) => (
            <div key={o.value || 'none'}>
              <button onClick={() => { onSelect(o.value); onClose(); }} style={{
                width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', fontFamily: T.ui, fontSize: 16,
                color: T.text, textAlign: 'left',
              }}>
                {o.color && <Dot color={o.color} size={9} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.label}</div>
                  {o.sub && <div style={{ fontSize: 12.5, color: T.text2 }}>{o.sub}</div>}
                </div>
                {o.value === selected && <span style={{ color: T.accent, display: 'flex' }}><Icon name="check" size={18} /></span>}
              </button>
              {i < options.length - 1 && <div style={{ height: 0.5, background: T.border, marginLeft: 18 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectFormSheet({ open, mode, project, onCancel, onSave }) {
  const isEdit = mode === 'edit';
  const [d, setD] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [picker, setPicker] = React.useState(null); // 'client' | 'status'

  React.useEffect(() => {
    if (!open) return;
    setSaving(false); setPicker(null);
    if (isEdit && project) {
      setD({
        title: project.title, clientId: project.clientId, category: project.category || '',
        status: project.status, location: project.location || '',
        price: project.price ? String(project.price) : '', paid: project.paid ? String(project.paid) : '',
        pay: project.pay, notes: project.notes || '',
        date: project.shoot ? guessDate(project.shoot) : null,
      });
    } else {
      setD({ title: '', clientId: null, category: '', status: 'inquiry', location: '', price: '', paid: '', pay: 'unpaid', notes: '', date: null });
    }
  }, [open]);

  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const valid = (d.title || '').trim().length > 0;
  const priceN = parseFloat(d.price) || 0;
  const paidN = parseFloat(d.paid) || 0;
  const bal = Math.max(0, priceN - paidN);
  const shoot = fmtShoot(d.date);

  const doSave = () => {
    if (!valid || saving) return;
    setSaving(true);
    setTimeout(() => {
      onSave({
        id: project ? project.id : 'new-' + Date.now(),
        title: d.title.trim(), clientId: d.clientId, category: d.category.trim() || 'Uncategorized',
        status: d.status, shoot, location: d.location.trim() || null,
        price: priceN, paid: paidN, pay: d.pay, notes: d.notes.trim() || null,
      });
    }, 600);
  };

  return (
    <Sheet open={open} onClose={onCancel}>
      {/* Sheet nav bar: Cancel · title · Done (saves) */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '6px 8px 10px', borderBottom: `0.5px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <button onClick={onCancel} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: T.ui, fontSize: 16, color: T.accent, padding: '8px 10px' }}>Cancel</button>
        </div>
        <div style={{ flex: 2, textAlign: 'center', fontFamily: T.ui, fontSize: 16, fontWeight: 600, color: T.text }}>{isEdit ? 'Edit project' : 'New project'}</div>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={doSave} disabled={!valid || saving} style={{
            border: 'none', background: 'transparent', cursor: valid && !saving ? 'pointer' : 'default',
            fontFamily: T.ui, fontSize: 16, fontWeight: 700, padding: '8px 10px',
            color: valid && !saving ? T.accent : T.text3, minWidth: 56, display: 'flex', justifyContent: 'flex-end',
          }}>
            {saving ? <Spinner /> : 'Done'}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 40px', display: 'flex', flexDirection: 'column', gap: 18, position: 'relative' }}>
        <InsetGroup label="Basics">
          <FieldInput label="Title" value={d.title} onChange={(v) => set('title', v)} placeholder="e.g. Johnson family portraits" />
          <Row label="Client" onClick={() => setPicker('client')} chevron valueColor={d.clientId ? T.text : T.text2} value={d.clientId ? clientName(d.clientId) : 'No client'} />
          <FieldInput label="Category" value={d.category} onChange={(v) => set('category', v)} placeholder="portrait, wedding…" />
          <Row label="Status" onClick={() => setPicker('status')} chevron>
            <Pill tone={STATUS[d.status]?.tone || 'neutral'}>{STATUS[d.status]?.label}</Pill>
          </Row>
          <div style={{ display: 'flex', alignItems: 'center', minHeight: 48, padding: '0 16px', gap: 12 }}>
            <div style={{ fontFamily: T.ui, fontSize: 15, color: T.text2, width: 96, flexShrink: 0 }}>Shoot</div>
            <input type="datetime-local" value={toLocalInput(d.date)} onChange={(e) => set('date', e.target.value ? new Date(e.target.value) : null)}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: d.date ? T.text : T.text3, fontFamily: T.ui, fontSize: 15, colorScheme: 'dark' }} />
          </div>
          <FieldInput label="Location" value={d.location} onChange={(v) => set('location', v)} placeholder="Studio, venue, address…" />
        </InsetGroup>

        <InsetGroup label="Payment" footer={priceN > 0 ? `Balance due ${money(bal)}` : null}>
          <FieldInput label="Package" value={d.price} onChange={(v) => set('price', v.replace(/[^0-9.]/g, ''))} placeholder="0" prefix="$" keyboard="decimal" />
          <FieldInput label="Paid" value={d.paid} onChange={(v) => set('paid', v.replace(/[^0-9.]/g, ''))} placeholder="0" prefix="$" keyboard="decimal" />
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: T.ui, fontSize: 15, color: T.text2 }}>Payment status</div>
            <Segmented value={d.pay} onChange={(v) => set('pay', v)} options={[{ value: 'unpaid', label: 'Unpaid' }, { value: 'partial', label: 'Partial' }, { value: 'paid', label: 'Paid' }]} />
          </div>
        </InsetGroup>

        <InsetGroup label="Notes">
          <FieldInput label="Notes" value={d.notes} onChange={(v) => set('notes', v)} placeholder="Anything to remember…" multiline />
        </InsetGroup>

        <Picker open={picker === 'client'} title="Client" selected={d.clientId} onClose={() => setPicker(null)} onSelect={(v) => set('clientId', v)}
          options={[{ value: null, label: 'No client' }, ...CLIENTS.map((c) => ({ value: c.id, label: c.name, sub: c.email }))]} />
        <Picker open={picker === 'status'} title="Status" selected={d.status} onClose={() => setPicker(null)} onSelect={(v) => set('status', v)}
          options={STATUS_ORDER.map((s) => ({ value: s, label: STATUS[s].label, color: STATUS[s].color }))} />
      </div>
    </Sheet>
  );
}

// Reconstruct an approximate Date from the sample shoot object so the edit
// form's date picker opens populated.
function guessDate(shoot) {
  if (!shoot) return null;
  const m = shoot.full.match(/([A-Za-z]+) (\d+) · (\d+):(\d+)\s?(AM|PM)/);
  if (!m) return null;
  const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  let h = parseInt(m[3], 10); if (m[5] === 'PM' && h < 12) h += 12; if (m[5] === 'AM' && h === 12) h = 0;
  return new Date(2026, months[m[1]] ?? 5, parseInt(m[2], 10), h, parseInt(m[4], 10));
}

function Spinner() {
  return (
    <span style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${T.accent}55`, borderTopColor: T.accent, display: 'inline-block', animation: 'pspin 0.7s linear infinite' }} />
  );
}

Object.assign(window, { ProjectFormSheet });

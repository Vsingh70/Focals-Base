// plist.jsx — Projects list: 3 directions, grouped by status pipeline.

function buildGroups(projects, search) {
  const needle = search.trim().toLowerCase();
  const filtered = projects.filter((p) => {
    if (!needle) return true;
    return [p.title, clientName(p.clientId) || '', p.category || '', p.location || '']
      .join(' ').toLowerCase().includes(needle);
  });
  return GROUPS.map((g) => ({
    group: g,
    items: filtered.filter((p) => g.statuses.includes(p.status)),
  })).filter((sec) => sec.items.length > 0);
}

function pctText(p) {
  if (!p.price || p.price <= 0) return null;
  return Math.round(fraction(p) * 100) + '%';
}

function EmptyResults() {
  return (
    <div style={{ textAlign: 'center', color: T.text3, fontFamily: T.ui, padding: '60px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: T.text3 }}><Icon name="search" size={30} /></div>
      <div style={{ fontSize: 15, color: T.text2 }}>No projects match your search.</div>
    </div>
  );
}

// ── Direction A — Editorial rows ─────────────────────────────
function ListA({ sections, onOpen }) {
  return (
    <div style={{ padding: '4px 16px 28px' }}>
      {sections.map(({ group, items }) => (
        <div key={group.id}>
          <GroupHeader group={group} count={items.length} />
          <div style={{ background: T.bg2, border: `0.5px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', opacity: group.id === 'cancel' ? 0.6 : 1 }}>
            {items.map((p, i) => {
              const pct = pctText(p);
              const done = fraction(p) >= 1;
              return (
                <div key={p.id}>
                  <div onClick={() => onOpen(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
                    <Dot color={STATUS[p.status].color} size={9} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.ui, fontSize: 15.5, fontWeight: 500, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                      <div style={{ fontFamily: T.ui, fontSize: 12.5, color: T.text2, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clientName(p.clientId) || p.category}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                      <div style={{ fontFamily: T.ui, fontSize: 13, color: T.text2, fontWeight: 500, whiteSpace: 'nowrap' }}>{p.shoot ? p.shoot.rel : p.category}</div>
                      {pct && <div style={{ fontFamily: T.ui, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', color: done ? T.success : (p.pay === 'unpaid' ? T.warning : T.text3) }}>{done ? 'Paid' : pct}</div>}
                    </div>
                  </div>
                  {i < items.length - 1 && <div style={{ height: 0.5, background: T.border, marginLeft: 35 }} />}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Direction B — Rich cards ─────────────────────────────────
function ListB({ sections, onOpen }) {
  return (
    <div style={{ padding: '4px 16px 28px' }}>
      {sections.map(({ group, items }) => (
        <div key={group.id}>
          <GroupHeader group={group} count={items.length} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, opacity: group.id === 'cancel' ? 0.6 : 1 }}>
            {items.map((p) => {
              const f = fraction(p);
              const done = f >= 1;
              return (
                <div key={p.id} onClick={() => onOpen(p)} style={{
                  background: T.bg2, border: `0.5px solid ${T.border}`, borderRadius: 14, padding: 14, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', gap: 9,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.ui, fontSize: 16, fontWeight: 600, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                      <div style={{ fontFamily: T.ui, fontSize: 13, color: T.text2, marginTop: 2 }}>{clientName(p.clientId) || '—'}</div>
                    </div>
                    <Pill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Pill>
                  </div>
                  {p.price > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <Bar frac={f} full height={5} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.ui, fontSize: 12 }}>
                        <span style={{ color: T.text2 }}>{money(p.paid)} of {money(p.price)}</span>
                        <span style={{ color: done ? T.success : T.warning, fontWeight: 600 }}>{done ? 'Paid in full' : money(balance(p)) + ' due'}</span>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', color: T.text3, fontFamily: T.ui, fontSize: 12 }}>
                    {p.shoot && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="calendar" size={13} />{p.shoot.full}</span>}
                    {p.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, minWidth: 0 }}><Icon name="pin" size={13} /><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>{p.location}</span></span>}
                    {!p.shoot && !p.location && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Icon name="tag" size={13} />{p.category}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Direction C — Pipeline ───────────────────────────────────
function ListC({ sections, onOpen }) {
  const [active, setActive] = React.useState('all');
  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const shown = active === 'all' ? sections : sections.filter((s) => s.group.id === active);
  return (
    <div>
      {/* pipeline strip */}
      <div style={{ position: 'sticky', top: 0, zIndex: 8, background: T.bg, paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 16px 10px', scrollbarWidth: 'none' }}>
          <PipeChip label="All" count={total} color={T.text} active={active === 'all'} onClick={() => setActive('all')} />
          {sections.map(({ group, items }) => (
            <PipeChip key={group.id} label={group.label} count={items.length} color={group.color} active={active === group.id} onClick={() => setActive(group.id)} />
          ))}
        </div>
      </div>
      <div style={{ padding: '0 16px 28px' }}>
        {shown.map(({ group, items }) => (
          <div key={group.id}>
            <GroupHeader group={group} count={items.length} />
            <div style={{ background: T.bg2, border: `0.5px solid ${T.border}`, borderRadius: 14, overflow: 'hidden', opacity: group.id === 'cancel' ? 0.6 : 1 }}>
              {items.map((p, i) => {
                const pct = pctText(p);
                const done = fraction(p) >= 1;
                return (
                  <div key={p.id}>
                    <div onClick={() => onOpen(p)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', cursor: 'pointer' }}>
                      <span style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: group.color, minHeight: 30 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: T.ui, fontSize: 15, fontWeight: 500, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                        <div style={{ fontFamily: T.ui, fontSize: 12, color: T.text2, marginTop: 1 }}>{clientName(p.clientId) || p.category}{p.shoot ? ' · ' + p.shoot.rel : ''}</div>
                      </div>
                      {pct && <div style={{ fontFamily: T.ui, fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', color: done ? T.success : (p.pay === 'unpaid' ? T.warning : T.text3) }}>{done ? 'Paid' : pct}</div>}
                      <span style={{ color: T.text3, display: 'flex' }}><Icon name="chevron" size={15} /></span>
                    </div>
                    {i < items.length - 1 && <div style={{ height: 0.5, background: T.border, marginLeft: 29 }} />}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PipeChip({ label, count, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, border: `0.5px solid ${active ? T.border2 : T.border}`, cursor: 'pointer',
      background: active ? T.bg3 : T.bg2, borderRadius: 10, padding: '7px 11px 6px',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 5, minWidth: 56,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: T.ui, fontSize: 13, fontWeight: 600, color: active ? T.text : T.text2 }}>{label}</span>
        <span style={{ fontFamily: T.ui, fontSize: 12, fontWeight: 600, color: T.text3 }}>{count}</span>
      </div>
      <span style={{ height: 3, width: '100%', borderRadius: 2, background: active ? color : 'transparent' }} />
    </button>
  );
}

// ── Controller ───────────────────────────────────────────────
function ProjectsScreen({ projects, direction, onOpen, onNew, onImport }) {
  const [search, setSearch] = React.useState('');
  const [menu, setMenu] = React.useState(false);
  const sections = buildGroups(projects, search);
  const List = direction === 'B' ? ListB : direction === 'C' ? ListC : ListA;
  return (
    <div style={{ height: '100%', overflowY: 'auto', background: T.bg, position: 'relative' }}>
      <NavBar
        title="Projects"
        trailing={<NavButton icon="plus" onClick={() => setMenu(true)} />}
      />
      <div style={{ padding: '0 16px 6px' }}>
        <SearchField value={search} onChange={setSearch} />
      </div>
      {sections.length === 0 ? <EmptyResults /> : <List sections={sections} onOpen={onOpen} />}
      <PopMenu open={menu} onClose={() => setMenu(false)} items={[
        { label: 'New project', icon: 'folderPlus', onClick: onNew },
        { label: 'Import from file', icon: 'import', onClick: onImport },
      ]} />
    </div>
  );
}

Object.assign(window, { ProjectsScreen, ListA, ListB, ListC });

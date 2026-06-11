// pdata.jsx — tokens, status model, sample data, helpers, icons

const T = {
  bg: '#0a0a0a',
  bg2: '#111111',
  bg3: '#1a1a1a',
  border: '#222222',
  border2: '#2a2a2a',
  text: '#f0f0f0',
  text2: '#888888',
  text3: '#555555',
  accent: '#e8e0d0',
  accentMuted: '#3a3530',
  success: '#4caf7d',
  warning: '#e8a020',
  danger: '#e85040',
  ui: '-apple-system, "Inter", system-ui, sans-serif',
  serif: '"Newsreader", "New York", Georgia, serif',
};

// Pipeline phases (groups), in workflow order.
const GROUPS = [
  { id: 'inquiry',  label: 'Inquiries',   color: T.text2,   tone: 'neutral', statuses: ['inquiry'] },
  { id: 'upcoming', label: 'Upcoming',    color: T.accent,  tone: 'accent',  statuses: ['booked'] },
  { id: 'active',   label: 'In progress', color: T.warning, tone: 'warning', statuses: ['in_progress', 'editing'] },
  { id: 'done',     label: 'Delivered',   color: T.success, tone: 'success', statuses: ['delivered', 'completed'] },
  { id: 'cancel',   label: 'Cancelled',   color: T.danger,  tone: 'danger',  statuses: ['cancelled'] },
];

const STATUS = {
  inquiry:     { label: 'Inquiry',     tone: 'neutral', color: T.text2 },
  booked:      { label: 'Booked',      tone: 'accent',  color: T.accent },
  in_progress: { label: 'In Progress', tone: 'warning', color: T.warning },
  editing:     { label: 'Editing',     tone: 'warning', color: T.warning },
  delivered:   { label: 'Delivered',   tone: 'success', color: T.success },
  completed:   { label: 'Completed',   tone: 'success', color: T.success },
  cancelled:   { label: 'Cancelled',   tone: 'danger',  color: T.danger },
};
const STATUS_ORDER = ['inquiry', 'booked', 'in_progress', 'editing', 'delivered', 'completed', 'cancelled'];
const PAYMENT_ORDER = ['unpaid', 'partial', 'paid'];

function groupOf(status) {
  return GROUPS.find((g) => g.statuses.includes(status)) || GROUPS[0];
}
function toneColor(tone) {
  return { neutral: T.text2, accent: T.accent, warning: T.warning, success: T.success, danger: T.danger }[tone] || T.text2;
}

const CLIENTS = [
  { id: 'c1', name: 'Amara Okafor', email: 'amara@okafor.co' },
  { id: 'c2', name: 'Nordic Goods Co.', email: 'studio@nordicgoods.com' },
  { id: 'c3', name: 'Sofia Reyes', email: 'sofia.reyes@gmail.com' },
  { id: 'c4', name: 'Erik Halvorsen', email: 'erik.h@me.com' },
  { id: 'c5', name: 'Maison Atelier', email: 'press@maison.studio' },
  { id: 'c6', name: 'Dana Quincy', email: 'dana.q@gmail.com' },
  { id: 'c7', name: 'Mia Tabor', email: 'mia.tabor@gmail.com' },
  { id: 'c8', name: 'Ortega Co.', email: 'hello@ortega.co' },
  { id: 'c9', name: 'Joan Whitlock', email: 'jwhitlock@gmail.com' },
  { id: 'c10', name: 'Delphine Studio', email: 'studio@delphine.fr' },
  { id: 'c11', name: 'Nina Bellamy', email: 'nina.bellamy@gmail.com' },
];
function clientName(id) { return (CLIENTS.find((c) => c.id === id) || {}).name; }

// shoot: { rel, full, past } or null
const PROJECTS = [
  { id: 'p1', title: 'Amara & Theo', clientId: 'c1', category: 'Wedding', status: 'booked',
    shoot: { rel: 'in 9d', full: 'Sat, Jun 21 · 1:00 PM', past: false }, location: 'Riverside Estate, Austin',
    price: 4800, paid: 1500, pay: 'partial', notes: 'Golden-hour ceremony. Second shooter booked. Family formals list is in the shared doc.' },
  { id: 'p3', title: 'Sofia — Senior Portraits', clientId: 'c3', category: 'Portrait', status: 'booked',
    shoot: { rel: 'in 3d', full: 'Tue, Jun 17 · 4:30 PM', past: false }, location: 'Zilker Botanical Garden',
    price: 650, paid: 0, pay: 'unpaid', notes: 'Two outfit changes. Wants a soft film look.' },
  { id: 'p7', title: 'Mia & Jonah — Engagement', clientId: 'c7', category: 'Engagement', status: 'booked',
    shoot: { rel: 'in 14d', full: 'Sat, Jun 28 · 6:00 PM', past: false }, location: 'Lady Bird Lake',
    price: 1200, paid: 300, pay: 'partial', notes: 'Sunset by the boardwalk. Bringing the 85mm.' },
  { id: 'p5', title: 'Maison — SS26 Editorial', clientId: 'c5', category: 'Editorial', status: 'editing',
    shoot: { rel: 'Jun 5', full: 'Thu, Jun 5 · 9:00 AM', past: true }, location: 'Downtown Loft',
    price: 5400, paid: 2700, pay: 'partial', notes: '12-page spread. Retouch round 2 in progress.' },
  { id: 'p2', title: 'Nordic Goods — Brand', clientId: 'c2', category: 'Brand', status: 'in_progress',
    shoot: { rel: 'Jun 2', full: 'Mon, Jun 2 · 9:00 AM', past: true }, location: 'Studio 7',
    price: 3200, paid: 3200, pay: 'paid', notes: 'Selecting hero shots for the homepage. 40 finals due.' },
  { id: 'p8', title: 'Ortega Product Line', clientId: 'c8', category: 'Product', status: 'in_progress',
    shoot: { rel: 'Jun 8', full: 'Sun, Jun 8 · 10:00 AM', past: true }, location: 'Studio 7',
    price: 2800, paid: 1400, pay: 'partial', notes: 'Cutouts + lifestyle. 60 SKUs to cover.' },
  { id: 'p4', title: 'Halvorsen Family', clientId: 'c4', category: 'Family', status: 'delivered',
    shoot: { rel: 'May 24', full: 'Sat, May 24 · 5:00 PM', past: true }, location: 'Mueller Lake Park',
    price: 900, paid: 900, pay: 'paid', notes: 'Gallery delivered. Print order pending.' },
  { id: 'p9', title: 'Whitlock 50th', clientId: 'c9', category: 'Event', status: 'completed',
    shoot: { rel: 'May 30', full: 'Fri, May 30 · 7:00 PM', past: true }, location: 'Driskill Hotel',
    price: 1500, paid: 1500, pay: 'paid', notes: 'Anniversary dinner. Album ordered and shipped.' },
  { id: 'p6', title: 'Quincy Newborn', clientId: 'c6', category: 'Newborn', status: 'inquiry',
    shoot: null, location: null, price: 0, paid: 0, pay: 'unpaid', notes: 'Due early July. Wants an in-home session.' },
  { id: 'p11', title: 'Bellamy Maternity', clientId: 'c11', category: 'Maternity', status: 'inquiry',
    shoot: null, location: null, price: 0, paid: 0, pay: 'unpaid', notes: 'Outdoor, second trimester. Flexible on dates.' },
  { id: 'p10', title: 'Delphine Lookbook', clientId: 'c10', category: 'Editorial', status: 'cancelled',
    shoot: null, location: null, price: 0, paid: 0, pay: 'unpaid', notes: 'Postponed to fall.' },
];

function money(n) {
  if (n == null) return '$0';
  return '$' + Math.round(n).toLocaleString('en-US');
}
function fraction(p) {
  if (!p.price || p.price <= 0) return 0;
  return Math.min(1, Math.max(0, p.paid / p.price));
}
function balance(p) { return Math.max(0, (p.price || 0) - (p.paid || 0)); }

// ---- Icons (16px default, stroke = currentColor) ----
function Icon({ name, size = 16, stroke = 1.75, style }) {
  const p = { fill: 'none', stroke: 'currentColor', strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    chevron: <path d="M6 4l6 6-6 6" {...p} />,
    back: <path d="M13 4l-6 6 6 6" {...p} />,
    down: <path d="M4 7l6 6 6-6" {...p} />,
    plus: <path d="M10 4v12M4 10h12" {...p} />,
    search: <g {...p}><circle cx="9" cy="9" r="5.5" /><path d="M13.5 13.5l3 3" /></g>,
    calendar: <g {...p}><rect x="3" y="4.5" width="14" height="13" rx="2.5" /><path d="M3 8.5h14M7 3v3M13 3v3" /></g>,
    pin: <g {...p}><path d="M10 17s5.5-4.5 5.5-9A5.5 5.5 0 0 0 4.5 8c0 4.5 5.5 9 5.5 9z" /><circle cx="10" cy="8" r="2" /></g>,
    pencil: <g {...p}><path d="M13.5 4.5l2 2L7 15l-3 1 1-3 8.5-8.5z" /></g>,
    trash: <g {...p}><path d="M4 6h12M8 6V4.5h4V6M6 6l.7 10h6.6L14 6" /></g>,
    person: <g {...p}><circle cx="10" cy="7" r="3" /><path d="M4.5 16c.8-3 2.8-4.5 5.5-4.5S14.7 13 15.5 16" /></g>,
    dollar: <g {...p}><path d="M10 3v14M13 6.5C13 5 11.7 4 10 4S7 5 7 6.3c0 3.4 6 1.7 6 5.2 0 1.5-1.3 2.5-3 2.5s-3-1-3-2.5" /></g>,
    check: <path d="M4 10.5l4 4 8-9" {...p} />,
    x: <path d="M5 5l10 10M15 5L5 15" {...p} />,
    tag: <g {...p}><path d="M4 4h6l6 6-6 6-6-6V4z" /><circle cx="7.5" cy="7.5" r="1" /></g>,
    note: <g {...p}><path d="M5 3.5h10v13H5zM7.5 7h5M7.5 10h5M7.5 13h3" /></g>,
    clock: <g {...p}><circle cx="10" cy="10" r="6.5" /><path d="M10 6.5V10l2.5 1.5" /></g>,
    calPlus: <g {...p}><rect x="3" y="4.5" width="14" height="13" rx="2.5" /><path d="M3 8.5h14M7 3v3M13 3v3M10 11v4M8 13h4" /></g>,
    import: <g {...p}><path d="M10 3v9M6.5 8.5L10 12l3.5-3.5M4 15.5h12" /></g>,
    folderPlus: <g {...p}><path d="M3.5 6.5a2 2 0 0 1 2-2h2l1.5 2h5.5a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-8zM10 9.5v4M8 11.5h4" /></g>,
    slash: <g {...p}><circle cx="10" cy="10" r="6.5" /><path d="M5.5 5.5l9 9" /></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ display: 'block', flexShrink: 0, ...style }}>
      {paths[name]}
    </svg>
  );
}

Object.assign(window, {
  T, GROUPS, STATUS, STATUS_ORDER, PAYMENT_ORDER, CLIENTS, PROJECTS,
  groupOf, toneColor, clientName, money, fraction, balance, Icon,
});

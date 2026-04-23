# Task 05 — Dashboard

## Goal
Root `/` page giving a photographer an at-a-glance business overview. RSC for data, client islands for interactive charts.

## Layout
```
┌──────────────────────────────────────────────────┐
│  KPI Row: Revenue MTD | Active Projects | Upcoming Shoots | Pending $ │
├────────────────────────┬─────────────────────────┤
│  Revenue Chart (6mo)   │  Project Status Donut   │
├────────────────────────┴─────────────────────────┤
│  Upcoming Shoots (next 7 days, horizontal scroll) │
├──────────────────────────┬───────────────────────┤
│  Recent Projects         │  Quick Actions         │
└──────────────────────────┴───────────────────────┘
```

## Components
- `KpiCard` — label, value, delta (±% vs last period), icon, href
- `RevenueChart` — Recharts LineChart, income vs expenses, 6-month window
- `ProjectStatusChart` — Recharts PieChart donut by status
- `UpcomingShootCard` — date badge, client name, location, status pill
- `QuickActions` — "New Project", "Add Client", "Log Expense", "New Inquiry"

## Acceptance Criteria
- [ ] All KPIs fetched server-side in a single parallel Promise.all
- [ ] Charts are client components with loading skeletons
- [ ] Quick actions open slide-over modals (no full page navigation)
- [ ] Dashboard loads in < 1s on Vercel edge

---

# Task 06 — Projects Module

## Route: `/projects`

## Features
- Table view with sortable columns: Title, Client, Category, Status, Shoot Date, Price, Payment Status
- Status pipeline filter tabs: All | Inquiry | Booked | In Progress | Editing | Delivered | Completed
- Click row → slide-over detail panel (no full page nav)
- Detail panel shows: all project fields, linked shoots, linked finances, linked contract, notes
- Status badge with color coding per status
- Inline payment tracking: package price, amount paid, balance due, payment status

## Components
- `ProjectsTable` — virtualized for large lists
- `ProjectDetailPanel` — slide-over with tabs: Overview | Shoots | Finances | Contract
- `ProjectForm` — create/edit modal with all fields
- `StatusBadge` — color-coded per status value

---

# Task 07 — Clients Module

## Route: `/clients`

## Features
- Client list with search, filter by source
- Click client → detail page (full page, not slide-over)
- Detail page shows: contact info, linked projects, linked shoots, inquiry history, contract history
- "Convert inquiry" button on client detail if sourced from inquiry
- Source badge: website, email, instagram, referral, manual

---

# Task 08 — Shoots Module

## Route: `/shoots`

## Features
- List view with upcoming/past toggle
- Each shoot card: date/time, client, project link, location, duration, status
- Quick status update (scheduled → completed / cancelled)
- Create shoot from Projects module OR standalone

---

# Task 09 — Finances Module

## Route: `/finances`

## Features
- Transactions table: date, type (income/expense), category, amount, project link, payment method
- Summary bar: Total Income | Total Expenses | Net Profit | for selected period
- Period filter: This Month | Last Month | This Quarter | This Year | Custom
- Add income / add expense modals
- Color coded: income = green, expense = red
- Recharts bar chart: income vs expenses by month

## Acceptance Criteria (all core modules 05–09)
- [ ] All data fetched server-side via RSC
- [ ] Mutations via Server Actions only
- [ ] Loading skeletons on all data-dependent views
- [ ] Empty states with clear CTAs
- [ ] Mobile responsive layouts

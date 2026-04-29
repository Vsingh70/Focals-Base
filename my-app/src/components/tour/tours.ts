import type { TourConfig } from './types';

export const dashboardTour: TourConfig = {
  id: 'dashboard',
  steps: [
    {
      target: null,
      title: 'Welcome to your business cockpit',
      body: 'Quick orientation — the dashboard is where you start every day. KPI cards up top, charts below, upcoming projects and recent projects in the lower half. Most numbers are clickable and link to the full module.',
      placement: 'center',
    },
    {
      target: '[data-tour="kpi-row"]',
      title: 'Key numbers, all at once',
      body: 'Revenue this month (with last-month delta), active projects, upcoming projects in the next 7 days, and outstanding payments. Click any card to jump into its module.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="charts-row"]',
      title: 'Trend at a glance',
      body: 'Income vs. expenses for the last 6 months, plus your project pipeline by status. With no data yet they show empty states — start booking projects and they fill in automatically.',
      placement: 'top',
    },
    {
      target: '[data-tour="quick-actions"]',
      title: 'Fast actions',
      body: 'Create a project or client without leaving this page (slide-overs, no full nav). Log expense and new inquiry jump to their respective modules. Use these heavily.',
      placement: 'left',
    },
  ],
};

export const inboxTour: TourConfig = {
  id: 'inbox',
  steps: [
    {
      target: null,
      title: 'One inbox for every lead',
      body: 'Inquiries from your website widget, connected email/Resend webhooks, Zapier flows, and manual entries all converge here.',
      placement: 'center',
    },
    {
      target: '[data-tour="inbox-filters"]',
      title: 'Filter by status',
      body: 'New, Read, Replied, Converted, Archived. Clicking an inquiry auto-marks it Read. Use the source badges to tell where each lead came from.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="inbox-manual"]',
      title: 'Capture leads anywhere',
      body: 'Got a DM, phone call, or referral? Click + Manual Entry to log it. Same row format as automated inquiries — it all flows the same way.',
      placement: 'left',
    },
    {
      target: null,
      title: 'Convert when you book',
      body: 'Open any inquiry and click Convert to Client (or Convert to Client + Project). It creates the linked rows automatically and marks the inquiry converted, so nothing falls through the cracks.',
      placement: 'center',
    },
  ],
};

export const calendarTour: TourConfig = {
  id: 'calendar',
  steps: [
    {
      target: null,
      title: 'Your project calendar',
      body: 'Every project with a scheduled shoot date, viewable as month / week / day / agenda. Click an empty slot to add a project pre-filled with that date — no separate "add" page.',
      placement: 'center',
    },
    {
      target: '[data-tour="calendar-grid"]',
      title: 'Fast scheduling',
      body: 'Click any event to edit. Status colors: green = delivered/completed, accent = booked, orange = in-progress/editing, red = cancelled. The Calendar UI is the easiest place to manage your schedule day-to-day.',
      placement: 'top',
    },
    {
      target: '[data-tour="calendar-sync"]',
      title: 'Subscribe from Apple / Google Calendar',
      body: 'Add to Apple Calendar opens the webcal:// subscription. Add to Google Calendar deep-links to Google\'s subscribe-by-URL flow. Regenerating the URL invalidates any old subscription — useful if you accidentally share it.',
      placement: 'top',
    },
  ],
};

export const projectsTour: TourConfig = {
  id: 'projects',
  steps: [
    {
      target: null,
      title: 'Your booking pipeline',
      body: 'Every photography engagement lives here, from initial inquiry through delivery. Status flows left → right and you can filter by stage.',
      placement: 'center',
    },
    {
      target: '[data-tour="projects-pipeline"]',
      title: 'Pipeline filter tabs',
      body: 'All, Inquiry, Booked, In progress, Editing, Delivered, Completed, Cancelled. Each tab shows a count. Useful for end-of-week status reviews — flip to "Editing" and see exactly what\'s on your plate.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="projects-table"]',
      title: 'Sortable table',
      body: 'Click column headers to sort. Click a row to open the edit slide-over. Track package price, amount paid, and payment status inline — they roll up to the Dashboard\'s Pending Payments KPI.',
      placement: 'top',
    },
  ],
};

export const clientsTour: TourConfig = {
  id: 'clients',
  steps: [
    {
      target: null,
      title: 'Your CRM',
      body: 'Every client you\'ve worked with or talked to. Each one has a detail page showing all linked projects, inquiries, and contracts.',
      placement: 'center',
    },
    {
      target: '[data-tour="clients-search"]',
      title: 'Search and filter',
      body: 'Type to search by name, email, or phone. Click a source filter (inquiry, referral, instagram, website, manual) to slice your list by origin — useful for tracking where your best leads come from.',
      placement: 'bottom',
    },
    {
      target: null,
      title: 'Detail pages',
      body: 'Click any client → full page with their contact info AND every project, inquiry, and contract you have with them. Best place to prep for a returning-client meeting.',
      placement: 'center',
    },
  ],
};

export const financesTour: TourConfig = {
  id: 'finances',
  steps: [
    {
      target: null,
      title: 'Income, expenses, and net',
      body: 'Every transaction in one table, with a 6-month bar chart showing trends. Period filter scopes the totals at the top; the chart always shows the rolling 6 months.',
      placement: 'center',
    },
    {
      target: '[data-tour="finances-period"]',
      title: 'Period filter',
      body: 'Switch between This month, Last month, This quarter, This year, or All time. The summary bar (Income / Expenses / Net profit) and the table both filter together.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="finances-add"]',
      title: 'Log income or expense',
      body: 'Hit + Income (green) or + Expense (red). Link the transaction to a project to roll it up into per-project P&L later.',
      placement: 'left',
    },
  ],
};

export const contractsTour: TourConfig = {
  id: 'contracts',
  steps: [
    {
      target: null,
      title: 'Templates and signed agreements',
      body: 'A starter template was created for you on first visit. Build a contract from any template, link it to a project + client, and the merge tags auto-fill from your data.',
      placement: 'center',
    },
    {
      target: '[data-tour="contracts-actions"]',
      title: 'Templates vs. contracts',
      body: 'Click Templates to manage your reusable starter texts. Click + New contract to create an instance for a specific project — the body fills in from your project + client data.',
      placement: 'bottom',
    },
    {
      target: null,
      title: 'PDF export and status tracking',
      body: 'Each contract moves through draft → sent → signed → void. Each stage stamps a timestamp. The Export PDF button gives you a clean letterhead-style doc to send to your client.',
      placement: 'center',
    },
  ],
};

export const gearTour: TourConfig = {
  id: 'gear',
  steps: [
    {
      target: null,
      title: 'Track your kit',
      body: 'Cameras, lenses, lighting, audio, bags, anything. Mark items as owned, wishlist, sold, or rented.',
      placement: 'center',
    },
    {
      target: '[data-tour="gear-total"]',
      title: 'Total value',
      body: 'The header shows the sum of `purchase_price` across all owned items. Useful for insurance and tax-prep conversations. Wishlist items don\'t count.',
      placement: 'bottom',
    },
  ],
};

export const linksTour: TourConfig = {
  id: 'links',
  steps: [
    {
      target: null,
      title: 'Bookmark inspiration and references',
      body: 'A categorized URL drawer. Inspiration, client links, references, tools, tutorials. Each card shows the favicon and hostname.',
      placement: 'center',
    },
  ],
};

export const formsTour: TourConfig = {
  id: 'forms',
  steps: [
    {
      target: null,
      title: 'Build custom field schemas',
      body: 'Define forms with system fields (name, date, category, pay, expenses) plus up to 10 custom fields. Drag the handle to reorder.',
      placement: 'center',
    },
    {
      target: null,
      title: 'Hover-preview fields',
      body: 'Mark up to 3 custom fields as "preview" — those will show inline on row hover wherever forms are surfaced. Use it for the most-glanceable fields.',
      placement: 'center',
    },
  ],
};

export const settingsTour: TourConfig = {
  id: 'settings',
  steps: [
    {
      target: null,
      title: 'Your profile and integrations',
      body: 'Profile (your business identity), Integrations (inquiry sources, calendar sync, future), Appearance (theme + accent), Account (sign out, delete).',
      placement: 'center',
    },
    {
      target: '[data-tour="settings-integrations"]',
      title: 'Connect external systems',
      body: 'Inquiry sources expose a webhook URL you can paste into Resend, Zapier, Typeform, or anything else that POSTs JSON. Each source has its own token, so you can revoke individually.',
      placement: 'top',
    },
  ],
};

export const TOURS: Record<string, TourConfig> = {
  dashboard: dashboardTour,
  inbox: inboxTour,
  calendar: calendarTour,
  projects: projectsTour,
  clients: clientsTour,
  finances: financesTour,
  contracts: contractsTour,
  gear: gearTour,
  links: linksTour,
  forms: formsTour,
  settings: settingsTour,
};

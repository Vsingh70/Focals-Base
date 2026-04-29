import type { TourId } from '@/lib/tour/ids';

export type HelpSection = {
  heading: string;
  body: string;
};

export type HelpEntry = {
  slug: TourId;
  title: string;
  summary: string;
  sections: HelpSection[];
};

export const HELP_ENTRIES: HelpEntry[] = [
  {
    slug: 'dashboard',
    title: 'Dashboard',
    summary: 'Your business at a glance — KPIs, charts, upcoming work, and quick actions.',
    sections: [
      {
        heading: 'What it is',
        body: 'The dashboard is the page you should open every morning. The four KPI cards along the top give you a one-second read of where the business is: revenue this month vs. last month, how many active projects you have, projects scheduled in the next week, and outstanding payments. Each card links to the module that drives it.',
      },
      {
        heading: 'How to use it',
        body: 'Use Quick actions on the right to create a new project or client without navigating away — they open as slide-overs. Log expense and New inquiry jump to those modules. The revenue chart shows income vs. expenses over the last 6 months; the donut shows your project pipeline by status. Both render empty states until you have data.',
      },
      {
        heading: 'Best practices',
        body: 'Spend 30 seconds here at the start of each day. If pending payments is non-zero, follow up on those projects today. If active projects is climbing past your comfort capacity, pause taking new bookings. Use the upcoming-projects strip to triage your week — click any card to open the project detail.',
      },
    ],
  },
  {
    slug: 'inbox',
    title: 'Inbox',
    summary: 'Every lead in one place — website widget, email integrations, manual entries.',
    sections: [
      {
        heading: 'What it is',
        body: 'A unified inbox for all incoming inquiries. Sources include the embeddable widget you can paste on your website, webhooks from Resend / Zapier / Typeform / any service that POSTs JSON, and manual entries you log when leads come via DM or phone call. Each row shows source, status, name, and a snippet of the message.',
      },
      {
        heading: 'How to use it',
        body: 'Filter by status (New / Read / Replied / Converted / Archived). Click any inquiry to see the full slide-over and auto-mark it as Read. From the slide-over you can mark Replied, Archive, or Convert. Convert to Client creates a clients row pre-filled from the inquiry; Convert to Client + Project also creates a projects row linked to that new client.',
      },
      {
        heading: 'Best practices',
        body: 'Triage daily — click each new inquiry, then either Convert it (if you decide to book), Mark replied (if you sent a quote), or Archive (if not a fit). Inquiries left in New for too long usually mean a lost lead. The "New" tab\'s count badge tells you what needs attention.',
      },
      {
        heading: 'Connecting external sources',
        body: 'Go to Settings → Integrations → Inquiry sources → New inquiry source. Each source gets a unique webhook URL and token. Paste the URL into Resend\'s inbound parse rule, a Zapier "POST to webhook" action, a Typeform webhook, etc. The endpoint accepts the embeddable widget shape, Resend\'s inbound-email payload, or generic JSON with name/email/message.',
      },
    ],
  },
  {
    slug: 'calendar',
    title: 'Calendar',
    summary: 'Visual calendar of every scheduled project, plus subscribable feed for Apple/Google Calendar.',
    sections: [
      {
        heading: 'What it is',
        body: 'A month / week / day / agenda view of every scheduled shoot. Events are color-coded by status. Click an empty date to add a shoot pre-filled with that date — no separate form page.',
      },
      {
        heading: 'How to use it',
        body: 'Click any event to edit it (slide-over with all fields). Click any empty cell to create a new shoot. Switch between Month / Week / Day / Agenda using the toolbar. The Subscribe card below the calendar exposes a unique iCal feed URL — click "Add to Apple Calendar" or "Add to Google Calendar" to subscribe. Events sync automatically; calendar apps refresh every 5–60 minutes.',
      },
      {
        heading: 'Best practices',
        body: 'Add to your phone\'s calendar so you see scheduled projects alongside personal events. If the feed URL leaks (you accidentally pasted it somewhere public), click Regenerate URL and any old subscriber stops working. Cancelled projects are excluded from the feed automatically — you can keep cancelled records without cluttering your day-of view.',
      },
    ],
  },
  {
    slug: 'projects',
    title: 'Projects',
    summary: 'Pipeline view of every booking from inquiry through delivered.',
    sections: [
      {
        heading: 'What it is',
        body: 'Each row is one engagement: a wedding, a portrait session, an editorial shoot. Status flows left → right: inquiry → booked → in_progress → editing → delivered → completed. Cancelled is a terminal state branching off any earlier stage.',
      },
      {
        heading: 'How to use it',
        body: 'Click pipeline tabs to filter by stage. Click column headers to sort (title, status, shoot date, price). Click any row to open the edit slide-over with all fields including payment tracking (package price, amount paid, payment status). Edits revalidate the dashboard\'s Pending Payments KPI automatically.',
      },
      {
        heading: 'Best practices',
        body: 'Update status as you go — moving a project to "Editing" the day you start culling photos keeps the pipeline accurate. Use the payment fields religiously: package price + amount paid drives Pending Payments, which is one of the four dashboard KPIs. Link projects to clients (via the client_id field in the form) so they show up on the client\'s detail page.',
      },
    ],
  },
  {
    slug: 'clients',
    title: 'Clients',
    summary: 'Your CRM — everyone you\'ve worked with or talked to.',
    sections: [
      {
        heading: 'What it is',
        body: 'A searchable list of clients with full contact info, source attribution (where the lead came from), and a per-client detail page showing every project, shoot, inquiry, and contract you have with them.',
      },
      {
        heading: 'How to use it',
        body: 'Search by name, email, or phone in the header. Filter by source (inquiry / referral / instagram / website / manual) to see where your leads come from. Click any client → full detail page (not a slide-over, since you typically need more space to review history). From the detail page, click Edit to update info or Delete to remove (linked records persist with their client_id set to NULL).',
      },
      {
        heading: 'Best practices',
        body: 'Always set a Source — the breakdown reveals which channels actually book vs. just generate noise. Use the detail page before a returning-client meeting: 30 seconds reviewing past projects and contracts beats trying to recall everything. Consolidate duplicates aggressively — if a client emails from one address and books a project from another, edit the existing record rather than creating a new one.',
      },
    ],
  },
  {
    slug: 'finances',
    title: 'Finances',
    summary: 'Income, expenses, and net profit by period — with a 6-month chart.',
    sections: [
      {
        heading: 'What it is',
        body: 'A single transactions table with period filtering (This month / Last month / This quarter / This year / All time). Above it: a summary bar showing Income / Expenses / Net for the selected period. Above that: a 6-month bar chart that always shows rolling history regardless of the period filter.',
      },
      {
        heading: 'How to use it',
        body: 'Click + Income (green) or + Expense (red) to log a transaction. Link transactions to projects when relevant — that lets you compute per-project P&L later. Categories help you group expenses for tax-prep season (gear, software, travel, misc).',
      },
      {
        heading: 'Best practices',
        body: 'Log transactions as they happen, not in batches at month-end — you\'ll forget category and project context. Use the same category names consistently so your year-end totals are clean. The 6-month chart is the easiest visual for spotting seasonal patterns: if April is consistently quiet, you can plan downtime or marketing pushes accordingly.',
      },
    ],
  },
  {
    slug: 'contracts',
    title: 'Contracts',
    summary: 'Reusable templates with merge tags, plus PDF export.',
    sections: [
      {
        heading: 'What it is',
        body: 'A two-level system: templates (reusable text with {{merge_tags}} like {{client_name}} and {{package_price}}) and contracts (instances created from a template, linked to a specific project + client, with merge tags resolved at creation time). The default "Photography session agreement" template is auto-created on first visit.',
      },
      {
        heading: 'How to use it',
        body: 'Click Templates to manage your reusable starter texts. The merge-tag chips above the body let you click to insert a token at the cursor position. Click + New contract to create an instance: pick a template + project + client, optionally add custom fields (key/value pairs that become extra merge tags), preview the rendered body, then save. The contract\'s body is frozen at save time — edits to the source template don\'t retroactively change existing contracts.',
      },
      {
        heading: 'Best practices',
        body: 'Build one good template per common engagement type (portrait, wedding, commercial). The merge tag system means you fill in fields once on the project, then every contract reuses them. Always Mark as sent the day you send so the timestamp is accurate. Export PDF for the final signature copy — the formatted PDF includes your business name as letterhead. Status flow: draft → sent → signed.',
      },
    ],
  },
  {
    slug: 'gear',
    title: 'Gear',
    summary: 'Track your kit — owned, wishlist, sold, rented.',
    sections: [
      {
        heading: 'What it is',
        body: 'A grid of every piece of equipment, with category icons and status badges. Each item tracks brand, model, serial number, purchase price and date, and notes.',
      },
      {
        heading: 'How to use it',
        body: 'Filter by category or status using the chips. The header shows total value (sum of purchase_price across owned items only — wishlist items don\'t count). Use Wishlist status for things you\'re thinking about; mark them Owned when you actually buy. Mark items Sold when you offload.',
      },
      {
        heading: 'Best practices',
        body: 'Record serial numbers — your insurance company will thank you. Update purchase price (or pull from the receipt) so the total value is accurate. Use Sold rather than deleting — keeps tax history clean.',
      },
    ],
  },
  {
    slug: 'links',
    title: 'Links',
    summary: 'Categorized URL bookmarks — inspiration, references, tools.',
    sections: [
      {
        heading: 'What it is',
        body: 'A simple link drawer organized by category. Each card shows the favicon and hostname for quick visual scanning.',
      },
      {
        heading: 'How to use it',
        body: 'Add links via + Add link. Click a card title to open the URL in a new tab. Click ⋯ to edit or delete. Filter by category via the chips at the top.',
      },
      {
        heading: 'Best practices',
        body: 'Use it as a curated working set rather than a dumping ground. If a category gets unwieldy, split it. The Tools category is great for "things I open once a quarter" so you stop re-Googling them.',
      },
    ],
  },
  {
    slug: 'forms',
    title: 'Forms',
    summary: 'Define custom field schemas with drag-to-reorder and hover previews.',
    sections: [
      {
        heading: 'What it is',
        body: 'A form builder for defining custom fields beyond the system fields (name, date, category, pay, expenses). System fields are always present and locked. You can add up to 10 custom fields per form, each with a type (text / date / currency / contact / checkbox), a Required toggle, and a Hover preview toggle.',
      },
      {
        heading: 'How to use it',
        body: 'Click + New form to create. Add custom fields with + Add custom field. Drag the handle on the left to reorder. Required forces the field to be filled in submissions. Hover preview marks up to 3 fields that show inline on row hover (wherever forms are surfaced — coming as we add form-driven UIs across modules).',
      },
      {
        heading: 'Best practices',
        body: 'Keep custom fields focused — defining fields you never use creates noise. Save your most-glanceable info as hover previews. If you find yourself defining the same fields across multiple forms, those probably belong as system fields and should be requested as a feature.',
      },
    ],
  },
  {
    slug: 'settings',
    title: 'Settings',
    summary: 'Profile, integrations, appearance, and account.',
    sections: [
      {
        heading: 'What it is',
        body: 'A single page with four anchored sections: Profile (your business identity, used in contracts and exports), Integrations (inquiry sources, calendar sync, future integrations), Appearance (theme + accent color), and Account (sign out, delete).',
      },
      {
        heading: 'How to use it',
        body: 'Profile updates immediately persist to your profiles row. Integrations → Inquiry sources is where you generate webhook URLs to paste into Resend / Zapier / Typeform / etc. Appearance changes apply instantly and persist to localStorage in your browser. Account → Delete account is destructive — it cascades through every owned table.',
      },
      {
        heading: 'Best practices',
        body: 'Set business_name and full_name early — both feed the contract PDF letterhead. Use a different inquiry source per intake channel so you can revoke individually if a token leaks. Pick an accent color that makes the dashboard feel like yours — small thing, big psychological lift after a couple weeks.',
      },
    ],
  },
];

export function getHelpEntry(slug: string): HelpEntry | undefined {
  return HELP_ENTRIES.find((h) => h.slug === slug);
}

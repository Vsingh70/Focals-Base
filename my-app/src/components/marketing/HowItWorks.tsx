'use client';

/**
 * The "how it works" scroll-through sections for both landing pages.
 * Client component because Scrollytelling chapters carry render() functions,
 * which can't cross the server→client boundary from the page files.
 */
import { Scrollytelling, type ScrollyChapter } from './Scrollytelling';
import { BrowserFrame, PhoneFrame } from './frames';
import { MockDetail, MockFinances, MockProjects } from './mocks-phone';
import { WebClients, WebDashboard, WebFinances } from './mocks-web';

const IOS_CHAPTERS: ScrollyChapter[] = [
  {
    eyebrow: 'Projects',
    title: 'Your pipeline, grouped.',
    body: 'Every shoot lands in a status pipeline — Inquiries, Upcoming, In progress, Delivered. No more scrolling one endless list to find what needs you today.',
    points: [
      'Cards show client, balance, and shoot date at a glance',
      'Search and filter by phase in a tap',
    ],
    render: () => (
      <PhoneFrame width={300} glow={false}>
        <MockProjects />
      </PhoneFrame>
    ),
  },
  {
    eyebrow: 'A project, in full',
    title: 'Open one. See everything.',
    body: 'Tap a project and the whole story is right there — a summary of the shoot, the balance owed, and how much is paid, before a single scroll.',
    points: [
      'Shoot · Balance · Paid, surfaced up top',
      'Payment, details, location, and notes below',
    ],
    render: () => (
      <PhoneFrame width={300} glow={false}>
        <MockDetail />
      </PhoneFrame>
    ),
  },
  {
    eyebrow: 'Finances',
    title: 'Know your numbers.',
    body: 'Revenue, outstanding balances, and every transaction — tracked as you book and deliver. The spreadsheet retires for good.',
    points: [
      'Month-over-month revenue at a glance',
      'Outstanding invoices you can chase in one tap',
    ],
    render: () => (
      <PhoneFrame width={300} glow={false}>
        <MockFinances />
      </PhoneFrame>
    ),
  },
];

const WEB_CHAPTERS: ScrollyChapter[] = [
  {
    eyebrow: 'Projects',
    title: 'The whole pipeline, on one canvas.',
    body: 'A desk-sized view of every shoot — sortable, searchable, grouped by status. See what’s booked, in progress, and delivered without tapping through screens.',
    points: [
      'Sort and scan dozens of projects at once',
      'Status, shoot date, and balance in every row',
    ],
    render: () => (
      <BrowserFrame height={400} glow={false} url="app.lenslate.com/projects">
        <WebDashboard />
      </BrowserFrame>
    ),
  },
  {
    eyebrow: 'Clients',
    title: 'Every client, every history.',
    body: 'Lifetime value, project count, and last shoot at a glance. The relationships that built your studio, finally organized.',
    points: [
      'One profile links every shoot, invoice, and contract',
      'Find any client in a keystroke',
    ],
    render: () => (
      <BrowserFrame height={400} glow={false} url="app.lenslate.com/clients">
        <WebClients />
      </BrowserFrame>
    ),
  },
  {
    eyebrow: 'Finances',
    title: 'The numbers, in full view.',
    body: 'Revenue, outstanding balances, and what’s booked ahead — charted and current. Export-ready when your accountant asks.',
    points: [
      'Month-over-month revenue and forecasting',
      'Chase outstanding invoices in a click',
    ],
    render: () => (
      <BrowserFrame height={400} glow={false} url="app.lenslate.com/finances">
        <WebFinances />
      </BrowserFrame>
    ),
  },
];

export function HowItWorksIos() {
  return <Scrollytelling side="right" deviceWidth={300} chapters={IOS_CHAPTERS} />;
}

export function HowItWorksWeb() {
  return (
    <Scrollytelling side="left" deviceWidth="min(46vw, 500px)" chapters={WEB_CHAPTERS} />
  );
}

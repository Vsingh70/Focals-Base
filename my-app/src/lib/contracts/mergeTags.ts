import type { Database } from '@/lib/supabase/types';

type Client = Database['public']['Tables']['clients']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export type MergeTagKey =
  | 'client_name'
  | 'client_email'
  | 'client_phone'
  | 'shoot_date'
  | 'shoot_location'
  | 'package_price'
  | 'photographer_name'
  | 'business_name'
  | 'contract_date'
  | 'project_title'
  | 'balance_due';

export const MERGE_TAG_KEYS: readonly MergeTagKey[] = [
  'client_name',
  'client_email',
  'client_phone',
  'project_title',
  'shoot_date',
  'shoot_location',
  'package_price',
  'balance_due',
  'photographer_name',
  'business_name',
  'contract_date',
];

export const MERGE_TAG_DESCRIPTIONS: Record<MergeTagKey, string> = {
  client_name: 'Client name',
  client_email: 'Client email',
  client_phone: 'Client phone',
  project_title: 'Project title',
  shoot_date: 'Shoot date',
  shoot_location: 'Shoot location',
  package_price: 'Package price',
  balance_due: 'Balance due (price − paid)',
  photographer_name: 'Your full name',
  business_name: 'Business name',
  contract_date: 'Today (contract creation date)',
};

const TAG_REGEX = /\{\{([a-zA-Z0-9_]+)\}\}/g;

function formatCurrency(n: number | null | undefined): string {
  if (n == null) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(d: string | Date | null | undefined): string {
  if (!d) return '';
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export type MergeContext = {
  client: Client;
  project: Project;
  profile: Profile;
  customFields?: Record<string, string>;
};

export function buildMergeValues(ctx: MergeContext): Record<string, string> {
  const { client, project, profile, customFields = {} } = ctx;
  const balance =
    project.package_price != null
      ? (project.package_price ?? 0) - (project.amount_paid ?? 0)
      : null;

  const values: Record<MergeTagKey, string> = {
    client_name: client.full_name ?? '',
    client_email: client.email ?? '',
    client_phone: client.phone ?? '',
    project_title: project.title ?? '',
    shoot_date: formatDate(project.shoot_date),
    shoot_location: project.location ?? '',
    package_price: formatCurrency(project.package_price),
    balance_due: formatCurrency(balance),
    photographer_name: profile.full_name ?? '',
    business_name: profile.business_name ?? '',
    contract_date: formatDate(new Date()),
  };

  return { ...values, ...customFields };
}

export function renderTemplate(body: string, values: Record<string, string>): string {
  return body.replace(TAG_REGEX, (match, tag) => {
    if (tag in values) return values[tag];
    return match; // leave unknown tags intact so validation can flag them
  });
}

export function extractTags(body: string): string[] {
  const set = new Set<string>();
  for (const m of body.matchAll(TAG_REGEX)) {
    set.add(m[1]);
  }
  return Array.from(set);
}

export function findUnreplacedTags(rendered: string): string[] {
  return extractTags(rendered);
}

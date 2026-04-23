import { Badge } from '@/components/ui/Badge';

const sourceLabels: Record<string, string> = {
  website_form: 'website',
  email: 'email',
  instagram: 'instagram',
  manual: 'manual',
};

export function SourceBadge({ source }: { source: string }) {
  return <Badge tone="neutral">{sourceLabels[source] ?? source}</Badge>;
}

const statusToneMap = {
  new: 'accent',
  read: 'neutral',
  replied: 'warning',
  converted: 'success',
  archived: 'neutral',
} as const;

type StatusKey = keyof typeof statusToneMap;

export function InquiryStatusBadge({ status }: { status: string }) {
  const tone = statusToneMap[status as StatusKey] ?? 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
}

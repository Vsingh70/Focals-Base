import { Badge } from '@/components/ui/Badge';

const toneMap = {
  draft: 'neutral',
  sent: 'accent',
  signed: 'success',
  void: 'danger',
} as const;

type ContractStatus = keyof typeof toneMap;

export function ContractStatusBadge({ status }: { status: string | null }) {
  const key = (status as ContractStatus) in toneMap ? (status as ContractStatus) : 'draft';
  return <Badge tone={toneMap[key]}>{key}</Badge>;
}

import { Badge } from '@/components/ui/badge'
import type { ContractStatus } from '@/types/database'

const STATUS_CONFIG: Record<ContractStatus, { label: string; variant: 'secondary' | 'accent' | 'success' | 'destructive' }> = {
  pending: { label: 'Pendente', variant: 'secondary' },
  accepted: { label: 'Aceito', variant: 'accent' },
  in_progress: { label: 'Em andamento', variant: 'accent' },
  awaiting_confirmation: { label: 'Aguardando confirmação', variant: 'accent' },
  completed: { label: 'Concluído', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'destructive' },
}

export function ContractStatusBadge({ status }: { status: ContractStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

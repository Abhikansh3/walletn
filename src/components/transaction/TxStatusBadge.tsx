'use client'

import type { TxStatus } from '@/types'

const STATUS_CONFIG: Record<
  TxStatus,
  { label: string; color: string; dot: string; animate?: boolean }
> = {
  idle: { label: 'Idle', color: 'text-zinc-500', dot: 'bg-zinc-600' },
  building: { label: 'Building', color: 'text-blue-400', dot: 'bg-blue-400', animate: true },
  signing: { label: 'Signing', color: 'text-yellow-400', dot: 'bg-yellow-400', animate: true },
  pending: { label: 'Pending', color: 'text-orange-400', dot: 'bg-orange-400', animate: true },
  confirming: { label: 'Confirming', color: 'text-blue-400', dot: 'bg-blue-400', animate: true },
  confirmed: { label: 'Confirmed', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  failed: { label: 'Failed', color: 'text-red-400', dot: 'bg-red-400' },
  cancelled: { label: 'Cancelled', color: 'text-zinc-400', dot: 'bg-zinc-500' },
  replaced: { label: 'Replaced', color: 'text-purple-400', dot: 'bg-purple-400' },
}

interface TxStatusBadgeProps {
  status: TxStatus
  compact?: boolean
}

export function TxStatusBadge({ status, compact = false }: TxStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]

  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        'border border-current/20 bg-current/10',
        cfg.color,
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 flex-shrink-0 rounded-full',
          cfg.dot,
          cfg.animate ? 'animate-pulse' : '',
        ].join(' ')}
      />
      {!compact && cfg.label}
    </span>
  )
}

'use client'

import type { GasTier } from '@/types'
import { useGasEstimation } from '@/hooks/useGasEstimation'

const TIER_LABELS: Record<GasTier, { label: string; emoji: string; time: string }> = {
  slow: { label: 'Slow', emoji: '🐢', time: '~5 min' },
  standard: { label: 'Standard', emoji: '⚖️', time: '~1 min' },
  fast: { label: 'Fast', emoji: '🚀', time: '~15 sec' },
  urgent: { label: 'Urgent', emoji: '⚡', time: '~5 sec' },
}

const TIERS: GasTier[] = ['slow', 'standard', 'fast', 'urgent']

interface GasSelectorProps {
  value: GasTier
  onChange: (tier: GasTier) => void
}

export function GasSelector({ value, onChange }: GasSelectorProps) {
  const { formatted, isLoading } = useGasEstimation()

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-300">Gas Speed</span>
        {isLoading && (
          <span className="text-xs text-zinc-500">Updating…</span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {TIERS.map((tier) => {
          const meta = TIER_LABELS[tier]
          const fee = formatted?.[tier]
          const isSelected = value === tier
          return (
            <button
              key={tier}
              onClick={() => onChange(tier)}
              className={[
                'flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center transition',
                isSelected
                  ? 'border-indigo-500 bg-indigo-950 text-white'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200',
              ].join(' ')}
            >
              <span className="text-lg leading-none">{meta.emoji}</span>
              <span className="text-xs font-semibold">{meta.label}</span>
              {fee ? (
                <span className="text-[10px] leading-tight text-zinc-400">
                  {fee.maxFee} Gwei
                </span>
              ) : (
                <span className="text-[10px] text-zinc-600">—</span>
              )}
              <span className="text-[10px] text-zinc-500">{meta.time}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { Address, Hex } from 'viem'
import { isAddress } from 'viem'
import { useTxManager } from '@/hooks/useTxManager'
import { GasSelector } from './GasSelector'
import { TxStatusBadge } from './TxStatusBadge'
import type { GasTier } from '@/types'

export function TransactionPanel() {
  const { send, reset, txStatus, txError, pendingHash, isPending, gasEstimation } = useTxManager()

  const [to, setTo] = useState('')
  const [value, setValue] = useState('')
  const [data, setData] = useState('')
  const [label, setLabel] = useState('')
  const [gasTier, setGasTier] = useState<GasTier>('standard')
  const [formError, setFormError] = useState<string | null>(null)

  const handleSend = async () => {
    setFormError(null)

    if (!to || !isAddress(to)) {
      setFormError('Invalid recipient address')
      return
    }

    let valueWei: bigint
    try {
      valueWei = BigInt(Math.round(parseFloat(value || '0') * 1e18))
    } catch {
      setFormError('Invalid ETH amount')
      return
    }

    let hexData: Hex | undefined
    if (data.trim()) {
      if (!/^0x[0-9a-fA-F]*$/.test(data.trim())) {
        setFormError('Calldata must be hex (0x…)')
        return
      }
      hexData = data.trim() as Hex
    }

    await send({
      to: to as Address,
      value: valueWei,
      data: hexData,
      label: label || undefined,
      gasTier,
    })
  }

  const isActive = txStatus !== 'idle' && txStatus !== 'confirmed' && txStatus !== 'failed' && txStatus !== 'cancelled'

  return (
    <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Send Transaction</h2>
        {txStatus !== 'idle' && <TxStatusBadge status={txStatus} />}
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Recipient Address *
          </label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="0x…"
            disabled={isPending}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Amount (ETH)
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0.0"
            min="0"
            step="0.001"
            disabled={isPending}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Calldata (optional)
          </label>
          <input
            type="text"
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder="0x…"
            disabled={isPending}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Label (optional)
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Swap ETH → USDC"
            disabled={isPending}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-indigo-500 disabled:opacity-50"
          />
        </div>
      </div>

      <GasSelector value={gasTier} onChange={setGasTier} />

      {(formError ?? txError) && (
        <div className="rounded-lg border border-red-800 bg-red-950 px-4 py-2.5 text-sm text-red-300">
          {formError ?? txError}
        </div>
      )}

      {txStatus === 'confirmed' && pendingHash && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950 px-4 py-2.5 text-sm text-emerald-300">
          Transaction confirmed!{' '}
          <span className="font-mono">{pendingHash.slice(0, 10)}…</span>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleSend}
          disabled={isPending || !to}
          className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {txStatus === 'signing' ? 'Awaiting signature…' : txStatus === 'building' ? 'Building…' : 'Pending…'}
            </span>
          ) : (
            'Send'
          )}
        </button>

        {(txStatus === 'confirmed' || txStatus === 'failed' || txStatus === 'cancelled') && (
          <button
            onClick={reset}
            className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

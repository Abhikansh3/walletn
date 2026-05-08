'use client'

import type { TxRecord } from '@/types'
import { TxStatusBadge } from './TxStatusBadge'
import { formatTxHash, shortenAddress } from '@/lib/tx'
import { getNetworkConfig } from '@/lib/chains'
import { formatEther } from 'viem'
import { useTxReplacement } from '@/hooks/useTxReplacement'

interface TxHistoryProps {
  records: TxRecord[]
}

export function TxHistory({ records }: TxHistoryProps) {
  const { speedUp, cancel, isPending } = useTxReplacement()

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 py-10 text-center">
        <span className="text-2xl">📋</span>
        <p className="text-sm text-zinc-500">No transactions yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {records.map((tx) => {
        const network = getNetworkConfig(tx.chainId)
        const explorerBase = network?.blockExplorer ?? 'https://etherscan.io'
        const isPendingTx = tx.status === 'pending'
        const valueEth = parseFloat(formatEther(tx.value)).toFixed(5)

        return (
          <div
            key={tx.hash}
            className="flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TxStatusBadge status={tx.status} />
                {tx.label && (
                  <span className="text-sm font-medium text-white">{tx.label}</span>
                )}
              </div>
              <a
                href={`${explorerBase}/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-zinc-500 hover:text-indigo-400"
              >
                {formatTxHash(tx.hash)}↗
              </a>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
              {tx.to && (
                <span>
                  To: <span className="font-mono">{shortenAddress(tx.to)}</span>
                </span>
              )}
              <span>
                Value: <span className="text-zinc-300">{valueEth} ETH</span>
              </span>
              <span>
                Nonce: <span className="text-zinc-300">#{tx.nonce}</span>
              </span>
              <span className="ml-auto">
                {network?.shortName ?? tx.chainId}
              </span>
            </div>

            {isPendingTx && (
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => speedUp(tx.hash)}
                  disabled={isPending}
                  className="rounded-lg border border-blue-700 bg-blue-950 px-3 py-1 text-xs font-medium text-blue-300 transition hover:bg-blue-900 disabled:opacity-50"
                >
                  Speed Up
                </button>
                <button
                  onClick={() => cancel(tx.hash)}
                  disabled={isPending}
                  className="rounded-lg border border-red-800 bg-red-950 px-3 py-1 text-xs font-medium text-red-400 transition hover:bg-red-900 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

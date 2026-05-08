'use client'

import { useAccount, useBalance, useEnsName, useEnsAvatar } from 'wagmi'
import type { Address } from 'viem'
import { formatUnits } from 'viem'
import { shortenAddress } from '@/lib/tx'

export function AccountInfo() {
  const { address, status, connector } = useAccount()

  const { data: balance } = useBalance({
    address: address as Address | undefined,
    query: { enabled: !!address },
  })

  const { data: ensName } = useEnsName({
    address: address as Address | undefined,
    query: { enabled: !!address },
  })

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
    query: { enabled: !!ensName },
  })

  if (status !== 'connected' || !address) return null

  const displayName = ensName ?? shortenAddress(address as Address)
  const displayBalance = balance
    ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
    : '—'

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
      {ensAvatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={ensAvatar} alt={displayName} className="h-8 w-8 rounded-full" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
          {address.slice(2, 4).toUpperCase()}
        </div>
      )}
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-white">{displayName}</span>
        <span className="text-xs text-zinc-400">{displayBalance}</span>
      </div>
      {connector && (
        <span className="ml-auto rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
          {connector.name}
        </span>
      )}
    </div>
  )
}

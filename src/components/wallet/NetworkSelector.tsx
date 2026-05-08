'use client'

import { useChainId, useSwitchChain, useChains } from 'wagmi'
import { useState } from 'react'
import { getNetworkConfig } from '@/lib/chains'

export function NetworkSelector() {
  const chainId = useChainId()
  const chains = useChains()
  const { switchChain, isPending } = useSwitchChain()
  const [open, setOpen] = useState(false)

  const current = getNetworkConfig(chainId)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white transition hover:border-zinc-600 hover:bg-zinc-700 disabled:opacity-50"
        disabled={isPending}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: current?.color ?? '#888' }}
        />
        <span>{current?.shortName ?? 'Unknown'}</span>
        <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl">
            {chains.map((chain) => {
              const cfg = getNetworkConfig(chain.id)
              const isActive = chain.id === chainId
              return (
                <button
                  key={chain.id}
                  onClick={() => {
                    switchChain({ chainId: chain.id })
                    setOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-zinc-800 disabled:opacity-50"
                  disabled={isPending || isActive}
                >
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: cfg?.color ?? '#888' }}
                  />
                  <span className={isActive ? 'font-semibold text-white' : 'text-zinc-300'}>
                    {chain.name}
                  </span>
                  {isActive && (
                    <svg className="ml-auto h-4 w-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8 15.414l-4.707-4.707a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

'use client'

import { WalletButton } from '@/components/wallet/WalletButton'
import { NetworkSelector } from '@/components/wallet/NetworkSelector'
import { useAccount } from 'wagmi'

export function Header() {
  const { status } = useAccount()
  const isConnected = status === 'connected'

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-800 bg-black/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">SwapRail</span>
          <span className="hidden rounded-md bg-indigo-950 px-2 py-0.5 text-xs font-medium text-indigo-300 sm:inline">
            Wallet Hub
          </span>
        </div>

        <div className="flex items-center gap-3">
          {isConnected && <NetworkSelector />}
          <WalletButton />
        </div>
      </div>
    </header>
  )
}

'use client'

import { useAccount } from 'wagmi'
import { AccountInfo } from '@/components/wallet/AccountInfo'
import { TransactionPanel } from '@/components/transaction/TransactionPanel'
import { TxHistory } from '@/components/transaction/TxHistory'
import { useTxManager } from '@/hooks/useTxManager'

function ConnectedDashboard() {
  const { history, gasEstimation } = useTxManager()

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <AccountInfo />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <TransactionPanel />

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
            <h2 className="text-lg font-semibold text-white">Gas Overview</h2>
            {gasEstimation.formatted ? (
              <div className="grid grid-cols-2 gap-3">
                {(['slow', 'standard', 'fast', 'urgent'] as const).map((tier) => {
                  const f = gasEstimation.formatted![tier]
                  return (
                    <div key={tier} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                      <div className="text-xs font-medium capitalize text-zinc-400">{tier}</div>
                      <div className="mt-1 text-sm font-semibold text-white">{f.maxFee} Gwei</div>
                      <div className="text-xs text-zinc-500">Priority: {f.priority} Gwei</div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">
                {gasEstimation.isLoading ? 'Loading gas prices…' : gasEstimation.error ?? 'Connect wallet to see gas prices'}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Transaction History</h2>
          <TxHistory records={history} />
        </div>
      </div>
    </div>
  )
}

function LandingHero() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-4 py-24 text-center sm:px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30">
        <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white">SwapRail Wallet Hub</h1>
        <p className="mt-3 text-lg text-zinc-400">
          Secure, multi-chain wallet integrations and transaction flows. Connect your wallet to get started.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {['MetaMask', 'WalletConnect', 'Coinbase Wallet', 'Rainbow'].map((w) => (
          <span
            key={w}
            className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-sm text-zinc-400"
          >
            {w}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {['Ethereum', 'Arbitrum', 'Polygon', 'BNB Chain', 'Optimism', 'Base'].map((c) => (
          <span
            key={c}
            className="rounded-full border border-indigo-800 bg-indigo-950 px-3 py-1 text-sm text-indigo-300"
          >
            {c}
          </span>
        ))}
      </div>
      <p className="text-sm text-zinc-600">
        Click <strong className="text-zinc-400">Connect Wallet</strong> in the top right to begin.
      </p>
    </div>
  )
}

export default function Home() {
  const { status } = useAccount()

  if (status === 'connected') {
    return <ConnectedDashboard />
  }

  return <LandingHero />
}

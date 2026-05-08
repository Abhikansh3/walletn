'use client'

import { useState, useCallback, useRef } from 'react'
import { useTransactionCount, usePublicClient, useChainId } from 'wagmi'
import { useConnection } from 'wagmi'
import type { Address, Hash } from 'viem'

interface PendingTx {
  nonce: number
  hash: Hash
  submittedAt: number
}

export function useNonceManager() {
  const { address } = useConnection()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const pendingRef = useRef<PendingTx[]>([])
  const [localNonce, setLocalNonce] = useState<number | null>(null)

  const { data: onchainNonce, refetch: refetchNonce } = useTransactionCount({
    address: address as Address | undefined,
    query: { enabled: !!address },
  })

  // Returns the next nonce to use, accounting for locally queued txs
  const getNextNonce = useCallback(async (): Promise<number> => {
    // Prefer pending nonce from RPC
    let baseNonce: number
    if (publicClient && address) {
      try {
        const pending = await publicClient.getTransactionCount({
          address: address as Address,
          blockTag: 'pending',
        })
        baseNonce = pending
      } catch {
        baseNonce = onchainNonce ?? 0
      }
    } else {
      baseNonce = onchainNonce ?? 0
    }

    // Find any locally tracked nonces above the rpc pending nonce
    const localMax = pendingRef.current.reduce(
      (max, tx) => Math.max(max, tx.nonce + 1),
      baseNonce,
    )

    const next = Math.max(baseNonce, localMax)
    setLocalNonce(next)
    return next
  }, [publicClient, address, onchainNonce])

  const trackPending = useCallback((nonce: number, hash: Hash) => {
    pendingRef.current = [
      ...pendingRef.current.filter((t) => t.nonce !== nonce),
      { nonce, hash, submittedAt: Date.now() },
    ]
  }, [])

  const confirmPending = useCallback(
    (hash: Hash) => {
      pendingRef.current = pendingRef.current.filter((t) => t.hash !== hash)
      refetchNonce()
    },
    [refetchNonce],
  )

  const clearStale = useCallback(
    (maxAgeMs = 300_000) => {
      const cutoff = Date.now() - maxAgeMs
      pendingRef.current = pendingRef.current.filter((t) => t.submittedAt > cutoff)
    },
    [],
  )

  return {
    onchainNonce,
    localNonce,
    pendingTxs: pendingRef.current,
    getNextNonce,
    trackPending,
    confirmPending,
    clearStale,
    refetch: refetchNonce,
  }
}

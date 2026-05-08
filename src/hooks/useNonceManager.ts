'use client'

import { useState, useCallback, useRef } from 'react'
import { useTransactionCount, usePublicClient, useAccount } from 'wagmi'
import type { Address, Hash } from 'viem'

interface PendingTx {
  nonce: number
  hash: Hash
  submittedAt: number
}

export function useNonceManager() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const pendingRef = useRef<PendingTx[]>([])
  const [pendingTxs, setPendingTxs] = useState<PendingTx[]>([])
  const [localNonce, setLocalNonce] = useState<number | null>(null)

  const { data: onchainNonce, refetch: refetchNonce } = useTransactionCount({
    address: address as Address | undefined,
    query: { enabled: !!address },
  })

  const getNextNonce = useCallback(async (): Promise<number> => {
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

    const localMax = pendingRef.current.reduce(
      (max, tx) => Math.max(max, tx.nonce + 1),
      baseNonce,
    )

    const next = Math.max(baseNonce, localMax)
    setLocalNonce(next)
    return next
  }, [publicClient, address, onchainNonce])

  const trackPending = useCallback((nonce: number, hash: Hash) => {
    const updated = [
      ...pendingRef.current.filter((t) => t.nonce !== nonce),
      { nonce, hash, submittedAt: Date.now() },
    ]
    pendingRef.current = updated
    setPendingTxs(updated)
  }, [])

  const confirmPending = useCallback(
    (hash: Hash) => {
      const updated = pendingRef.current.filter((t) => t.hash !== hash)
      pendingRef.current = updated
      setPendingTxs(updated)
      refetchNonce()
    },
    [refetchNonce],
  )

  const clearStale = useCallback((maxAgeMs = 300_000) => {
    const cutoff = Date.now() - maxAgeMs
    const updated = pendingRef.current.filter((t) => t.submittedAt > cutoff)
    pendingRef.current = updated
    setPendingTxs(updated)
  }, [])

  return {
    onchainNonce,
    localNonce,
    pendingTxs,
    getNextNonce,
    trackPending,
    confirmPending,
    clearStale,
    refetch: refetchNonce,
  }
}

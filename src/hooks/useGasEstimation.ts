'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePublicClient, useChainId } from 'wagmi'
import { estimateGasTiers, formatGwei } from '@/lib/gas'
import type { GasTier, GasTierFees } from '@/types'

const POLL_INTERVAL_MS = 12_000 // ~1 block

interface GasEstimationState {
  tiers: GasTierFees | null
  selectedTier: GasTier
  isLoading: boolean
  error: string | null
  lastUpdated: number | null
}

export function useGasEstimation(initialTier: GasTier = 'standard') {
  const publicClient = usePublicClient()
  const chainId = useChainId()

  const [state, setState] = useState<GasEstimationState>({
    tiers: null,
    selectedTier: initialTier,
    isLoading: false,
    error: null,
    lastUpdated: null,
  })

  const fetchGas = useCallback(async () => {
    if (!publicClient) return
    setState((s) => ({ ...s, isLoading: true, error: null }))
    try {
      const tiers = await estimateGasTiers(publicClient)
      setState((s) => ({ ...s, tiers, isLoading: false, lastUpdated: Date.now() }))
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Gas estimation failed',
      }))
    }
  }, [publicClient])

  // Fetch on mount and chain change
  useEffect(() => {
    fetchGas()
  }, [fetchGas, chainId])

  // Poll every block
  useEffect(() => {
    const id = setInterval(fetchGas, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchGas])

  const setTier = useCallback((tier: GasTier) => {
    setState((s) => ({ ...s, selectedTier: tier }))
  }, [])

  const selectedFees = state.tiers?.[state.selectedTier] ?? null

  const formatted = state.tiers
    ? ({
        slow: {
          maxFee: formatGwei(state.tiers.slow.maxFeePerGas),
          priority: formatGwei(state.tiers.slow.maxPriorityFeePerGas),
        },
        standard: {
          maxFee: formatGwei(state.tiers.standard.maxFeePerGas),
          priority: formatGwei(state.tiers.standard.maxPriorityFeePerGas),
        },
        fast: {
          maxFee: formatGwei(state.tiers.fast.maxFeePerGas),
          priority: formatGwei(state.tiers.fast.maxPriorityFeePerGas),
        },
        urgent: {
          maxFee: formatGwei(state.tiers.urgent.maxFeePerGas),
          priority: formatGwei(state.tiers.urgent.maxPriorityFeePerGas),
        },
      } as const)
    : null

  return {
    ...state,
    selectedFees,
    formatted,
    setTier,
    refresh: fetchGas,
  }
}

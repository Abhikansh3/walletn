'use client'

import { useCallback, useState } from 'react'
import { useSendTransaction, usePublicClient, useChainId, useConnection } from 'wagmi'
import type { Address, Hash } from 'viem'
import { getReplacementGas } from '@/lib/gas'
import type { GasFees, TxReplacement } from '@/types'

interface ReplacementState {
  isPending: boolean
  error: string | null
  replacements: TxReplacement[]
}

export function useTxReplacement() {
  const { address } = useConnection()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { sendTransactionAsync } = useSendTransaction()

  const [state, setState] = useState<ReplacementState>({
    isPending: false,
    error: null,
    replacements: [],
  })

  const getOriginalGas = useCallback(
    async (hash: Hash): Promise<GasFees | null> => {
      if (!publicClient) return null
      try {
        const tx = await publicClient.getTransaction({ hash })
        if (!tx.maxFeePerGas || !tx.maxPriorityFeePerGas) return null
        return {
          maxFeePerGas: tx.maxFeePerGas,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        }
      } catch {
        return null
      }
    },
    [publicClient],
  )

  const speedUp = useCallback(
    async (originalHash: Hash): Promise<Hash | null> => {
      if (!publicClient || !address) {
        setState((s) => ({ ...s, error: 'Wallet not connected' }))
        return null
      }

      setState((s) => ({ ...s, isPending: true, error: null }))
      try {
        const originalTx = await publicClient.getTransaction({ hash: originalHash })
        const originalGas = await getOriginalGas(originalHash)
        if (!originalGas) throw new Error('Could not fetch original transaction gas')

        const newGas = getReplacementGas(originalGas)

        const newHash = await sendTransactionAsync({
          to: originalTx.to ?? (address as Address),
          data: originalTx.input,
          value: originalTx.value,
          nonce: originalTx.nonce,
          gas: originalTx.gas,
          maxFeePerGas: newGas.maxFeePerGas,
          maxPriorityFeePerGas: newGas.maxPriorityFeePerGas,
          chainId,
        })

        const replacement: TxReplacement = {
          originalHash,
          newHash,
          type: 'speedup',
          timestamp: Date.now(),
        }
        setState((s) => ({
          ...s,
          isPending: false,
          replacements: [replacement, ...s.replacements],
        }))
        return newHash
      } catch (err) {
        setState((s) => ({
          ...s,
          isPending: false,
          error: err instanceof Error ? err.message : 'Speed-up failed',
        }))
        return null
      }
    },
    [publicClient, address, chainId, getOriginalGas, sendTransactionAsync],
  )

  const cancel = useCallback(
    async (originalHash: Hash): Promise<Hash | null> => {
      if (!publicClient || !address) {
        setState((s) => ({ ...s, error: 'Wallet not connected' }))
        return null
      }

      setState((s) => ({ ...s, isPending: true, error: null }))
      try {
        const originalTx = await publicClient.getTransaction({ hash: originalHash })
        const originalGas = await getOriginalGas(originalHash)
        if (!originalGas) throw new Error('Could not fetch original transaction gas')

        const newGas = getReplacementGas(originalGas)

        // Cancel = 0-value self-transfer with same nonce but higher gas
        const newHash = await sendTransactionAsync({
          to: address as Address,
          value: 0n,
          nonce: originalTx.nonce,
          gas: 21000n,
          maxFeePerGas: newGas.maxFeePerGas,
          maxPriorityFeePerGas: newGas.maxPriorityFeePerGas,
          chainId,
        })

        const replacement: TxReplacement = {
          originalHash,
          newHash,
          type: 'cancel',
          timestamp: Date.now(),
        }
        setState((s) => ({
          ...s,
          isPending: false,
          replacements: [replacement, ...s.replacements],
        }))
        return newHash
      } catch (err) {
        setState((s) => ({
          ...s,
          isPending: false,
          error: err instanceof Error ? err.message : 'Cancel failed',
        }))
        return null
      }
    },
    [publicClient, address, chainId, getOriginalGas, sendTransactionAsync],
  )

  return {
    speedUp,
    cancel,
    ...state,
  }
}

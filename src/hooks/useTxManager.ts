'use client'

import { useState, useCallback } from 'react'
import {
  useSendTransaction,
  useWaitForTransactionReceipt,
  usePublicClient,
  useChainId,
  useConnection,
} from 'wagmi'
import type { Address, Hash, Hex } from 'viem'
import { estimateGasLimit } from '@/lib/gas'
import { useNonceManager } from './useNonceManager'
import { useGasEstimation } from './useGasEstimation'
import type { GasFees, GasTier, TxRecord, TxStatus } from '@/types'

interface SendParams {
  to: Address
  data?: Hex
  value?: bigint
  label?: string
  gasTier?: GasTier
  customGas?: GasFees
}

export function useTxManager() {
  const { address } = useConnection()
  const chainId = useChainId()
  const publicClient = usePublicClient()
  const { getNextNonce, trackPending, confirmPending } = useNonceManager()
  const gasEstimation = useGasEstimation()

  const [history, setHistory] = useState<TxRecord[]>([])
  const [pendingHash, setPendingHash] = useState<Hash | undefined>()
  const [txStatus, setTxStatus] = useState<TxStatus>('idle')
  const [txError, setTxError] = useState<string | null>(null)

  const { sendTransactionAsync } = useSendTransaction()

  const { data: receipt } = useWaitForTransactionReceipt({
    hash: pendingHash,
    query: { enabled: !!pendingHash },
  })

  // Update record when receipt arrives
  if (receipt && pendingHash) {
    const isSuccess = receipt.status === 'success'
    setHistory((prev) =>
      prev.map((r) =>
        r.hash === pendingHash
          ? {
              ...r,
              status: isSuccess ? 'confirmed' : 'failed',
              confirmedAt: Date.now(),
              blockNumber: receipt.blockNumber,
              gasUsed: receipt.gasUsed,
            }
          : r,
      ),
    )
    if (isSuccess) {
      setTxStatus('confirmed')
      confirmPending(pendingHash)
    } else {
      setTxStatus('failed')
    }
    setPendingHash(undefined)
  }

  const send = useCallback(
    async (params: SendParams): Promise<Hash | null> => {
      if (!address || !publicClient) {
        setTxError('Wallet not connected')
        return null
      }

      setTxStatus('building')
      setTxError(null)

      try {
        // Determine gas fees
        const tier = params.gasTier ?? gasEstimation.selectedTier
        const fees = params.customGas ?? gasEstimation.selectedFees
        if (!fees) throw new Error('Gas estimation not ready')

        // Estimate gas limit
        setTxStatus('building')
        const gasLimit = await estimateGasLimit(publicClient, {
          to: params.to,
          data: params.data,
          value: params.value,
          from: address as Address,
        })

        // Get nonce
        const nonce = await getNextNonce()

        setTxStatus('signing')

        const hash = await sendTransactionAsync({
          to: params.to,
          data: params.data,
          value: params.value ?? 0n,
          nonce,
          gas: gasLimit,
          maxFeePerGas: fees.maxFeePerGas,
          maxPriorityFeePerGas: fees.maxPriorityFeePerGas,
          chainId,
        })

        trackPending(nonce, hash)
        setPendingHash(hash)
        setTxStatus('pending')

        const record: TxRecord = {
          hash,
          chainId,
          from: address as Address,
          to: params.to,
          value: params.value ?? 0n,
          nonce,
          status: 'pending',
          submittedAt: Date.now(),
          label: params.label,
        }
        setHistory((prev) => [record, ...prev])

        return hash
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Transaction failed'
        setTxError(msg)
        setTxStatus('failed')
        return null
      }
    },
    [
      address,
      publicClient,
      chainId,
      gasEstimation.selectedTier,
      gasEstimation.selectedFees,
      getNextNonce,
      sendTransactionAsync,
      trackPending,
    ],
  )

  const reset = useCallback(() => {
    setTxStatus('idle')
    setTxError(null)
    setPendingHash(undefined)
  }, [])

  return {
    send,
    reset,
    txStatus,
    txError,
    pendingHash,
    history,
    gasEstimation,
    isPending: txStatus === 'pending' || txStatus === 'confirming' || txStatus === 'signing' || txStatus === 'building',
  }
}

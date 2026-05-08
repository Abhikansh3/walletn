'use client'

import { useCallback, useState } from 'react'
import { useSignTypedData, usePublicClient, useAccount } from 'wagmi'
import { parseAbi } from 'viem'
import type { Address } from 'viem'
import { buildPermitTypedData } from '@/lib/tx'
import type { PermitData, PermitSignature } from '@/types'

const ERC20_PERMIT_ABI = parseAbi([
  'function nonces(address owner) view returns (uint256)',
  'function name() view returns (string)',
  'function version() view returns (string)',
  'function DOMAIN_SEPARATOR() view returns (bytes32)',
])

interface PermitState {
  isPending: boolean
  error: string | null
  signature: PermitSignature | null
}

export function usePermit() {
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { signTypedDataAsync } = useSignTypedData()

  const [state, setState] = useState<PermitState>({
    isPending: false,
    error: null,
    signature: null,
  })

  const sign = useCallback(
    async (
      token: Address,
      spender: Address,
      value: bigint,
      deadline?: bigint,
    ): Promise<PermitSignature | null> => {
      if (!publicClient || !address) {
        setState((s) => ({ ...s, error: 'Wallet not connected' }))
        return null
      }

      setState({ isPending: true, error: null, signature: null })

      try {
        const chainId = await publicClient.getChainId()
        const effectiveDeadline = deadline ?? BigInt(Math.floor(Date.now() / 1000) + 3600)

        // Read on-chain permit nonce and token metadata
        const [nonce, tokenName] = await Promise.all([
          publicClient.readContract({
            address: token,
            abi: ERC20_PERMIT_ABI,
            functionName: 'nonces',
            args: [address as Address],
          }) as Promise<bigint>,
          publicClient.readContract({
            address: token,
            abi: ERC20_PERMIT_ABI,
            functionName: 'name',
          }) as Promise<string>,
        ])

        const permitData: PermitData = {
          token,
          owner: address as Address,
          spender,
          value,
          deadline: effectiveDeadline,
          nonce,
        }

        const typedData = buildPermitTypedData(
          {
            name: tokenName,
            version: '1',
            chainId,
            verifyingContract: token,
          },
          permitData,
        )

        const rawSig = await signTypedDataAsync({
          domain: typedData.domain,
          types: typedData.types,
          primaryType: typedData.primaryType,
          message: typedData.message,
        })

        // Split signature into v, r, s
        const v = parseInt(rawSig.slice(130, 132), 16)
        const r = rawSig.slice(0, 66) as `0x${string}`
        const s = `0x${rawSig.slice(66, 130)}` as `0x${string}`

        const signature: PermitSignature = { v, r, s, deadline: effectiveDeadline }
        setState({ isPending: false, error: null, signature })
        return signature
      } catch (err) {
        const error = err instanceof Error ? err.message : 'Permit signing failed'
        setState({ isPending: false, error, signature: null })
        return null
      }
    },
    [publicClient, address, signTypedDataAsync],
  )

  return {
    sign,
    ...state,
  }
}

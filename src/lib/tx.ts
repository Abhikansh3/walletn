import { encodeFunctionData, type Address, type Hex } from 'viem'
import type { CallItem, GasFees, PermitData, TypedDataDomain } from '@/types'

// --- EIP-1559 transaction builder ---

export interface BuildTxParams {
  to: Address
  data?: Hex
  value?: bigint
  nonce: number
  chainId: number
  gas: GasFees & { gasLimit: bigint }
}

export function buildEip1559Tx(params: BuildTxParams) {
  return {
    type: 'eip1559' as const,
    to: params.to,
    data: params.data,
    value: params.value ?? 0n,
    nonce: params.nonce,
    chainId: params.chainId,
    gas: params.gas.gasLimit,
    maxFeePerGas: params.gas.maxFeePerGas,
    maxPriorityFeePerGas: params.gas.maxPriorityFeePerGas,
  }
}

// --- EIP-712 typed data builder ---

export function buildTypedData<T extends Record<string, unknown>>(
  domain: TypedDataDomain,
  types: Record<string, { name: string; type: string }[]>,
  primaryType: string,
  message: T,
) {
  return { domain, types, primaryType, message }
}

// --- EIP-2612 Permit typed data ---

const PERMIT_TYPES = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
}

export function buildPermitTypedData(
  domain: TypedDataDomain,
  permit: PermitData,
) {
  return buildTypedData(
    domain,
    PERMIT_TYPES,
    'Permit',
    {
      owner: permit.owner,
      spender: permit.spender,
      value: permit.value,
      nonce: permit.nonce,
      deadline: permit.deadline,
    },
  )
}

// --- Multicall batch builder ---

const MULTICALL_ABI = [
  {
    name: 'aggregate3',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'calls',
        type: 'tuple[]',
        components: [
          { name: 'target', type: 'address' },
          { name: 'allowFailure', type: 'bool' },
          { name: 'callData', type: 'bytes' },
        ],
      },
    ],
    outputs: [
      {
        name: 'returnData',
        type: 'tuple[]',
        components: [
          { name: 'success', type: 'bool' },
          { name: 'returnData', type: 'bytes' },
        ],
      },
    ],
  },
] as const

// Standard multicall3 address (deployed on all major chains)
export const MULTICALL3_ADDRESS: Address = '0xcA11bde05977b3631167028862bE2a173976CA11'

export function buildMulticall3Calldata(calls: CallItem[]): Hex {
  return encodeFunctionData({
    abi: MULTICALL_ABI,
    functionName: 'aggregate3',
    args: [
      calls.map((c) => ({
        target: c.to,
        allowFailure: true,
        callData: c.data ?? '0x',
      })),
    ],
  })
}

export function buildMulticallTx(calls: CallItem[], nonce: number, chainId: number, gas: GasFees & { gasLimit: bigint }) {
  const totalValue = calls.reduce((sum, c) => sum + (c.value ?? 0n), 0n)
  return buildEip1559Tx({
    to: MULTICALL3_ADDRESS,
    data: buildMulticall3Calldata(calls),
    value: totalValue,
    nonce,
    chainId,
    gas,
  })
}

// --- Calldata helpers ---

export function encodeCalldata(
  abi: readonly unknown[],
  functionName: string,
  args: readonly unknown[],
): Hex {
  return encodeFunctionData({ abi: abi as Parameters<typeof encodeFunctionData>[0]['abi'], functionName, args })
}

// --- Cancel / speed-up transaction builders ---

export function buildCancelTx(
  from: Address,
  nonce: number,
  chainId: number,
  gas: GasFees & { gasLimit: bigint },
) {
  // Send 0 ETH to self with same nonce = cancel
  return buildEip1559Tx({ to: from, value: 0n, nonce, chainId, gas })
}

export function buildSpeedUpTx(
  original: BuildTxParams,
  newGas: GasFees & { gasLimit: bigint },
) {
  return buildEip1559Tx({ ...original, gas: newGas })
}

// --- Format helpers ---

export function shortenAddress(address: Address, chars = 4): string {
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`
}

export function formatTxHash(hash: string, chars = 6): string {
  return `${hash.slice(0, chars + 2)}…${hash.slice(-chars)}`
}

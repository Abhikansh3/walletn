import type { Hash, Address } from 'viem'

export type GasTier = 'slow' | 'standard' | 'fast' | 'urgent'

export type TxStatus =
  | 'idle'
  | 'building'
  | 'signing'
  | 'pending'
  | 'confirming'
  | 'confirmed'
  | 'failed'
  | 'cancelled'
  | 'replaced'

export interface GasFees {
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  estimatedGasLimit?: bigint
}

export interface GasTierFees {
  slow: GasFees
  standard: GasFees
  fast: GasFees
  urgent: GasFees
}

export interface TxRecord {
  hash: Hash
  chainId: number
  from: Address
  to?: Address
  value: bigint
  nonce: number
  status: TxStatus
  submittedAt: number
  confirmedAt?: number
  blockNumber?: bigint
  gasUsed?: bigint
  replacedBy?: Hash
  speedUpOf?: Hash
  label?: string
}

export interface TypedDataDomain {
  name?: string
  version?: string
  chainId?: number
  verifyingContract?: Address
  salt?: `0x${string}`
}

export interface PermitData {
  token: Address
  owner: Address
  spender: Address
  value: bigint
  deadline: bigint
  nonce: bigint
}

export interface PermitSignature {
  v: number
  r: `0x${string}`
  s: `0x${string}`
  deadline: bigint
}

export interface CallItem {
  to: Address
  data?: `0x${string}`
  value?: bigint
}

export interface TxReplacement {
  originalHash: Hash
  newHash: Hash
  type: 'speedup' | 'cancel'
  timestamp: number
}

export interface NetworkConfig {
  chainId: number
  name: string
  shortName: string
  nativeCurrency: { name: string; symbol: string; decimals: number }
  blockExplorer: string
  color: string
}

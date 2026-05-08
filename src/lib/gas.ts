import type { PublicClient } from 'viem'
import type { GasFees, GasTier, GasTierFees } from '@/types'

const PRIORITY_FEE_MULTIPLIERS: Record<GasTier, number> = {
  slow: 1.0,
  standard: 1.25,
  fast: 1.5,
  urgent: 2.0,
}

const BASE_FEE_MULTIPLIERS: Record<GasTier, number> = {
  slow: 1.1,
  standard: 1.25,
  fast: 1.5,
  urgent: 2.0,
}

// Minimum priority fees per tier in gwei (as bigint in wei)
const MIN_PRIORITY_FEES: Record<GasTier, bigint> = {
  slow: 100_000_000n,      // 0.1 gwei
  standard: 500_000_000n,  // 0.5 gwei
  fast: 1_500_000_000n,    // 1.5 gwei
  urgent: 3_000_000_000n,  // 3 gwei
}

export async function estimateGasTiers(client: PublicClient): Promise<GasTierFees> {
  const block = await client.getBlock({ blockTag: 'latest' })
  const baseFeePerGas = block.baseFeePerGas ?? 1_000_000_000n

  // Fetch fee history to compute realistic priority fees
  let medianPriorityFee = 1_000_000_000n // 1 gwei fallback
  try {
    const feeHistory = await client.getFeeHistory({
      blockCount: 5,
      rewardPercentiles: [25, 50, 75],
      blockTag: 'latest',
    })
    const rewards = feeHistory.reward?.flatMap((r) => r).filter(Boolean) ?? []
    if (rewards.length > 0) {
      medianPriorityFee = rewards.reduce((a, b) => a + b, 0n) / BigInt(rewards.length)
    }
  } catch {
    // RPC doesn't support fee history, use fallback
  }

  return buildTiers(baseFeePerGas, medianPriorityFee)
}

export function buildTiers(baseFeePerGas: bigint, basePriorityFee: bigint): GasTierFees {
  const tiers = (['slow', 'standard', 'fast', 'urgent'] as const).reduce(
    (acc, tier) => {
      const priorityFee = maxBigInt(
        scaleBigInt(basePriorityFee, PRIORITY_FEE_MULTIPLIERS[tier]),
        MIN_PRIORITY_FEES[tier],
      )
      const maxFee = scaleBigInt(baseFeePerGas, BASE_FEE_MULTIPLIERS[tier]) + priorityFee
      acc[tier] = { maxFeePerGas: maxFee, maxPriorityFeePerGas: priorityFee }
      return acc
    },
    {} as GasTierFees,
  )
  return tiers
}

export function getReplacementGas(original: GasFees): GasFees {
  // EIP-1559 replacement requires at least 10% increase on both fields
  const bump = (n: bigint) => (n * 110n) / 100n
  return {
    maxFeePerGas: bump(original.maxFeePerGas),
    maxPriorityFeePerGas: bump(original.maxPriorityFeePerGas),
  }
}

export async function estimateGasLimit(
  client: PublicClient,
  tx: { to?: `0x${string}`; data?: `0x${string}`; value?: bigint; from?: `0x${string}` },
  bufferBps = 1200, // 20% buffer
): Promise<bigint> {
  try {
    const estimate = await client.estimateGas(tx)
    return (estimate * BigInt(bufferBps)) / 1000n
  } catch {
    return 21000n // ETH transfer fallback
  }
}

function scaleBigInt(n: bigint, multiplier: number): bigint {
  return (n * BigInt(Math.round(multiplier * 1000))) / 1000n
}

function maxBigInt(a: bigint, b: bigint): bigint {
  return a > b ? a : b
}

export function formatGwei(wei: bigint): string {
  const gwei = Number(wei) / 1e9
  return gwei < 1 ? gwei.toFixed(3) : gwei.toFixed(2)
}

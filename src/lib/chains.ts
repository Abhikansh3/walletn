import { mainnet, arbitrum, polygon, bsc, optimism, base } from 'viem/chains'
import type { NetworkConfig } from '@/types'

export const SUPPORTED_CHAINS = [mainnet, arbitrum, polygon, bsc, optimism, base] as const

export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]['id']

export const NETWORK_CONFIGS: Record<number, NetworkConfig> = {
  [mainnet.id]: {
    chainId: mainnet.id,
    name: 'Ethereum',
    shortName: 'ETH',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://etherscan.io',
    color: '#627EEA',
  },
  [arbitrum.id]: {
    chainId: arbitrum.id,
    name: 'Arbitrum One',
    shortName: 'ARB',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://arbiscan.io',
    color: '#28A0F0',
  },
  [polygon.id]: {
    chainId: polygon.id,
    name: 'Polygon',
    shortName: 'MATIC',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    blockExplorer: 'https://polygonscan.com',
    color: '#8247E5',
  },
  [bsc.id]: {
    chainId: bsc.id,
    name: 'BNB Chain',
    shortName: 'BNB',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    blockExplorer: 'https://bscscan.com',
    color: '#F0B90B',
  },
  [optimism.id]: {
    chainId: optimism.id,
    name: 'Optimism',
    shortName: 'OP',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://optimistic.etherscan.io',
    color: '#FF0420',
  },
  [base.id]: {
    chainId: base.id,
    name: 'Base',
    shortName: 'BASE',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorer: 'https://basescan.org',
    color: '#0052FF',
  },
}

export function getNetworkConfig(chainId: number): NetworkConfig | undefined {
  return NETWORK_CONFIGS[chainId]
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in NETWORK_CONFIGS
}

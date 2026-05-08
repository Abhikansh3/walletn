import { connectorsForWallets } from '@rainbow-me/rainbowkit'
import { metaMaskWallet } from '@rainbow-me/rainbowkit/wallets'
import { coinbaseWallet } from '@rainbow-me/rainbowkit/wallets'
import { walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'
import { rainbowWallet } from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http, fallback, cookieStorage, createStorage } from 'wagmi'
import { mainnet, arbitrum, polygon, bsc, optimism, base } from 'viem/chains'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, coinbaseWallet, rainbowWallet],
    },
    {
      groupName: 'Other',
      wallets: [walletConnectWallet],
    },
  ],
  {
    projectId,
    appName: 'SwapRail',
    appDescription: 'Multi-chain wallet hub for SwapRail',
  },
)

export const wagmiConfig = createConfig({
  connectors,
  chains: [mainnet, arbitrum, polygon, bsc, optimism, base],
  transports: {
    [mainnet.id]: fallback([
      http(process.env.NEXT_PUBLIC_ETH_RPC_URL),
      http('https://cloudflare-eth.com'),
      http(),
    ]),
    [arbitrum.id]: fallback([
      http(process.env.NEXT_PUBLIC_ARB_RPC_URL),
      http('https://arb1.arbitrum.io/rpc'),
      http(),
    ]),
    [polygon.id]: fallback([
      http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL),
      http('https://polygon-rpc.com'),
      http(),
    ]),
    [bsc.id]: fallback([
      http(process.env.NEXT_PUBLIC_BSC_RPC_URL),
      http('https://bsc-dataseed.binance.org'),
      http(),
    ]),
    [optimism.id]: fallback([
      http(process.env.NEXT_PUBLIC_OP_RPC_URL),
      http('https://mainnet.optimism.io'),
      http(),
    ]),
    [base.id]: fallback([
      http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
      http('https://mainnet.base.org'),
      http(),
    ]),
  },
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
})

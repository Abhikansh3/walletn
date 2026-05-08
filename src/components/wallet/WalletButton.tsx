'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletButton() {
  return (
    <ConnectButton
      chainStatus="icon"
      showBalance={{ smallScreen: false, largeScreen: true }}
      accountStatus={{ smallScreen: 'avatar', largeScreen: 'full' }}
    />
  )
}

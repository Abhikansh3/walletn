'use client'

import { useEffect, useCallback } from 'react'
import { useConnection, useDisconnect, useReconnect, useChainId, useSwitchChain } from 'wagmi'
import type { Address } from 'viem'

const SESSION_KEY = 'swaprail:session'

interface SessionData {
  address: Address
  chainId: number
  connectorId: string
  connectedAt: number
}

function readSession(): SessionData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as SessionData) : null
  } catch {
    return null
  }
}

function writeSession(data: SessionData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

function clearSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
}

export function useWalletSession() {
  const { address, connector, status } = useConnection()
  const chainId = useChainId()
  const { disconnect } = useDisconnect()
  const { reconnect } = useReconnect()
  const { switchChain, isPending: isSwitching } = useSwitchChain()

  const isConnected = status === 'connected'

  // Persist session on connect
  useEffect(() => {
    if (isConnected && address && connector) {
      writeSession({
        address,
        chainId,
        connectorId: connector.id,
        connectedAt: Date.now(),
      })
    }
  }, [isConnected, address, chainId, connector])

  // Clear session on disconnect
  const handleDisconnect = useCallback(() => {
    clearSession()
    disconnect()
  }, [disconnect])

  // Attempt reconnect on mount if session exists
  useEffect(() => {
    const session = readSession()
    if (session && !isConnected) {
      reconnect()
    }
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const switchNetwork = useCallback(
    (targetChainId: number) => {
      if (targetChainId !== chainId) {
        switchChain({ chainId: targetChainId })
      }
    },
    [chainId, switchChain],
  )

  return {
    address,
    chainId,
    connector,
    isConnected,
    status,
    isSwitching,
    disconnect: handleDisconnect,
    switchNetwork,
    savedSession: readSession(),
  }
}

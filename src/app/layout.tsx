import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import { WagmiProviders } from '@/components/providers/WagmiProviders'
import { Header } from '@/components/layout/Header'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'SwapRail Wallet Hub',
  description: 'Secure multi-chain wallet integrations and transaction flows',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookie = (await headers()).get('cookie')

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-black text-white">
        <WagmiProviders cookie={cookie}>
          <Header />
          <main className="flex-1">{children}</main>
        </WagmiProviders>
      </body>
    </html>
  )
}

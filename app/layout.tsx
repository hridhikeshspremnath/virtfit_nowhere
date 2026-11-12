import type { Metadata, Viewport } from 'next'
import { Caveat, Instrument_Serif, Inter_Tight, Pacifico, Silkscreen, Space_Mono } from 'next/font/google'
import './globals.css'

const sans = Inter_Tight({ subsets: ['latin'], variable: '--font-sans', display: 'swap' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', display: 'swap' })
const mono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono', display: 'swap' })
const hand = Caveat({ subsets: ['latin'], weight: ['500'], variable: '--font-hand', display: 'swap' })
const pixel = Silkscreen({ subsets: ['latin'], weight: '400', variable: '--font-pixel', display: 'swap' })
const script = Pacifico({ subsets: ['latin'], weight: '400', variable: '--font-script', display: 'swap' })

export const metadata: Metadata = {
  title: 'Virtfit Nowhere — No more blind shopping',
  description: 'Add your photo, spin the ring, and see each style on you before it ships.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#ffffff' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable} ${hand.variable} ${pixel.variable} ${script.variable}`}>
      <body>{children}</body>
    </html>
  )
}

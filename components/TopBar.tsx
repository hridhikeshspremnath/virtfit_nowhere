'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import Logo from './Logo'
import { BRAND } from '@/lib/looks'
import { summarize, useBag, useBagHydration } from '@/lib/store'

export const ArrowLeft = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M9.5 3 4.5 8l5 5M5 8h8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function TopBar({ left, dark }: { left?: ReactNode; dark?: boolean }) {
  useBagHydration()
  const count = useBag((s) => summarize(s.lines).count)
  return (
    <header className={`topbar${dark ? ' theme-dark' : ''}`}>
      <div className="topbar-left">{left}</div>
      <Link href="/" className="wordmark" aria-label={`${BRAND} home`}>
        <Logo />
        {BRAND}
        <sup>©</sup>
      </Link>
      <div className="topbar-right">
        <Link href="/shop" className="pill glass hide-sm">
          Shop
        </Link>
        <Link href="/cart" className="pill glass" aria-label={`Bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
          Bag
          <span className="bag-count" key={count}>
            {count}
          </span>
        </Link>
      </div>
    </header>
  )
}

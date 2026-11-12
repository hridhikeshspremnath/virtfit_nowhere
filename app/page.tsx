'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import CursorFollower from '@/components/CursorFollower'
import Figure, { ItemThumb } from '@/components/Figure'
import LookDetail from '@/components/LookDetail'
import Ring, { type RingHandle } from '@/components/Ring'
import TopBar, { ArrowLeft } from '@/components/TopBar'
import { useAssets, useProfile } from '@/lib/profile'
import './home.css'
import { LOOKS, money, pad2 } from '@/lib/looks'
import { useBag } from '@/lib/store'

type Selection = { index: number; rect: DOMRect; item: number | null }

export default function Home() {
  const ring = useRef<RingHandle>(null)
  const [active, setActive] = useState(0)
  const results = useProfile((s) => s.results)
  const assets = useAssets()
  const [autoplay, setAutoplay] = useState(true)
  const [sel, setSel] = useState<Selection | null>(null)
  const [closeSignal, setCloseSignal] = useState(0)
  const [drawer, setDrawer] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const addLook = useBag((s) => s.addLook)

  const look = LOOKS[active]

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setAutoplay(false)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (drawer) setDrawer(false)
      else if (sel) setCloseSignal((n) => n + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer, sel])

  const open = useCallback((index: number, rect: DOMRect, item: number | null = null) => {
    setSel({ index, rect, item })
    setActive(index)
    // once the ring has faded, park the opened look at the front slot for the way back
    setTimeout(() => ring.current?.goTo(index, true), 450)
  }, [])

  const openActiveItem = (item: number) => {
    const rect = ring.current?.rectOf(active)
    if (rect) open(active, rect, item)
  }

  const shopFit = () => {
    addLook(look.id)
    setToast('+3 items — whole fit −10%')
  }

  const left = sel ? (
    <button type="button" className="circle-btn solid" onClick={() => setCloseSignal((n) => n + 1)} aria-label="Back to all looks">
      <ArrowLeft />
    </button>
  ) : (
    <>
      <button type="button" className="pill glass" onClick={() => setDrawer(true)} aria-haspopup="dialog">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
          <path d="M2 4.5h12M2 8h12M2 11.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Styles
      </button>
    </>
  )

  return (
    <main className={`home${sel ? ' has-detail' : ''}`}>
      <div className="grain" aria-hidden="true" />
      <TopBar left={left} />

      <div className="tagline">
        <h1>
          No more <s>blind</s> shopping
        </h1>
        <p>Spin the ring, pick a style, and see it on your own photo.</p>
        <Link href={`/fit-check?look=${look.id}`} className="pill solid">
          Try {look.aesthetic} on you <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <Ring
        ref={ring}
        autoplay={autoplay}
        frozen={!!sel || drawer}
        onActive={setActive}
        onOpen={open}
        onToggleAutoplay={() => setAutoplay((a) => !a)}
        results={results}
        photos={assets.looks}
      >
        <div className="prism" aria-hidden="true">
          <span>Today&apos;s top picks</span>
        </div>
      </Ring>

      {/* bottom dock */}
      <div className="dock glass">
        <div className="dock-id">
          <div className="dock-count">
            <span>
              {pad2(active + 1)} / {pad2(LOOKS.length)}
            </span>
            <button
              type="button"
              className="circle-btn tiny"
              onClick={() => setAutoplay((a) => !a)}
              aria-label={autoplay ? 'Pause rotation' : 'Play rotation'}
              aria-pressed={autoplay}
            >
              {autoplay ? (
                <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true">
                  <path d="M2.5 1.5v7M7.5 1.5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 10 10" width="8" height="8" aria-hidden="true">
                  <path d="M2.5 1.2v7.6L9 5z" fill="currentColor" />
                </svg>
              )}
            </button>
          </div>
          <div className="dock-name swap" key={look.id}>
            <strong>{look.aesthetic}</strong>
            <em>{look.subtitle}</em>
          </div>
        </div>

        <div className="dock-items swap" key={`${look.id}-items`}>
          {look.items.map((item, i) => (
            <button key={item.id} type="button" className="item-pill" onClick={() => openActiveItem(i)}>
              <span className="thumb">
                {assets.garments[item.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={assets.garments[item.id]} alt="" />
                ) : (
                  <ItemThumb role={item.role} color={item.color} />
                )}
              </span>
              <span className="item-name">{item.name}</span>
              <em>{money(item.price)}</em>
            </button>
          ))}
        </div>

        <button type="button" className="shop-btn" onClick={shopFit}>
          <span>Shop this fit</span>
          <i aria-hidden="true">+</i>
        </button>

        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
      </div>

      {/* looks drawer */}
      <div className={`scrim${drawer ? ' is-open' : ''}`} onClick={() => setDrawer(false)} aria-hidden="true" />
      <nav className={`drawer${drawer ? ' is-open' : ''}`} aria-label="All looks" aria-hidden={!drawer} inert={!drawer}>
        <header>
          <span className="micro">All looks</span>
          <button type="button" className="circle-btn" onClick={() => setDrawer(false)} aria-label="Close">
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
              <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <ul>
          {LOOKS.map((l, i) => (
            <li key={l.id}>
              <button
                type="button"
                className={active === i ? 'is-active' : ''}
                onClick={() => {
                  setDrawer(false)
                  setActive(i)
                  ring.current?.goTo(i)
                }}
              >
                <span className="n">{pad2(i + 1)}</span>
                <span className="mini-fig">
                  <Figure outfit={l.outfit} />
                </span>
                <span className="names">
                  <strong>{l.aesthetic}</strong>
                  <em>{l.subtitle}</em>
                </span>
                <span className="from">from {money(Math.min(...l.items.map((it) => it.price)))}</span>
              </button>
            </li>
          ))}
        </ul>
        <footer className="micro">
          <Link href="/shop">Shop all</Link>
          <Link href="/fit-check">Virtual try-on</Link>
          <Link href="/cart">Bag</Link>
          <span>Free returns · 30 days</span>
        </footer>
      </nav>

      <p className="sr-only" aria-live="polite">
        {sel ? '' : `${pad2(active + 1)} of ${pad2(LOOKS.length)}, ${look.aesthetic}`}
      </p>

      {sel && (
        <LookDetail
          key={LOOKS[sel.index].id}
          look={LOOKS[sel.index]}
          origin={sel.rect}
          focusItem={sel.item}
          closeSignal={closeSignal}
          returnRect={() => ring.current?.rectOf(sel.index) ?? null}
          photo={results[LOOKS[sel.index].id] ?? assets.looks[LOOKS[sel.index].id]}
          garments={assets.garments}
          onClosed={() => setSel(null)}
        />
      )}

      {!sel && <CursorFollower />}
    </main>
  )
}

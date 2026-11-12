'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Barcode from './Barcode'
import Figure from './Figure'
import { BRAND, PRODUCTS, SIZE_COUNT, TILL, WHOLE_FIT_DISCOUNT, money, pad2, sizeLabel, type Look, type Role } from '@/lib/looks'
import { useBag } from '@/lib/store'

const EASE_IO = 'cubic-bezier(.76,0,.24,1)'

type Props = {
  look: Look
  origin: DOMRect
  focusItem: number | null
  /** where the figure should fly back to */
  returnRect: () => DOMRect | null
  onClosed: () => void
  /** parent bumps this to request a close (back button, Esc) */
  closeSignal: number
  /** real photography, when it exists: the look photo, product shots by item id, garment positions in % */
  photo?: string
  garments?: Record<string, string>
  spots?: Record<string, { x: number; y: number } | null>
}

export default function LookDetail({ look, origin, focusItem, returnRect, onClosed, closeSignal, photo, garments = {}, spots }: Props) {
  const router = useRouter()
  const hero = useRef<HTMLDivElement>(null)
  const sheet = useRef<HTMLElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const [active, setActive] = useState<number | null>(focusItem)
  const [sizeIdx, setSizeIdx] = useState(1)
  const [closing, setClosing] = useState(false)
  const [added, setAdded] = useState<string | null>(null)
  const add = useBag((s) => s.add)
  const addLook = useBag((s) => s.addLook)

  const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const flip = (from: DOMRect, reverse: boolean) => {
    const el = hero.current
    if (!el || reduced()) return null
    const to = el.getBoundingClientRect()
    if (!to.width || !from.width) return null
    const s = from.height / to.height
    const dx = from.left + from.width / 2 - (to.left + to.width / 2)
    const dy = from.bottom - to.bottom
    const frames = [{ transform: `translate(${dx}px, ${dy}px) scale(${s})` }, { transform: 'none' }]
    return el.animate(reverse ? frames.reverse() : frames, { duration: reverse ? 560 : 720, easing: EASE_IO, fill: 'both' })
  }

  useLayoutEffect(() => {
    flip(origin, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true })
    if (focusItem !== null) return
    const t = setTimeout(() => setActive((a) => a ?? 0), 900)
    return () => clearTimeout(t)
  }, [focusItem])

  const close = () => {
    if (closing) return
    setClosing(true)
    sheet.current?.scrollTo(0, 0) // the fly-back animation expects the top of the page
    const back = returnRect()
    const anim = back ? flip(back, true) : null
    if (anim) anim.onfinish = onClosed
    else setTimeout(onClosed, reduced() ? 0 : 320)
  }

  const seenSignal = useRef(closeSignal)
  useEffect(() => {
    if (seenSignal.current === closeSignal) return
    seenSignal.current = closeSignal
    close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeSignal])

  const subtotal = look.items.reduce((n, it) => n + it.price, 0)
  const discount = Math.round(subtotal * WHOLE_FIT_DISCOUNT * 100) / 100
  const total = subtotal - discount

  const addOne = (i: number) => {
    const item = look.items[i]
    add(item.id, sizeLabel(item.role, sizeIdx))
    setAdded(item.id)
    setTimeout(() => setAdded((a) => (a === item.id ? null : a)), 1400)
  }

  return (
    <section ref={sheet} className={`detail${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="true" aria-label={`${look.aesthetic} look: ${look.subtitle}`}>
      <div className="detail-top">
      <div className="detail-title">
        <p className="micro">
          {look.aesthetic} · 3 pieces
        </p>
        <h2>
          <span className="num">{pad2(look.index + 1)}.</span> <em>{look.subtitle}</em>
        </h2>
        <p className="detail-blurb">{look.blurb}</p>
      </div>

      <div className="detail-stage">
        <div className={`hero${photo ? ' has-photo' : ''}`} ref={hero}>
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={`hero-photo${/\.(png|webp)$/i.test(photo) ? ' cutout' : ''}`} src={photo} alt={`${look.aesthetic} look: ${look.items.map((i) => i.name).join(', ')}`} draggable={false} />
          ) : (
            <>
              <span className="fig-shadow" />
              <Figure outfit={look.outfit} label={`${look.aesthetic} look: ${look.items.map((i) => i.name).join(', ')}`} />
            </>
          )}
          {look.items.map((item, i) => {
            const at = (photo && spots?.[item.role]) || item.hotspot
            return (
            <button
              key={item.id}
              type="button"
              className={`hotspot${active === i ? ' is-active' : ''}${at.x < 50 ? ' flip' : ''}`}
              style={{ left: `${at.x}%`, top: `${at.y}%` }}
              aria-pressed={active === i}
              aria-label={`${item.name}, ${money(item.price)}`}
              onClick={() => setActive(active === i ? null : i)}
              onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
            >
              <span className="dot">{pad2(i + 1)}</span>
              <span className="tag">
                {item.name} <b>{money(item.price)}</b>
              </span>
            </button>
            )
          })}
        </div>
        <p className="micro detail-hint">Tap a dot to shop this item · scroll for more</p>
      </div>

      <button ref={closeBtn} type="button" className="circle-btn glass detail-close" onClick={close} aria-label="Close look">
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="m4 4 8 8m0-8-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      <aside className="receipt" aria-label="Look receipt">
        <header>
          <strong className="receipt-brand">
            {BRAND}
            <sup>©</sup>
          </strong>
          <span>{TILL}</span>
          <span>
            Look {pad2(look.index + 1)} — {look.subtitle}
          </span>
        </header>

        <div className="receipt-size" role="group" aria-label="Size">
          <span>Size</span>
          <div className="seg small">
            {Array.from({ length: SIZE_COUNT }, (_, i) => (
              <button key={i} type="button" aria-pressed={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                {sizeLabel('top', i)}
              </button>
            ))}
          </div>
        </div>

        <ul>
          {look.items.map((item, i) => (
            <li key={item.id} className={`${active === i ? 'is-active' : ''}${garments[item.id] ? ' has-shot' : ''}`} onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}>
              {garments[item.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="product-shot" src={garments[item.id]} alt="" />
              ) : (
                <span className="n">{pad2(i + 1)}</span>
              )}
              <span className="name">
                {item.name}
                <small>
                  {item.role} · {sizeLabel(item.role, sizeIdx)}
                </small>
              </span>
              <span className="price">
                {money(item.price)}
                <button type="button" className="chip" onClick={() => addOne(i)} aria-label={`Add ${item.name} to bag`}>
                  {added === item.id ? 'Added' : 'Add'}
                </button>
              </span>
            </li>
          ))}
        </ul>

        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{money(subtotal)}</dd>
          </div>
          <div>
            <dt>Whole fit −10%</dt>
            <dd>−{money(discount)}</dd>
          </div>
          <div className="total">
            <dt>Total</dt>
            <dd>
              <i>$</i>
              {total.toFixed(2)}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          className="bar-btn"
          onClick={() => {
            addLook(look.id, sizeIdx)
            router.push('/cart')
          }}
        >
          Add whole fit to bag <span aria-hidden="true">→</span>
        </button>
        <Link className="bar-btn ghost" href={`/fit-check?look=${look.id}`}>
          Try it on you <span aria-hidden="true">↗</span>
        </Link>

        <Barcode seed={look.id} height={34} />
        <p className="receipt-foot">Thanks for going nowhere.</p>
      </aside>
      </div>

      {(['top', 'bottom', 'shoes'] as Role[]).map((role) => {
        // the other ring looks' pieces of this type come first, then the single pieces
        const more = PRODUCTS.filter((p) => p.role === role && !look.items.some((i) => i.id === p.id))
        return (
          <section key={role} className="more" aria-label={`More ${role === 'top' ? 'tops' : role === 'bottom' ? 'bottoms' : 'shoes'}`}>
            <h3>
              More {role === 'top' ? 'tops' : role === 'bottom' ? 'bottoms' : 'shoes'} <span>{more.length}</span>
            </h3>
            <div className="more-row">
              {more.map((p) => (
                <article key={p.id} className="more-card">
                  <Link href={`/product/${p.id}`} className="more-media" aria-label={p.name}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.image && <img src={p.image} alt="" loading="lazy" draggable={false} />}
                  </Link>
                  <Link href={`/product/${p.id}`} className="more-name">
                    {p.name}
                  </Link>
                  <span className="more-price">
                    {money(p.price)}
                    <button type="button" className="chip" onClick={() => add(p.id, sizeLabel(p.role, sizeIdx))} aria-label={`Add ${p.name} to bag`}>
                      Add
                    </button>
                  </span>
                </article>
              ))}
            </div>
          </section>
        )
      })}
    </section>
  )
}

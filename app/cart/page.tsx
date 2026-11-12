'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import Barcode from '@/components/Barcode'
import Figure, { ItemThumb } from '@/components/Figure'
import TopBar, { ArrowLeft } from '@/components/TopBar'
import { BRAND, TILL, money, sizeLabel } from '@/lib/looks'
import { summarize, useBag } from '@/lib/store'
import './cart.css'

const RULE = '*'.repeat(64)
const keyOf = (id: string, size: string) => `${id}|${size}`

export default function CartPage() {
  const lines = useBag((s) => s.lines)
  const setQty = useBag((s) => s.setQty)
  const remove = useBag((s) => s.remove)
  const add = useBag((s) => s.add)

  // wait for the saved bag before printing, so the paper is cut to the right length
  const [ready, setReady] = useState(false)
  const [printed, setPrinted] = useState(false)
  const [leaving, setLeaving] = useState<string[]>([])
  const [notice, setNotice] = useState(false)
  const [stamp, setStamp] = useState('')
  const initial = useRef<Set<string> | null>(null)

  useEffect(() => {
    const done = () => setReady(true)
    if (useBag.persist.hasHydrated()) done()
    const off = useBag.persist.onFinishHydration(done)
    const t = setTimeout(done, 400)
    setStamp(
      new Date()
        .toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        .replace(',', ' ·'),
    )
    return () => {
      off()
      clearTimeout(t)
    }
  }, [])

  const sum = summarize(lines)
  if (ready && !initial.current) initial.current = new Set(sum.rows.map((r) => keyOf(r.item.id, r.line.size)))

  const empty = sum.rows.length === 0
  const status = !ready || !printed ? 'printing' : 'idle'

  const removeLine = (id: string, size: string) => {
    const k = keyOf(id, size)
    setLeaving((l) => [...l, k])
    setTimeout(() => {
      remove(id, size)
      setLeaving((l) => l.filter((x) => x !== k))
    }, 260)
  }

  return (
    <main className="cart theme-dark">
      <TopBar
        dark
        left={
          <Link href="/" className="circle-btn solid" aria-label="Back to looks">
            <ArrowLeft />
          </Link>
        }
      />

      <div className="cart-head">
        <h1>Your bag</h1>
        <p className="micro">
          <span className={`led ${status}`} aria-hidden="true" />
          {status === 'printing' ? 'Printing…' : empty ? 'Out of paper' : `Ready · ${sum.count} ${sum.count === 1 ? 'item' : 'items'}`}
        </p>
      </div>

      <div className="printer" aria-hidden="true">
        <span className="slot" />
        <span className={`led ${status}`} />
      </div>

      <div className="paper-window">
        {ready && (
          <article className="paper" onAnimationEnd={(e) => e.target === e.currentTarget && setPrinted(true)}>
            <header>
              <span className="paper-brand">
                {BRAND}
                <sup>©</sup>
              </span>
              <span>{TILL}</span>
              <span suppressHydrationWarning>{stamp || ' '}</span>
            </header>

            <p className="pixel">{empty ? 'Empty' : 'Your bag'}</p>

            {empty ? (
              <>
                <p className="rule" aria-hidden="true">
                  {RULE}
                </p>
                <p className="empty-line">Nothing here yet.</p>
                <Link href="/" className="bar-btn">
                  Start shopping <span aria-hidden="true">→</span>
                </Link>
              </>
            ) : (
              <>
                {sum.completeLooks.length > 0 && (
                  <div className="paper-looks" aria-label={`Whole fits: ${sum.completeLooks.map((l) => l.aesthetic).join(', ')}`}>
                    {sum.completeLooks.slice(0, 4).map((l) => (
                      <span key={l.id}>
                        <Figure outfit={l.outfit} />
                      </span>
                    ))}
                  </div>
                )}
                <p className="rule" aria-hidden="true">
                  {RULE}
                </p>

                <ul className="lines">
                  {sum.rows.map(({ line, item, look }, i) => {
                    const k = keyOf(item.id, line.size)
                    const isNew = printed && !initial.current?.has(k)
                    return (
                      <li key={k} className={`${leaving.includes(k) ? 'is-leaving' : ''}${isNew ? ' is-new' : ''}`}>
                        <div className="line">
                          <span className="thumb">
                            <ItemThumb role={item.role} color={item.color} />
                          </span>
                          <div className="what">
                            <span>
                              {String(i + 1).padStart(2, '0')} {item.name}
                            </span>
                            <small>
                              {look.aesthetic} · {item.role} · {line.size}
                            </small>
                            <div className="stepper">
                              <button
                                type="button"
                                onClick={() => setQty(item.id, line.size, line.qty - 1)}
                                disabled={line.qty <= 1}
                                aria-label={`One fewer ${item.name}`}
                              >
                                −
                              </button>
                              <output aria-label="Quantity">{line.qty}</output>
                              <button
                                type="button"
                                onClick={() => setQty(item.id, line.size, line.qty + 1)}
                                disabled={line.qty >= 9}
                                aria-label={`One more ${item.name}`}
                              >
                                +
                              </button>
                              <button type="button" className="remove" onClick={() => removeLine(item.id, line.size)}>
                                Remove<span className="sr-only"> {item.name}</span>
                              </button>
                            </div>
                          </div>
                          <span className="amount">{money(item.price * line.qty)}</span>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                <p className="rule" aria-hidden="true">
                  {RULE}
                </p>

                <dl className="totals" aria-live="polite">
                  <div>
                    <dt>Subtotal</dt>
                    <dd>{money(sum.subtotal)}</dd>
                  </div>
                  {sum.discount > 0 && (
                    <div>
                      <dt>Whole fit −10%</dt>
                      <dd>−{money(sum.discount)}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Shipping</dt>
                    <dd>At checkout</dd>
                  </div>
                  <div className="total">
                    <dt>Total</dt>
                    <dd key={sum.total}>
                      <i>$</i>
                      {sum.total.toFixed(2)}
                    </dd>
                  </div>
                </dl>

                <p className="hand">tear along the dotted line ↓</p>
                <button type="button" className="bar-btn" onClick={() => setNotice(true)}>
                  Checkout <span aria-hidden="true">→</span>
                </button>
                {notice && (
                  <p className="paper-note" role="status">
                    Checkout isn’t built yet. This demo stops at the bag.
                  </p>
                )}

                <div className="paper-tags">
                  <p>
                    {(sum.completeLooks.length ? sum.completeLooks : sum.rows.map((r) => r.look))
                      .filter((l, i, a) => a.indexOf(l) === i)
                      .slice(0, 3)
                      .map((l) => (
                        <span key={l.id}>{l.aesthetic}</span>
                      ))}
                  </p>
                  <Barcode seed={lines.map((l) => `${l.itemId}${l.size}${l.qty}`).join('')} height={40} />
                </div>
              </>
            )}

            <p className="stars" aria-hidden="true">
              ★ ★ ★
            </p>
            <p className="thanks">Thanks for going nowhere.</p>
          </article>
        )}
      </div>

      {ready && sum.missing.length > 0 && (
        <section className="complete" aria-label="Complete the look">
          <h2 className="micro">Complete the look · unlock whole fit −10%</h2>
          <ul>
            {sum.missing.slice(0, 3).map(({ item, look }) => (
              <li key={item.id}>
                <span className="thumb">
                  <ItemThumb role={item.role} color={item.color} />
                </span>
                <span className="what">
                  <strong>{item.name}</strong>
                  <small className="micro">
                    {look.aesthetic} · {money(item.price)}
                  </small>
                </span>
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    const owned = sum.rows.find((r) => r.look.id === look.id && r.item.role !== 'shoes')
                    const idx = owned ? Math.max(0, ['S', 'M', 'L', 'XL'].indexOf(owned.line.size)) : 1
                    add(item.id, sizeLabel(item.role, idx))
                  }}
                >
                  + Add<span className="sr-only"> {item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}

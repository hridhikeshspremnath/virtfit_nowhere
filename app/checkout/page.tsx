'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProductImage } from '@/components/ProductCard'
import TopBar from '@/components/TopBar'
import { money } from '@/lib/looks'
import { SHIPPING, newOrderId, shippingCost, useOrders, useOrdersHydration, type Order } from '@/lib/orders'
import { summarize, useBag } from '@/lib/store'
import '../shop/shop.css'

const FIELDS = [
  { key: 'email', label: 'Email', type: 'email', auto: 'email', wide: true },
  { key: 'name', label: 'Full name', type: 'text', auto: 'name', wide: true },
  { key: 'address', label: 'Address', type: 'text', auto: 'street-address', wide: true },
  { key: 'city', label: 'City', type: 'text', auto: 'address-level2', wide: false },
  { key: 'postcode', label: 'Postcode', type: 'text', auto: 'postal-code', wide: false },
  { key: 'country', label: 'Country', type: 'text', auto: 'country-name', wide: true },
] as const
type Key = (typeof FIELDS)[number]['key']

export default function CheckoutPage() {
  useOrdersHydration()
  const router = useRouter()
  const lines = useBag((s) => s.lines)
  const clear = useBag((s) => s.clear)
  const place = useOrders((s) => s.place)
  const [ready, setReady] = useState(false)
  const [form, setForm] = useState<Record<Key, string>>({ email: '', name: '', address: '', city: '', postcode: '', country: '' })
  const [delivery, setDelivery] = useState<Order['delivery']>('standard')
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({})
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    const done = () => setReady(true)
    if (useBag.persist.hasHydrated()) done()
    const off = useBag.persist.onFinishHydration(done)
    const t = setTimeout(done, 400)
    return () => {
      off()
      clearTimeout(t)
    }
  }, [])

  const sum = summarize(lines)
  const goods = sum.total
  const shipping = shippingCost(delivery, goods)
  const total = Math.round((goods + shipping) * 100) / 100

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    for (const f of FIELDS) if (!form[f.key].trim()) next[f.key] = `Enter your ${f.label.toLowerCase()}`
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'Enter a valid email address'
    setErrors(next)
    if (Object.keys(next).length) {
      document.getElementById(`f-${Object.keys(next)[0]}`)?.focus()
      return
    }
    setPlacing(true)
    const order: Order = {
      id: newOrderId(),
      placedAt: new Date().toISOString(),
      lines: sum.rows.map((r) => ({ itemId: r.item.id, name: r.item.name, size: r.line.size, qty: r.line.qty, price: r.item.price, image: r.item.image })),
      subtotal: sum.subtotal,
      discount: sum.discount,
      shipping,
      total,
      delivery,
      contact: Object.fromEntries(FIELDS.map((f) => [f.key, form[f.key].trim()])) as Order['contact'],
    }
    place(order)
    clear()
    router.push(`/order/${order.id}`)
  }

  if (ready && !sum.rows.length && !placing)
    return (
      <main className="store">
        <TopBar />
        <header className="store-head">
          <h1>Checkout</h1>
          <p>
            Your bag is empty. <Link href="/shop">Go to the shop</Link>
          </p>
        </header>
      </main>
    )

  return (
    <main className="store">
      <TopBar />
      <header className="store-head">
        <h1>Checkout</h1>
        <p>
          <Link href="/cart">← Back to bag</Link>
        </p>
      </header>

      <form className="checkout" onSubmit={submit} noValidate>
        <div className="checkout-main">
          <fieldset>
            <legend>Contact and delivery address</legend>
            <div className="fields">
              {FIELDS.map((f) => (
                <label key={f.key} className={f.wide ? 'wide' : ''}>
                  <span>{f.label}</span>
                  <input
                    id={`f-${f.key}`}
                    type={f.type}
                    autoComplete={f.auto}
                    value={form[f.key]}
                    aria-invalid={!!errors[f.key]}
                    aria-describedby={errors[f.key] ? `e-${f.key}` : undefined}
                    onChange={(e) => {
                      setForm((s) => ({ ...s, [f.key]: e.target.value }))
                      if (errors[f.key]) setErrors((s) => ({ ...s, [f.key]: undefined }))
                    }}
                  />
                  {errors[f.key] && (
                    <small id={`e-${f.key}`} role="alert">
                      {errors[f.key]}
                    </small>
                  )}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Delivery</legend>
            {(Object.keys(SHIPPING) as Order['delivery'][]).map((k) => {
              const cost = shippingCost(k, goods)
              return (
                <label key={k} className="option">
                  <input type="radio" name="delivery" checked={delivery === k} onChange={() => setDelivery(k)} />
                  <span>
                    <strong>{SHIPPING[k].label}</strong>
                    <small>{SHIPPING[k].eta}</small>
                  </span>
                  <em>{cost ? money(cost) : 'Free'}</em>
                </label>
              )
            })}
          </fieldset>

          <fieldset>
            <legend>Payment</legend>
            <p className="pay-note">
              <strong>No payment is taken.</strong> This store has no payment provider connected yet, so placing the order saves it
              on this device and charges nothing. Do not enter card details anywhere on this site.
            </p>
          </fieldset>
        </div>

        <aside className="checkout-side" aria-label="Order summary">
          <h2>Your order</h2>
          <ul>
            {sum.rows.map(({ line, item }) => (
              <li key={`${item.id}|${line.size}`}>
                <span className="thumb">
                  <ProductImage item={item} />
                </span>
                <span className="what">
                  {item.name}
                  <small>
                    {line.size} · ×{line.qty}
                  </small>
                </span>
                <span>{money(item.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <dl>
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
              <dt>Delivery</dt>
              <dd>{shipping ? money(shipping) : 'Free'}</dd>
            </div>
            <div className="total">
              <dt>Total</dt>
              <dd>${total.toFixed(2)}</dd>
            </div>
          </dl>
          <button type="submit" className="buy" disabled={!ready || placing}>
            {placing ? 'Placing order…' : 'Place order'}
          </button>
        </aside>
      </form>
    </main>
  )
}

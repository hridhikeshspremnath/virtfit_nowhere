'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import TopBar from '@/components/TopBar'
import { money } from '@/lib/looks'
import { SHIPPING, useOrders } from '@/lib/orders'
import '../../shop/shop.css'

export default function OrderPage() {
  const { id } = useParams<{ id: string }>()
  const [ready, setReady] = useState(false)
  const order = useOrders((s) => s.orders.find((o) => o.id === id))

  useEffect(() => {
    Promise.resolve(useOrders.persist.rehydrate()).finally(() => setReady(true))
  }, [])

  if (!order)
    return (
      <main className="store">
        <TopBar />
        <header className="store-head">
          <h1>{ready ? 'Order not found' : 'Loading…'}</h1>
          {ready && (
            <p>
              Orders are saved on the device they were placed on. <Link href="/shop">Back to the shop</Link>
            </p>
          )}
        </header>
      </main>
    )

  const c = order.contact
  return (
    <main className="store">
      <TopBar />
      <header className="store-head">
        <p className="micro">Order {order.id}</p>
        <h1>Thank you, {c.name.split(' ')[0]}.</h1>
        <p>
          Your order is saved. No payment was taken, and nothing will ship: this store is not connected to payment or fulfilment
          yet.
        </p>
      </header>

      <section className="order">
        <div>
          <h2>Items</h2>
          <ul className="order-lines">
            {order.lines.map((l) => (
              <li key={`${l.itemId}|${l.size}`}>
                <span className="thumb">
                  {l.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt="" />
                  )}
                </span>
                <span className="what">
                  <Link href={`/product/${l.itemId}`}>{l.name}</Link>
                  <small>
                    {l.size} · ×{l.qty}
                  </small>
                </span>
                <span>{money(l.price * l.qty)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Summary</h2>
          <dl>
            <div>
              <dt>Subtotal</dt>
              <dd>{money(order.subtotal)}</dd>
            </div>
            {order.discount > 0 && (
              <div>
                <dt>Whole fit −10%</dt>
                <dd>−{money(order.discount)}</dd>
              </div>
            )}
            <div>
              <dt>
                {SHIPPING[order.delivery].label} delivery · {SHIPPING[order.delivery].eta}
              </dt>
              <dd>{order.shipping ? money(order.shipping) : 'Free'}</dd>
            </div>
            <div className="total">
              <dt>Total</dt>
              <dd>${order.total.toFixed(2)}</dd>
            </div>
          </dl>
          <h2>Deliver to</h2>
          <address>
            {c.name}
            <br />
            {c.address}
            <br />
            {c.city} {c.postcode}
            <br />
            {c.country}
            <br />
            {c.email}
          </address>
          <Link href="/shop" className="buy">
            Continue shopping
          </Link>
        </div>
      </section>
    </main>
  )
}

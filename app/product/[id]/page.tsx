'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import ProductCard, { ProductImage } from '@/components/ProductCard'
import TopBar from '@/components/TopBar'
import { CATEGORIES, LOOKS, PRODUCTS, SIZE_COUNT, findItem, money, sizeLabel } from '@/lib/looks'
import { useBag } from '@/lib/store'
import '../../shop/shop.css'

export default function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const hit = findItem(id)
  const add = useBag((s) => s.add)
  const [sizeIdx, setSizeIdx] = useState(1)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  if (!hit)
    return (
      <main className="store">
        <TopBar />
        <header className="store-head">
          <h1>Not found</h1>
          <p>
            That product is not in the shop. <Link href="/shop">Back to the shop</Link>
          </p>
        </header>
      </main>
    )

  const { item, look } = hit
  const inLook = LOOKS.includes(look)
  const category = CATEGORIES.find((c) => c.id === item.category)
  const more = (inLook ? look.items.filter((p) => p.id !== item.id) : []).concat(
    PRODUCTS.filter((p) => p.category === item.category && p.id !== item.id && !look.items.includes(p)).slice(0, inLook ? 2 : 4),
  )
  const size = sizeLabel(item.role, sizeIdx)
  const tryOn = item.role === 'top' ? (inLook ? `/fit-check?look=${look.id}` : `/fit-check?item=${item.id}`) : null

  return (
    <main className="store">
      <TopBar />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link> / <Link href={`/shop?category=${item.category}`}>{category?.label}</Link> / <span>{item.name}</span>
      </nav>

      <section className="pdp">
        <div className="pdp-media">
          <ProductImage item={item} />
        </div>

        <div className="pdp-info">
          {inLook && (
            <p className="micro">
              Part of the {look.aesthetic} look · {look.subtitle}
            </p>
          )}
          <h1>{item.name}</h1>
          <p className="pdp-price">{money(item.price)}</p>

          <div className="pdp-row" role="group" aria-label="Size">
            <span className="micro">Size</span>
            <div className="seg">
              {Array.from({ length: SIZE_COUNT }, (_, i) => (
                <button key={i} type="button" aria-pressed={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                  {sizeLabel(item.role, i)}
                </button>
              ))}
            </div>
          </div>

          <div className="pdp-row" role="group" aria-label="Quantity">
            <span className="micro">Quantity</span>
            <div className="qty">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="One fewer">
                −
              </button>
              <output>{qty}</output>
              <button type="button" onClick={() => setQty((q) => Math.min(9, q + 1))} disabled={qty >= 9} aria-label="One more">
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            className="buy"
            onClick={() => {
              add(item.id, size, qty)
              setAdded(true)
              setTimeout(() => setAdded(false), 2400)
            }}
          >
            {added ? 'Added to bag ✓' : `Add to bag · ${money(item.price * qty)}`}
          </button>
          {added && (
            <Link href="/cart" className="buy ghost">
              View bag →
            </Link>
          )}
          {tryOn && (
            <Link href={tryOn} className="buy ghost">
              Try it on your photo ↗
            </Link>
          )}

          <ul className="pdp-facts">
            <li>Free standard delivery over $150</li>
            <li>Free returns within 30 days</li>
            {inLook && <li>Buy all three pieces of the look for 10% off</li>}
          </ul>
        </div>
      </section>

      {more.length > 0 && (
        <section className="more" aria-label={inLook ? 'Complete the look' : 'You may also like'}>
          <h2>{inLook ? 'Complete the look' : 'You may also like'}</h2>
          <div className="grid">
            {more.map((p) => (
              <ProductCard key={p.id} item={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}

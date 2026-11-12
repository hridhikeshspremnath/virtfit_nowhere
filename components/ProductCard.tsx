'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ItemThumb } from './Figure'
import { money, sizeLabel, type Item } from '@/lib/looks'
import { useBag } from '@/lib/store'

/** Product photo, or the drawn glyph when a product has none. */
export function ProductImage({ item }: { item: Item }) {
  return item.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={item.image} alt="" loading="lazy" draggable={false} />
  ) : (
    <ItemThumb role={item.role} color={item.color} />
  )
}

export default function ProductCard({ item }: { item: Item }) {
  const add = useBag((s) => s.add)
  const [added, setAdded] = useState(false)
  return (
    <article className="card">
      <div className="card-top">
        <Link href={`/product/${item.id}`} className="card-media" aria-label={item.name}>
          <ProductImage item={item} />
        </Link>
        <button
          type="button"
          className="card-add"
          onClick={() => {
            add(item.id, sizeLabel(item.role, 1))
            setAdded(true)
            setTimeout(() => setAdded(false), 1400)
          }}
          aria-label={`Add ${item.name} to bag, size ${sizeLabel(item.role, 1)}`}
        >
          {added ? 'Added ✓' : `Quick add · ${sizeLabel(item.role, 1)}`}
        </button>
      </div>
      <div className="card-info">
        <Link href={`/product/${item.id}`} className="card-name">
          {item.name}
        </Link>
        <span className="card-price">{money(item.price)}</span>
      </div>
    </article>
  )
}

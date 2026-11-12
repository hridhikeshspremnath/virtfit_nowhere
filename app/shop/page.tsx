'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useMemo, useState } from 'react'
import ProductCard from '@/components/ProductCard'
import TopBar from '@/components/TopBar'
import { CATEGORIES, PRODUCTS, type Category } from '@/lib/looks'
import './shop.css'

type Sort = 'featured' | 'low' | 'high' | 'name'

function Shop() {
  const router = useRouter()
  const params = useSearchParams()
  const category = (CATEGORIES.find((c) => c.id === params.get('category'))?.id ?? 'all') as Category | 'all'
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('featured')

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: PRODUCTS.length }
    for (const p of PRODUCTS) m[p.category] = (m[p.category] ?? 0) + 1
    return m
  }, [])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = PRODUCTS.filter((p) => (category === 'all' || p.category === category) && (!q || p.name.toLowerCase().includes(q)))
    if (sort === 'low') return [...list].sort((a, b) => a.price - b.price)
    if (sort === 'high') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [category, query, sort])

  const pick = (id: Category | 'all') => router.replace(id === 'all' ? '/shop' : `/shop?category=${id}`, { scroll: false })

  return (
    <main className="store">
      <TopBar />
      <header className="store-head">
        <h1>Shop</h1>
        <p>
          {shown.length} {shown.length === 1 ? 'piece' : 'pieces'}
          {category !== 'all' && ` in ${CATEGORIES.find((c) => c.id === category)?.label.toLowerCase()}`}
        </p>
      </header>

      <div className="store-tools">
        <nav className="chips" aria-label="Category">
          {[{ id: 'all' as const, label: 'All' }, ...CATEGORIES].map((c) => (
            <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => pick(c.id)}>
              {c.label} <small>{counts[c.id] ?? 0}</small>
            </button>
          ))}
        </nav>
        <div className="store-find">
          <input type="search" placeholder="Search" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
            <option value="featured">Featured</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {shown.length ? (
        <section className="grid" aria-label="Products">
          {shown.map((p) => (
            <ProductCard key={p.id} item={p} />
          ))}
        </section>
      ) : (
        <p className="store-empty">
          Nothing matches “{query}”.{' '}
          <button type="button" onClick={() => setQuery('')}>
            Clear search
          </button>
        </p>
      )}
    </main>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<main className="store" />}>
      <Shop />
    </Suspense>
  )
}

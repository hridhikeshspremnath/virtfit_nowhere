'use client'

import { useEffect } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { LOOKS, WHOLE_FIT_DISCOUNT, findItem, sizeLabel, type Item, type Look } from './looks'

export type Line = { itemId: string; size: string; qty: number }

type BagState = {
  lines: Line[]
  add: (itemId: string, size: string, qty?: number) => void
  addLook: (lookId: string, sizeIdx?: number) => void
  setQty: (itemId: string, size: string, qty: number) => void
  remove: (itemId: string, size: string) => void
  clear: () => void
}

const same = (l: Line, itemId: string, size: string) => l.itemId === itemId && l.size === size

export const useBag = create<BagState>()(
  persist(
    (set) => ({
      lines: [],
      add: (itemId, size, qty = 1) =>
        set((s) => {
          const hit = s.lines.find((l) => same(l, itemId, size))
          if (hit) return { lines: s.lines.map((l) => (l === hit ? { ...l, qty: Math.min(9, l.qty + qty) } : l)) }
          return { lines: [...s.lines, { itemId, size, qty }] }
        }),
      addLook: (lookId, sizeIdx = 1) =>
        set((s) => {
          const look = LOOKS.find((l) => l.id === lookId)
          if (!look) return s
          let lines = s.lines
          for (const item of look.items) {
            const size = sizeLabel(item.role, sizeIdx)
            const hit = lines.find((l) => same(l, item.id, size))
            lines = hit
              ? lines.map((l) => (l === hit ? { ...l, qty: Math.min(9, l.qty + 1) } : l))
              : [...lines, { itemId: item.id, size, qty: 1 }]
          }
          return { lines }
        }),
      setQty: (itemId, size, qty) =>
        set((s) => ({
          lines: s.lines.map((l) => (same(l, itemId, size) ? { ...l, qty: Math.max(1, Math.min(9, qty)) } : l)),
        })),
      remove: (itemId, size) => set((s) => ({ lines: s.lines.filter((l) => !same(l, itemId, size)) })),
      clear: () => set({ lines: [] }),
    }),
    { name: 'nowhere-bag-v1', skipHydration: true },
  ),
)

/** Call once per page: loads the saved bag after first paint so server and client markup match. */
export function useBagHydration() {
  useEffect(() => {
    try {
      void useBag.persist.rehydrate()
    } catch {
      /* storage unavailable: the bag simply starts empty */
    }
  }, [])
}

export type Row = { line: Line; item: Item; look: Look }

export type Summary = {
  rows: Row[]
  count: number
  subtotal: number
  discount: number
  total: number
  /** looks that have all three pieces in the bag */
  completeLooks: Look[]
  /** pieces missing from looks that are partly in the bag */
  missing: { item: Item; look: Look }[]
}

/**
 * Whole-fit rule (same on the look page and in the cart): for every complete
 * set of a look's three pieces in the bag, that set is 10% off.
 */
export function summarize(lines: Line[]): Summary {
  const rows: Row[] = []
  for (const line of lines) {
    const hit = findItem(line.itemId)
    if (hit) rows.push({ line, item: hit.item, look: hit.look })
  }
  const count = rows.reduce((n, r) => n + r.line.qty, 0)
  const subtotal = rows.reduce((n, r) => n + r.item.price * r.line.qty, 0)

  let discount = 0
  const completeLooks: Look[] = []
  const missing: Summary['missing'] = []
  for (const look of LOOKS) {
    const qtys = look.items.map((it) => rows.filter((r) => r.item.id === it.id).reduce((n, r) => n + r.line.qty, 0))
    const sets = Math.min(...qtys)
    if (sets > 0) {
      completeLooks.push(look)
      discount += sets * look.items.reduce((n, it) => n + it.price, 0) * WHOLE_FIT_DISCOUNT
    } else if (qtys.some((q) => q > 0)) {
      look.items.forEach((it, i) => {
        if (qtys[i] === 0) missing.push({ item: it, look })
      })
    }
  }
  discount = Math.round(discount * 100) / 100
  return { rows, count, subtotal, discount, total: Math.round((subtotal - discount) * 100) / 100, completeLooks, missing }
}

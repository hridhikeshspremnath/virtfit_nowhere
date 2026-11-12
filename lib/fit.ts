import type { TopKind } from './looks'

export const SIZES = ['S', 'M', 'L', 'XL'] as const
export type Size = (typeof SIZES)[number]

/** Body measurements in cm. */
export type Body = { height: number; chest: number; waist: number; hips: number }
export const DEFAULT_BODY: Body = { height: 175, chest: 96, waist: 82, hips: 98 }

/** Garment circumferences in cm for one size. */
export type GarmentSpec = { chest: number; waist: number; hem: number }

type Category = { chestM: number; ease: [number, number]; label: string }

// Placeholder size charts: chest circumference of a size M and the comfortable
// chest-ease window for each category. Real product specs replace these.
const CATEGORY: Record<TopKind, Category> = {
  tee: { chestM: 104, ease: [6, 12], label: 'Tee' },
  crew: { chestM: 108, ease: [8, 14], label: 'Knit' },
  shirt: { chestM: 110, ease: [8, 14], label: 'Shirt' },
  cardigan: { chestM: 110, ease: [8, 16], label: 'Cardigan' },
  hoodie: { chestM: 118, ease: [12, 22], label: 'Hoodie' },
  jacket: { chestM: 116, ease: [12, 20], label: 'Jacket' },
  coat: { chestM: 120, ease: [14, 24], label: 'Coat' },
}

const STEP = 6

export function specFor(kind: TopKind, size: Size): GarmentSpec {
  const chest = CATEGORY[kind].chestM + (SIZES.indexOf(size) - 1) * STEP
  return { chest, waist: chest - 2, hem: chest - 2 }
}

export const easeWindow = (kind: TopKind) => CATEGORY[kind].ease

export type Fit = {
  size: Size
  spec: GarmentSpec
  chest: number
  waist: number
  hem: number
  /** 0..1 is the comfortable window; below 0 is tight, above 1 is loose */
  t: { chest: number; waist: number; hem: number }
  verdict: 'tight' | 'fitted' | 'regular' | 'relaxed' | 'oversized'
}

export function fitFor(kind: TopKind, size: Size, body: Body): Fit {
  const spec = specFor(kind, size)
  const [lo, hi] = CATEGORY[kind].ease
  const chest = spec.chest - body.chest
  const waist = spec.waist - body.waist
  const hem = spec.hem - body.hips
  const norm = (ease: number, shift = 0) => (ease - (lo + shift)) / (hi - lo)
  // waist and hem can sit closer than the chest before they feel tight
  const t = { chest: norm(chest), waist: norm(waist, -4), hem: norm(hem, -4) }
  const worst = Math.min(t.chest, t.waist, t.hem)
  const verdict: Fit['verdict'] =
    worst < 0 ? 'tight' : t.chest < 0.34 ? 'fitted' : t.chest <= 1 ? 'regular' : t.chest <= 2 ? 'relaxed' : 'oversized'
  return { size, spec, chest, waist, hem, t, verdict }
}

export function recommend(kind: TopKind, body: Body): { size: Size; exact: boolean } {
  const fits = SIZES.map((s) => fitFor(kind, s, body))
  const ok = fits.find((f) => Math.min(f.t.chest, f.t.waist, f.t.hem) >= 0)
  if (ok) return { size: ok.size, exact: true }
  return { size: 'XL', exact: false }
}

export const signed = (n: number) => `${n >= 0 ? '+' : '−'}${Math.abs(Math.round(n))} cm`

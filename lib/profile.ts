'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * The shopper's profile: their photo, plus the try-on stills made from it this session.
 * The photo is kept in this browser only (localStorage); stills are kept in memory.
 */
type Profile = {
  photo: string | null
  /** standing height in cm; scales the pose into real proportions */
  height: number
  results: Record<string, string>
  setPhoto: (photo: string | null) => void
  setHeight: (height: number) => void
  setResult: (lookId: string, url: string) => void
}

export const useProfile = create<Profile>()(
  persist(
    (set) => ({
      photo: null,
      height: 175,
      results: {},
      setPhoto: (photo) => set({ photo, results: {} }),
      setHeight: (height) => set({ height }),
      setResult: (lookId, url) => set((s) => ({ results: { ...s.results, [lookId]: url } })),
    }),
    { name: 'nowhere-profile-v1', skipHydration: true, partialize: (s) => ({ photo: s.photo, height: s.height }) },
  ),
)

export function useProfileHydration() {
  useEffect(() => {
    void useProfile.persist.rehydrate()
  }, [])
}

/** Real photography dropped into public/looks and public/garments, keyed by file name without extension. */
type Spot = { x: number; y: number } | null
export type Assets = {
  looks: Record<string, string>
  garments: Record<string, string>
  /** where top / bottom / shoes sit in each look photo, in % */
  hotspots: Record<string, { top: Spot; bottom: Spot; shoes: Spot }>
}
const EMPTY: Assets = { looks: {}, garments: {}, hotspots: {} }
let cache: Promise<Assets> | null = null

export function useAssets() {
  const [assets, setAssets] = useState<Assets>(EMPTY)
  useEffect(() => {
    cache ??= fetch('/api/assets')
      .then((r) => (r.ok ? r.json() : EMPTY))
      .catch(() => EMPTY)
    let on = true
    cache.then((a) => on && setAssets(a))
    return () => {
      on = false
    }
  }, [])
  return assets
}

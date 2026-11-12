'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { ProductImage } from '@/components/ProductCard'
import TopBar, { ArrowLeft } from '@/components/TopBar'
import { GarmentOverlay, ProfilePhoto } from '@/components/TryOn'
import { PRODUCTS, SIZE_COUNT, findItem, findLook, money, sizeLabel, type Category, type Item, type Role } from '@/lib/looks'
import { detectPose, type Landmark } from '@/lib/pose'
import { useProfile, useProfileHydration } from '@/lib/profile'
import { useBag } from '@/lib/store'
import './room.css'

const TABS: { id: string; label: string; cats: Category[] }[] = [
  { id: 'tops', label: 'Tops', cats: ['tops', 'dresses'] },
  { id: 'bottoms', label: 'Bottoms', cats: ['trousers', 'skirts', 'shorts'] },
  { id: 'outerwear', label: 'Outerwear', cats: ['jackets'] },
  { id: 'shoes', label: 'Shoes', cats: ['shoes'] },
]
const SIDE = 3 // cards on each side of the person

/**
 * The fitting room: the shopper's photo in the middle, garments on glass cards either side.
 * Picking a top or jacket lays it over the photo at the shoulders; bottoms and shoes can be picked and bought but are not drawn on.
 */
function FittingRoom() {
  useProfileHydration()
  const params = useSearchParams()
  const photo = useProfile((s) => s.photo)
  const add = useBag((s) => s.add)

  const [profile, setProfile] = useState(false)
  const [tab, setTab] = useState('tops')
  const [offset, setOffset] = useState(0)
  const [worn, setWorn] = useState<Partial<Record<Role, Item>>>(() => {
    const single = findItem(params.get('item'))?.item
    if (single) return { [single.role]: single }
    const look = findLook(params.get('look'))
    return look ? { top: look.items[0] } : {}
  })
  const [focus, setFocus] = useState<Role>(() => findItem(params.get('item'))?.item.role ?? 'top')
  const [sizeIdx, setSizeIdx] = useState(1)
  const [added, setAdded] = useState(false)
  // photo-real results by garment id, for the current photo only
  const [real, setReal] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pose, setPose] = useState<{ status: 'none' | 'reading' | 'found' | 'missing'; landmarks: Landmark[] | null }>({ status: 'none', landmarks: null })

  // read the pose from the photo, on this device
  useEffect(() => {
    setReal({})
    setError(null)
    if (!photo) return setPose({ status: 'none', landmarks: null })
    let on = true
    setPose({ status: 'reading', landmarks: null })
    detectPose(photo)
      .then((lm) => on && setPose(lm ? { status: 'found', landmarks: lm } : { status: 'missing', landmarks: null }))
      .catch(() => on && setPose({ status: 'missing', landmarks: null }))
    return () => {
      on = false
    }
  }, [photo])

  const items = useMemo(() => {
    const cats = TABS.find((t) => t.id === tab)!.cats
    return PRODUCTS.filter((p) => cats.includes(p.category) && p.image)
  }, [tab])
  const at = (k: number) => items[(((offset + k) % items.length) + items.length) % items.length]
  const left = Array.from({ length: Math.min(SIDE, items.length) }, (_, k) => at(k))
  const right = Array.from({ length: Math.min(SIDE, Math.max(0, items.length - SIDE)) }, (_, k) => at(SIDE + k))

  const wear = (item: Item) => {
    setWorn((w) => ({ ...w, [item.role]: item }))
    setFocus(item.role)
  }
  const current = worn[focus] ?? worn.top ?? worn.bottom ?? worn.shoes
  const top = worn.top
  const dressed = top ? real[top.id] : undefined

  const makeReal = async () => {
    if (!top?.image || !photo || busy) return
    setBusy(top.id)
    setError(null)
    try {
      const ask = () => fetch('/api/vton', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ person: photo, garment: top.image, name: top.name }) })
      let res = await ask()
      if (res.status === 502) res = await ask() // the free service drops the odd request; one retry usually lands
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.url) throw new Error(j?.message || 'Could not make the picture. Try again.')
      setReal((r) => ({ ...r, [top.id]: j.url }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not make the picture. Try again.')
    } finally {
      setBusy(null)
    }
  }

  const card = (item: Item, i: number) => (
    <button key={item.id} type="button" className={`g-card d${i}${worn[item.role]?.id === item.id ? ' is-on' : ''}`} onClick={() => wear(item)}>
      <span className="g-img">
        <ProductImage item={item} />
      </span>
      <strong>{item.name}</strong>
      <em>{money(item.price)}</em>
      <i aria-hidden="true">Try on</i>
    </button>
  )

  return (
    <main className="room">
      <TopBar
        left={
          <>
            <Link href="/" className="circle-btn solid" aria-label="Return to styles">
              <ArrowLeft />
            </Link>
            <ProfilePhoto open={profile} onOpen={setProfile} />
          </>
        }
      />
      <p className="room-word" aria-hidden="true">
        FIT
      </p>

      <nav className="room-tabs seg glass" aria-label="Category">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => {
              setTab(t.id)
              setOffset(0)
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="room-row">
        <button type="button" className="circle-btn glass" onClick={() => setOffset((o) => o - 1)} aria-label="Previous garments">
          <ArrowLeft />
        </button>
        <div className="rail left">{left.map((it, i) => card(it, left.length - 1 - i))}</div>

        <div className="person">
          {photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="person-photo" src={dressed ?? photo} alt={dressed ? `You wearing the ${top?.name}` : 'Your photo'} draggable={false} />
              {pose.landmarks && !dressed && (
                <span className="you-garment">
                  {worn.top?.image && <GarmentOverlay src={worn.top.image} pose={pose.landmarks} />}
                </span>
              )}
              {busy && (
                <span className="you-busy" role="status">
                  <i aria-hidden="true" />
                  <span>Dressing you in the {top?.name}… about half a minute</span>
                </span>
              )}
              {top?.image && !dressed && !busy && (
                <button type="button" className="pill solid person-real" onClick={makeReal}>
                  Make it real ✦
                </button>
              )}
              {error && !busy && (
                <span className="person-note glass" role="alert">
                  {error}
                </span>
              )}
              {pose.status !== 'found' && !error && (
                <span className="person-note glass" role="status">
                  {pose.status === 'reading' ? 'Finding your pose…' : 'Could not find your shoulders. Try a photo facing the camera.'}
                </span>
              )}
            </>
          ) : (
            <button type="button" className="you-drop" onClick={() => setProfile(true)}>
              <strong>Your photo goes here</strong>
              <span className="hint">Add it from Profile, then tap any garment to try it on.</span>
              <span className="pill solid">Open profile</span>
            </button>
          )}
        </div>

        <div className="rail right">{right.map((it, i) => card(it, i))}</div>
        <button type="button" className="circle-btn glass flip" onClick={() => setOffset((o) => o + 1)} aria-label="More garments">
          <ArrowLeft />
        </button>
      </div>

      {current && (
        <div className="room-bar glass">
          <span className="thumb">
            <ProductImage item={current} />
          </span>
          <span className="what">
            <strong>{current.name}</strong>
            <em>{money(current.price)}</em>
          </span>
          <div className="seg small" role="group" aria-label="Size">
            {Array.from({ length: SIZE_COUNT }, (_, i) => (
              <button key={i} type="button" aria-pressed={sizeIdx === i} onClick={() => setSizeIdx(i)}>
                {sizeLabel(current.role, i)}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="pill solid"
            onClick={() => {
              add(current.id, sizeLabel(current.role, sizeIdx))
              setAdded(true)
              setTimeout(() => setAdded(false), 1500)
            }}
          >
            {added ? 'Added ✓' : 'Add to bag'}
          </button>
        </div>
      )}
    </main>
  )
}

export default function FitCheckPage() {
  return (
    <Suspense fallback={<main className="room" />}>
      <FittingRoom />
    </Suspense>
  )
}

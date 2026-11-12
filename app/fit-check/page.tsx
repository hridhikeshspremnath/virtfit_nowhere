'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import type { Clip } from '@/components/FitStage'
import { ProductImage } from '@/components/ProductCard'
import TopBar, { ArrowLeft } from '@/components/TopBar'
import { ProfilePhoto } from '@/components/TryOn'
import { PRODUCTS, SIZE_COUNT, findItem, findLook, money, sizeLabel, type Category, type Item, type Role } from '@/lib/looks'
import { DEFAULT_BODY, SIZES, fitFor } from '@/lib/fit'
import type { Outfit, TopKind } from '@/lib/looks'
import { averageColor, bodyFromPose, detectPose, faceTexture, type Landmark } from '@/lib/pose'
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
// one stable object, so the camera turns to face the avatar once and then stays under the user's control
const FRONT = { name: 'front' as const, n: 1 }
const FitStage = dynamic(() => import('@/components/FitStage'), { ssr: false })
const MOTIONS: { id: Clip; label: string }[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'walk', label: 'Walk' },
  { id: 'turn', label: '360' },
  { id: 'arms', label: 'Reach up' },
  { id: 'twist', label: 'Twist' },
  { id: 'break', label: 'Breakdance' },
]

/** the avatar's top: shape from the product, colour from its picture */
const topKind = (item?: Item): TopKind =>
  item?.category === 'jackets' ? 'jacket' : item && /shirt|blouse/i.test(item.name) ? 'shirt' : item && /sweater|knit/i.test(item.name) ? 'crew' : 'tee'

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
  const [mode, setMode] = useState<'photo' | '3d'>('photo')
  const [clip, setClip] = useState<Clip>('idle')
  const [heat, setHeat] = useState(false)
  const [color, setColor] = useState('#d8d8d4')
  const [face, setFace] = useState<{ canvas: HTMLCanvasElement; skin: string } | null>(null)
  const height = useProfile((s) => s.height)
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

  // the face, and the garment's colour, for the 3D body
  useEffect(() => {
    setFace(null)
    if (photo && pose.landmarks) faceTexture(photo, pose.landmarks).then(setFace).catch(() => {})
  }, [photo, pose.landmarks])
  const topItem = worn.top
  useEffect(() => {
    if (topItem?.image) averageColor(topItem.image).then(setColor).catch(() => {})
  }, [topItem?.image])

  const body = useMemo(() => (pose.landmarks ? bodyFromPose(pose.landmarks, height || 175) : null) ?? DEFAULT_BODY, [pose.landmarks, height])
  const size = SIZES[Math.min(sizeIdx, SIZES.length - 1)]
  const kind = topKind(topItem)
  const outfit: Outfit = useMemo(
    () => ({
      skin: face?.skin ?? '#c9a07f',
      hair: '#2b1b14',
      hairStyle: 'short',
      top: { kind, color, sleeve: kind === 'tee' ? 'short' : 'long' },
      bottom: { kind: 'trousers', color: '#2c2f36' },
      shoes: { kind: 'sneaker', color: '#eeeeea', sole: '#d9d5ca' },
    }),
    [face, kind, color],
  )
  const fit = useMemo(() => fitFor(kind, size, body), [kind, size, body])

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

      {photo && (
        <div className="seg glass small room-mode" role="group" aria-label="View">
          <button type="button" aria-pressed={mode === 'photo'} onClick={() => setMode('photo')}>
            Photo
          </button>
          <button type="button" aria-pressed={mode === '3d'} onClick={() => setMode('3d')}>
            3D
          </button>
        </div>
      )}
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
          {photo && mode === '3d' ? (
            <>
              <div className="person-3d">
                <FitStage body={body} outfit={outfit} fit={fit} heatmap={heat} clip={clip} view={FRONT} resetSignal={0} face={face?.canvas} onUnsupported={() => setMode('photo')} />
              </div>
              <div className="stage-ctl">
                <div className="seg glass small" role="group" aria-label="Motion">
                  {MOTIONS.map((m) => (
                    <button key={m.id} type="button" aria-pressed={clip === m.id} onClick={() => setClip(m.id)}>
                      {m.label}
                    </button>
                  ))}
                </div>
                <button type="button" className="pill glass heat" aria-pressed={heat} onClick={() => setHeat((h) => !h)}>
                  Fit heatmap
                </button>
              </div>
              <span className="person-note glass" role="status">
                {pose.landmarks ? `Built from your photo and ${body.height} cm · estimate · stays on this device` : 'Standard body: add a full-length photo to shape it like you.'}
                {heat && ' Red is tight, blue is loose.'}
              </span>
            </>
          ) : photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="person-photo" src={dressed ?? photo} alt={dressed ? `You wearing the ${top?.name}` : 'Your photo'} draggable={false} />
              {busy && (
                <span className="you-busy" role="status">
                  <i aria-hidden="true" />
                  <span>Dressing you in the {top?.name}… about half a minute</span>
                </span>
              )}
              {top?.image && !dressed && !busy && (
                <button type="button" className="pill solid person-real" onClick={makeReal}>
                  Try it on ✦
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

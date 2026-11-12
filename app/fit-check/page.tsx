'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useState } from 'react'
import type { Clip, View } from '@/components/FitStage'
import TopBar, { ArrowLeft } from '@/components/TopBar'
import { ProfilePhoto, TryOnStage } from '@/components/TryOn'
import { DEFAULT_BODY, SIZES, fitFor, type Size } from '@/lib/fit'
import { LOOKS, findLook, money, pad2 } from '@/lib/looks'
import { bodyFromPose, detectPose, type Landmark } from '@/lib/pose'
import { useAssets, useProfile, useProfileHydration } from '@/lib/profile'
import { useBag } from '@/lib/store'
import './fit.css'

const FitStage = dynamic(() => import('@/components/FitStage'), { ssr: false })

const CLIPS: { id: Clip; label: string }[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'walk', label: 'Walk' },
  { id: 'turn', label: '360' },
  { id: 'arms', label: 'Arms up' },
]
const VIEWS: View[] = ['front', 'side', 'back']

type PoseState = { status: 'none' | 'reading' | 'found' | 'missing' | 'failed'; landmarks: Landmark[] | null }

/**
 * Fit Check (design.md Part B, trimmed to its core): the shopper's photo with the detected pose
 * drawn over it, and a 3D avatar built from that pose which can be turned and posed.
 */
function FitCheck() {
  useProfileHydration()
  const router = useRouter()
  const params = useSearchParams()
  const look = findLook(params.get('look')) ?? LOOKS[0]
  const item = look.items[0]
  const kind = look.outfit.top.kind

  const photo = useProfile((s) => s.photo)
  const { garments } = useAssets()
  const height = useProfile((s) => s.height)
  const [profile, setProfile] = useState(false)
  const [pose, setPose] = useState<PoseState>({ status: 'none', landmarks: null })
  const [size, setSize] = useState<Size>('M')
  const [clip, setClip] = useState<Clip>('idle')
  const [view, setView] = useState<{ name: View; n: number }>({ name: 'front', n: 0 })
  const [reset, setReset] = useState(0)
  const [unsupported, setUnsupported] = useState(false)
  const [added, setAdded] = useState(false)
  const add = useBag((s) => s.add)

  // read the pose from the photo, on this device
  useEffect(() => {
    if (!photo) return setPose({ status: 'none', landmarks: null })
    let on = true
    setPose({ status: 'reading', landmarks: null })
    detectPose(photo)
      .then((lm) => on && setPose(lm ? { status: 'found', landmarks: lm } : { status: 'missing', landmarks: null }))
      .catch(() => on && setPose({ status: 'failed', landmarks: null }))
    return () => {
      on = false
    }
  }, [photo])

  const measured = useMemo(() => (pose.landmarks ? bodyFromPose(pose.landmarks, height || 175) : null), [pose.landmarks, height])
  const body = measured ?? DEFAULT_BODY
  const fit = useMemo(() => fitFor(kind, size, body), [kind, size, body])

  const go = (dir: number) => {
    const next = LOOKS[(look.index + dir + LOOKS.length) % LOOKS.length]
    router.replace(`/fit-check?look=${next.id}`, { scroll: false })
  }

  const note = !photo
    ? 'Standard avatar. Add your photo in Profile to shape it like you.'
    : pose.status === 'reading'
      ? 'Reading your pose on this device…'
      : pose.status === 'failed'
        ? 'Pose detection could not load. Showing a standard avatar.'
        : !measured
          ? 'Could not see your whole body, head to ankles. Showing a standard avatar.'
          : `Shaped from your photo and ${body.height} cm height · estimate`

  return (
    <main className="fit fit-duo theme-dark">
      <TopBar
        dark
        left={
          <>
            <Link href="/" className="circle-btn solid" aria-label="Return to styles">
              <ArrowLeft />
            </Link>
            <ProfilePhoto open={profile} onOpen={setProfile} />
          </>
        }
      />

      <div className="fit-look">
        <button type="button" className="circle-btn glass" onClick={() => go(-1)} aria-label="Previous style">
          <ArrowLeft />
        </button>
        <div>
          <span className="micro">
            {pad2(look.index + 1)} / {pad2(LOOKS.length)} · {look.aesthetic}
          </span>
          <strong>{item.name}</strong>
        </div>
        <button type="button" className="circle-btn glass flip" onClick={() => go(1)} aria-label="Next style">
          <ArrowLeft />
        </button>
      </div>

      <section className="fit-pair">
        <figure className="fit-card">
          <TryOnStage look={look} onNeedPhoto={() => setProfile(true)} pose={pose.landmarks} garment={garments[item.id]} />
          <figcaption className="micro">Your photo</figcaption>
        </figure>

        <figure className="fit-card">
          <div className="fit-3d">
            {unsupported ? (
              <div className="fit-fallback">
                <h2>3D isn’t available on this device.</h2>
                <p>The fitting room needs WebGL.</p>
              </div>
            ) : (
              <FitStage
                body={body}
                outfit={look.outfit}
                fit={fit}
                heatmap={false}
                clip={clip}
                view={view}
                resetSignal={reset}
                onUnsupported={() => setUnsupported(true)}
              />
            )}
          </div>
          <figcaption className="micro">{note}</figcaption>
        </figure>
      </section>

      <div className="fit-bar glass">
        {!unsupported && (
          <>
            <div className="seg small" role="group" aria-label="Pose">
              {CLIPS.map((c) => (
                <button key={c.id} type="button" aria-pressed={clip === c.id} onClick={() => setClip(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
            <div className="seg small" role="group" aria-label="Camera view">
              {VIEWS.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    if (clip === 'turn') setClip('idle')
                    setView((s) => ({ name: v, n: s.n + 1 }))
                  }}
                >
                  {v}
                </button>
              ))}
              <button type="button" onClick={() => setReset((n) => n + 1)} aria-label="Reset camera">
                ⟲
              </button>
            </div>
          </>
        )}
        <div className="seg small" role="group" aria-label="Size">
          {SIZES.map((s) => (
            <button key={s} type="button" aria-pressed={size === s} onClick={() => setSize(s)}>
              {s}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="pill solid"
          onClick={() => {
            add(item.id, size)
            setAdded(true)
            setTimeout(() => setAdded(false), 1600)
          }}
        >
          {added ? 'Added' : `Add ${size} · ${money(item.price)}`}
        </button>
      </div>
    </main>
  )
}

export default function FitCheckPage() {
  return (
    <Suspense fallback={<main className="fit theme-dark" />}>
      <FitCheck />
    </Suspense>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { MOTIONS, type MotionId } from '@/lib/motions'
import type { Look } from '@/lib/looks'
import { BONES, JOINTS, detectPose, type Landmark } from '@/lib/pose'
import { useProfile } from '@/lib/profile'
import '@/app/home.css'

/**
 * Virtual try-on on the shopper's own photo.
 * ProfilePhoto — the profile control where the photo is added, changed or removed.
 * TryOnStage  — the photo itself: try-on still for the chosen style, then an optional motion clip.
 * The photo stays in this browser; it is sent to the try-on service only when "Try on" is tapped.
 */

const W = 768
const H = 1024

/** Fits the photo into the 3:4 frame try-on models expect, without cropping anyone's head or feet. */
async function prepare(file: File) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('no canvas')
  ctx.fillStyle = '#f1f1ef'
  ctx.fillRect(0, 0, W, H)
  const k = Math.min(W / bmp.width, H / bmp.height)
  const w = bmp.width * k
  const h = bmp.height * k
  ctx.drawImage(bmp, (W - w) / 2, (H - h) / 2, w, h)
  bmp.close()
  return canvas.toDataURL('image/jpeg', 0.88)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Starts a job, then polls until the model hands back a URL. */
async function run(path: string, body: unknown, alive: () => boolean) {
  const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const started = await res.json().catch(() => null)
  if (!res.ok || !started?.id) throw new Error(started?.message || 'Could not start. Try again.')
  const deadline = Date.now() + 6 * 60_000
  while (Date.now() < deadline) {
    await sleep(2500)
    if (!alive()) throw new Error('cancelled')
    const p = await fetch(`/api/prediction?id=${started.id}`).then((r) => r.json()).catch(() => null)
    if (p?.status === 'succeeded' && p.output) return p.output as string
    if (!p || p.code || p.status === 'failed' || p.status === 'canceled') throw new Error(p?.error || p?.message || 'It did not finish. Try again.')
  }
  throw new Error('That took too long. Try again.')
}

const Person = ({ size = 16 }: { size?: number }) => (
  <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
    <circle cx="16" cy="10" r="5" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M6 27c0-6 4.500-9.500 10-9.500S26 21 26 27" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

/** Profile button + panel. `open`/`onOpen` let the stage's empty state point people here. */
export function ProfilePhoto({ open, onOpen }: { open: boolean; onOpen: (open: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const photo = useProfile((s) => s.photo)
  const setPhoto = useProfile((s) => s.setPhoto)
  const height = useProfile((s) => s.height)
  const setHeight = useProfile((s) => s.setHeight)
  const [error, setError] = useState<string | null>(null)
  const [over, setOver] = useState(false)

  const take = async (file: File | undefined | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('That is not an image. Use a JPEG or PNG.')
    try {
      setPhoto(await prepare(file))
      setError(null)
    } catch {
      setError('That photo could not be read. Try a JPEG or PNG.')
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpen])

  return (
    <div className="profile">
      <button type="button" className="pill glass profile-btn" aria-haspopup="dialog" aria-expanded={open} onClick={() => onOpen(!open)}>
        <span className="avatar">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" />
          ) : (
            <Person />
          )}
        </span>
        Profile
      </button>

      {open && (
        <>
          <div className="profile-scrim" onClick={() => onOpen(false)} aria-hidden="true" />
          <div
            className={`profile-panel glass${over ? ' is-over' : ''}`}
            role="dialog"
            aria-label="Your profile photo"
            onDragOver={(e) => {
              e.preventDefault()
              setOver(true)
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setOver(false)
              take(e.dataTransfer.files?.[0])
            }}
          >
            <input
              ref={input}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                take(e.target.files?.[0])
                e.target.value = ''
              }}
            />
            <span className="micro">Your photo</span>
            <button type="button" className="profile-photo" onClick={() => input.current?.click()} aria-label={photo ? 'Change your photo' : 'Add your photo'}>
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="Your photo" />
              ) : (
                <>
                  <Person size={28} />
                  <strong>Add your photo</strong>
                  <span>Full length, facing the camera. Drop it here or choose a file.</span>
                </>
              )}
            </button>
            <div className="profile-row">
              <button type="button" className="pill solid" onClick={() => input.current?.click()}>
                {photo ? 'Change photo' : 'Choose photo'}
              </button>
              {photo && (
                <button type="button" className="pill" onClick={() => setPhoto(null)}>
                  Remove
                </button>
              )}
            </div>
            <label className="profile-height">
              <span>Height</span>
              <input
                type="number"
                inputMode="numeric"
                min={140}
                max={210}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value) || 0)}
                onBlur={() => setHeight(Math.max(140, Math.min(210, height || 175)))}
              />
              <span>cm</span>
            </label>
            {error && (
              <p className="profile-error" role="alert">
                {error}
              </p>
            )}
            <p className="profile-note">
              Kept in this browser only. It is sent to the try-on service when you tap “Try on”, and nowhere else.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

type Job = { lookId: string; label: string }

type Placement = { left: number; top: number; width: number; clip: number }

/**
 * Where to draw the garment cut-out so its shoulders land on the shopper's shoulders.
 * If the product shot is worn by a model, that model's shoulders are used and the head is clipped off;
 * a flat shot falls back to typical proportions. A 2D overlay: it does not wrap or drape.
 */
function place(user: Landmark[], g: { aspect: number; pose: Landmark[] | null }): Placement | null {
  const ok = (p?: Landmark) => !!p && (p.visibility ?? 1) > 0.5
  if (!ok(user[11]) || !ok(user[12])) return null
  const A = W / H
  const du = Math.hypot((user[11].x - user[12].x) * A, user[11].y - user[12].y)
  // trust the product shot's own pose only if its shoulders span a believable share of the picture
  const span = g.pose && ok(g.pose[11]) && ok(g.pose[12]) ? Math.abs(g.pose[11].x - g.pose[12].x) : 0
  const worn = g.pose && span > 0.25 && span < 0.8 ? g.pose : null
  const gm = worn ? { x: (worn[11].x + worn[12].x) / 2, y: (worn[11].y + worn[12].y) / 2 } : { x: 0.5, y: 0.15 }
  const dg = worn ? Math.hypot((worn[11].x - worn[12].x) * g.aspect, worn[11].y - worn[12].y) : 0.68 * g.aspect
  if (dg < 0.02) return null
  const height = du / dg // in card heights
  const width = (height * g.aspect) / A // in card widths
  if (width > 1.1 || width < 0.12) return null
  return {
    left: ((user[11].x + user[12].x) / 2 - gm.x * width) * 100,
    top: ((user[11].y + user[12].y) / 2 - gm.y * height) * 100,
    width: width * 100,
    clip: worn ? Math.max(0, gm.y - 0.05) * 100 : 0,
  }
}

export function TryOnStage({
  look,
  onNeedPhoto,
  pose,
  garment,
}: {
  look: Look
  onNeedPhoto: () => void
  pose?: Landmark[] | null
  /** cut-out product photo of the top, drawn over the shopper's photo */
  garment?: string
}) {
  const [mode, setMode] = useState<'overlay' | 'pose'>('overlay')
  const [shape, setShape] = useState<{ src: string; aspect: number; pose: Landmark[] | null } | null>(null)

  useEffect(() => {
    if (!garment) return setShape(null)
    let on = true
    const img = new Image()
    img.onload = async () => {
      const worn = await detectPose(garment).catch(() => null)
      if (on) setShape({ src: garment, aspect: img.naturalWidth / img.naturalHeight, pose: worn })
    }
    img.src = garment
    return () => {
      on = false
    }
  }, [garment])

  const placed = pose && shape && shape.src === garment ? place(pose, shape) : null

  const person = useProfile((s) => s.photo)
  const results = useProfile((s) => s.results)
  const setResult = useProfile((s) => s.setResult)
  const runId = useRef(0)
  const [job, setJob] = useState<Job | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [clips, setClips] = useState<Record<string, string>>({})
  const [motion, setMotion] = useState<MotionId | null>(null)

  const result = results[look.id]
  const clip = motion ? clips[`${look.id}:${motion}`] : undefined
  const busy = job && job.lookId === look.id ? job.label : null

  useEffect(() => {
    setMotion(null)
    setError(null)
  }, [look.id])

  // a new photo throws away everything made from the old one
  useEffect(() => {
    runId.current++
    setJob(null)
    setError(null)
    setClips({})
    setMotion(null)
  }, [person])

  const start = async (label: string, work: (alive: () => boolean) => Promise<void>) => {
    const mine = ++runId.current
    setError(null)
    setJob({ lookId: look.id, label })
    try {
      await work(() => runId.current === mine)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      if (runId.current === mine && msg !== 'cancelled') setError(msg || 'Something went wrong. Try again.')
    } finally {
      if (runId.current === mine) setJob(null)
    }
  }

  const tryOn = () =>
    start(`Dressing you in ${look.items[0].name}…`, async (alive) => {
      const url = await run('/api/tryon', { person, lookId: look.id }, alive)
      if (alive()) setResult(look.id, url)
    })

  const animate = (m: (typeof MOTIONS)[number]) => {
    const key = `${look.id}:${m.id}`
    if (clips[key]) return setMotion(m.id)
    return start(`${m.name}… this can take a few minutes`, async (alive) => {
      const url = await run('/api/animate', { image: result, motion: m.id }, alive)
      if (!alive()) return
      setClips((c) => ({ ...c, [key]: url }))
      setMotion(m.id)
    })
  }

  if (!person)
    return (
      <div className="you">
        <button type="button" className="you-drop" onClick={onNeedPhoto}>
          <Person size={30} />
          <strong>Your photo goes here</strong>
          <span className="hint">Add it from your profile to try this on yourself.</span>
          <span className="pill solid">Open profile</span>
        </button>
      </div>
    )

  return (
    <div className="you">
      {clip ? (
        <video className="you-media" src={clip} autoPlay loop muted playsInline />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="you-media" src={result ?? person} alt={result ? `You in the ${look.items[0].name}` : 'Your photo'} draggable={false} />
      )}

      {placed && garment && mode === 'overlay' && !clip && !result && (
        <span className="you-garment">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={garment}
            alt={`${look.items[0].name} laid over your photo`}
            draggable={false}
            style={{ left: `${placed.left}%`, top: `${placed.top}%`, width: `${placed.width}%`, clipPath: `inset(${placed.clip}% 0 0 0)` }}
          />
        </span>
      )}

      {pose && !clip && !result && (mode === 'pose' || !placed) && (
        <svg className="you-pose" viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
          {BONES.map(([a, b]) => (
            <line key={`${a}-${b}`} x1={pose[a].x} y1={pose[a].y} x2={pose[b].x} y2={pose[b].y} />
          ))}
          {JOINTS.map((i) => (
            <line key={i} className="joint" x1={pose[i].x} y1={pose[i].y} x2={pose[i].x} y2={pose[i].y} />
          ))}
        </svg>
      )}

      <span className="you-tag glass">{result ? `${look.items[0].name} · on you` : 'You'}</span>

      {busy && (
        <div className="you-busy" role="status">
          <i aria-hidden="true" />
          <span>{busy}</span>
        </div>
      )}

      {!busy && error && (
        <p className="you-error glass" role="alert">
          {error}
        </p>
      )}

      {!busy && (
        <div className="you-actions">
          {!result ? (
            <>
              {placed && (
                <div className="seg glass small" role="group" aria-label="What to show on your photo">
                  <button type="button" aria-pressed={mode === 'overlay'} onClick={() => setMode('overlay')}>
                    Garment
                  </button>
                  <button type="button" aria-pressed={mode === 'pose'} onClick={() => setMode('pose')}>
                    Pose
                  </button>
                  <button type="button" onClick={tryOn} title="Generates a photo-real picture; needs the try-on service connected">
                    Photo-real
                  </button>
                </div>
              )}
              {!placed && (
                <button type="button" className="pill solid" onClick={tryOn}>
                  Photo-real try-on
                </button>
              )}
            </>
          ) : (
            <>
              <div className="seg glass small" role="group" aria-label="See it move">
                <button type="button" aria-pressed={!motion} onClick={() => setMotion(null)}>
                  Still
                </button>
                {MOTIONS.map((m) => (
                  <button key={m.id} type="button" aria-pressed={motion === m.id} aria-label={m.name} onClick={() => animate(m)}>
                    {m.label}
                  </button>
                ))}
              </div>
              {clip && (
                <a className="pill glass you-save" href={clip} download={`${look.id}-${motion}.mp4`} target="_blank" rel="noreferrer">
                  Save clip
                </a>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

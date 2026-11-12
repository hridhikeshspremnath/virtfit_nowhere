'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LOOKS } from '@/lib/looks'
import './picker.css'

/**
 * Development tool: pick a real outfit photo and its garments for each of the nine styles
 * from the Pinterest "Shop the Look" dataset. Nothing is downloaded until "Save" is pressed.
 */

const ROLES = ['top', 'bottom', 'shoes'] as const
type Role = (typeof ROLES)[number]
type Scene = { scene: string } & Record<Role, string[]>
type Pick = { scene: string } & Record<Role, string>

const thumb = (sig: string) => `https://i.pinimg.com/236x/${sig.slice(0, 2)}/${sig.slice(2, 4)}/${sig.slice(4, 6)}/${sig}.jpg`
const hide = (e: React.SyntheticEvent<HTMLImageElement>) => {
  const tile = e.currentTarget.closest<HTMLElement>('[data-tile]')
  if (tile) tile.style.display = 'none'
}

export default function Picker() {
  const [style, setStyle] = useState(LOOKS[0].id)
  const [page, setPage] = useState(0)
  const [pages, setPages] = useState(1)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [open, setOpen] = useState<Scene | null>(null)
  const [pick, setPick] = useState<Pick | null>(null)
  const [done, setDone] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let on = true
    setError(null)
    fetch(`/api/stl?page=${page}`)
      .then(async (r) => {
        const j = await r.json().catch(() => null)
        if (!r.ok) throw new Error(j?.message || 'The picker only runs in development.')
        return j
      })
      .then((j) => {
        if (!on) return
        setScenes(j.scenes)
        setPages(j.pages)
      })
      .catch((e) => on && setError(e.message))
    return () => {
      on = false
    }
  }, [page])

  const refreshDone = () =>
    fetch('/api/assets', { cache: 'no-store' })
      .then((r) => r.json())
      .then((a) => setDone(a.looks ?? {}))
      .catch(() => {})
  useEffect(() => {
    refreshDone()
  }, [])

  const choose = (s: Scene) => {
    setOpen(s)
    setPick({ scene: s.scene, top: s.top[0], bottom: s.bottom[0], shoes: s.shoes[0] })
    setStatus(null)
  }

  const save = async () => {
    if (!pick) return
    setStatus('Saving…')
    const res = await fetch('/api/stl', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ style, ...pick }) })
    const j = await res.json().catch(() => null)
    if (!res.ok) return setStatus(j?.message || 'Could not save.')
    setStatus(j.failed.length ? `Saved ${j.saved.length}, ${j.failed.length} failed (dead link). Pick another.` : `Saved ${j.saved.length} images for ${style}.`)
    await refreshDone()
    if (!j.failed.length) {
      const next = LOOKS[(LOOKS.findIndex((l) => l.id === style) + 1) % LOOKS.length]
      setStyle(next.id)
      setOpen(null)
      setPick(null)
    }
  }

  const look = LOOKS.find((l) => l.id === style)!

  return (
    <main className="picker">
      <header>
        <div>
          <h1>Photo picker</h1>
          <p>
            Choose a style, click an outfit photo, check its top, bottom and shoes, then save. Images come from the Pinterest
            “Shop the Look” research dataset: fine for a prototype, not for a public launch.
          </p>
        </div>
        <Link href="/" className="pill solid">
          Back to the ring
        </Link>
      </header>

      <nav aria-label="Style to fill">
        {LOOKS.map((l) => (
          <button key={l.id} type="button" aria-pressed={style === l.id} onClick={() => setStyle(l.id)}>
            {done[l.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${done[l.id]}?v=${status ?? ''}`} alt="" />
            ) : (
              <i />
            )}
            {l.aesthetic}
          </button>
        ))}
      </nav>

      {error && <p className="picker-error">{error}</p>}

      <div className="picker-body">
        <section className="picker-grid" aria-label="Outfit photos">
          {scenes.map((s) => (
            <button key={s.scene} type="button" data-tile className={open?.scene === s.scene ? 'is-on' : ''} onClick={() => choose(s)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={thumb(s.scene)} alt="" loading="lazy" referrerPolicy="no-referrer" onError={hide} />
            </button>
          ))}
          <div className="picker-pages">
            <button type="button" className="pill" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              ← Previous
            </button>
            <span>
              Page {page + 1} of {pages}
            </span>
            <button type="button" className="pill" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>
              More photos →
            </button>
          </div>
        </section>

        <aside className="picker-side">
          <h2>
            {look.aesthetic} <em>{look.subtitle}</em>
          </h2>
          {!open || !pick ? (
            <p className="hint">Click an outfit photo on the left to use it for {look.aesthetic}.</p>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="picker-scene" src={thumb(open.scene)} alt="Chosen outfit photo" referrerPolicy="no-referrer" />
              {ROLES.map((role) => (
                <div key={role} className="picker-role">
                  <span>
                    {role} · {look.items[ROLES.indexOf(role)].name}
                  </span>
                  <div>
                    {open[role].map((sig) => (
                      <button key={sig} type="button" data-tile aria-pressed={pick[role] === sig} onClick={() => setPick({ ...pick, [role]: sig })}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={thumb(sig)} alt="" referrerPolicy="no-referrer" onError={hide} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" className="pill solid picker-save" onClick={save}>
                Save for {look.aesthetic}
              </button>
            </>
          )}
          {status && (
            <p className="hint" role="status">
              {status}
            </p>
          )}
        </aside>
      </div>
    </main>
  )
}

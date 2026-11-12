'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react'
import Figure from './Figure'
import { LOOKS, money, pad2 } from '@/lib/looks'

const N = LOOKS.length
const SLOT = 360 / N
const DRIFT = 9 // degrees per second while autoplaying

export type RingHandle = {
  goTo: (index: number, instant?: boolean) => void
  rectOf: (index: number) => DOMRect | null
}

type Props = {
  autoplay: boolean
  /** stops all motion (look open, grid view, drawer) */
  frozen: boolean
  onActive: (index: number) => void
  onOpen: (index: number, rect: DOMRect) => void
  onToggleAutoplay: () => void
  /** try-on stills by look id; a style the shopper has tried shows them instead of the drawing */
  results?: Record<string, string>
  /** real model photos by look id (public/looks); the drawing is only the fallback */
  photos?: Record<string, string>
  children?: ReactNode
}

/** The ring is the centre of the page; `ch` is the height of the card standing in the middle. */
function geometry(w: number, h: number) {
  if (w < 768) {
    const rx = w * 0.42
    return { cx: w * 0.5, cy: h * 0.6, rx, ry: Math.min(rx * 0.42, h * 0.085), fh: Math.min(h * 0.34, 290), ch: 0, arc: true }
  }
  const rx = Math.min(w * 0.36, 540)
  return {
    cx: w * 0.5,
    cy: h * 0.53,
    rx,
    ry: Math.min(rx * 0.44, h * 0.19),
    fh: Math.max(150, Math.min(h * 0.34, 340)),
    ch: 0,
    arc: false,
  }
}

const Ring = forwardRef<RingHandle, Props>(function Ring(props, ref) {
  const stage = useRef<HTMLDivElement>(null)
  const guide = useRef<HTMLDivElement>(null)
  const figs = useRef<(HTMLButtonElement | null)[]>([])
  const live = useRef(props)
  live.current = props

  const s = useRef({
    base: 0,
    vel: 0,
    target: null as number | null,
    hold: 0,
    w: 0,
    h: 0,
    active: 0,
    hover: false,
    down: false,
    dragging: false,
    suppressClick: false,
    lastX: 0,
    lastT: 0,
    startX: 0,
  })

  const nearest = (index: number) => {
    const t = index * SLOT
    return t + Math.round((s.current.base - t) / 360) * 360
  }

  useImperativeHandle(ref, () => ({
    goTo(index, instant) {
      const st = s.current
      st.vel = 0
      if (instant) {
        st.base = nearest(index)
        st.target = null
      } else {
        st.target = nearest(index)
      }
    },
    rectOf: (index) => figs.current[index]?.getBoundingClientRect() ?? null,
  }))

  useEffect(() => {
    const el = stage.current
    if (!el) return
    const st = s.current

    const layout = () => {
      st.w = el.clientWidth
      st.h = el.clientHeight
      const g = geometry(st.w, st.h)
      el.style.setProperty('--fh', `${g.fh}px`)
      el.style.setProperty('--cx', `${g.cx}px`)
      el.style.setProperty('--ch', `${g.ch}px`)
      // the card ends just above the head of the front figure, so its buttons stay clear
      el.style.setProperty('--cb', `${g.cy + g.ry - g.fh - 10}px`)
      if (guide.current) {
        const gs = guide.current.style
        gs.left = `${g.cx - g.rx}px`
        gs.top = `${g.cy - g.ry}px`
        gs.width = `${g.rx * 2}px`
        gs.height = `${g.ry * 2}px`
      }
    }

    const paint = () => {
      const g = geometry(st.w, st.h)
      for (let i = 0; i < N; i++) {
        const f = figs.current[i]
        if (!f) continue
        const th = ((180 - i * SLOT + st.base) * Math.PI) / 180
        const x = g.cx + g.rx * Math.sin(th)
        const y = g.cy - g.ry * Math.cos(th)
        const depth = (1 - Math.cos(th)) / 2 // 0 at the back, 1 at the front
        const scale = 0.5 + 0.5 * depth
        f.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) translate(-50%,-100%) scale(${scale.toFixed(4)})`
        f.style.zIndex = String(Math.round(depth * 100))
        const o = g.arc ? Math.max(0, Math.min(1, (depth - 0.38) / 0.2)) : 1
        f.style.opacity = String(o)
        f.style.pointerEvents = o < 0.5 ? 'none' : ''
      }
      const idx = (((Math.round(st.base / SLOT) % N) + N) % N) | 0
      if (idx !== st.active) {
        st.active = idx
        live.current.onActive(idx)
      }
    }

    layout()
    paint()
    const ro = new ResizeObserver(() => {
      layout()
      paint()
    })
    ro.observe(el)

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const p = live.current
      if (!st.dragging && !p.frozen) {
        if (st.target !== null) {
          const d = st.target - st.base
          st.base += d * (1 - Math.exp(-dt * 7))
          if (Math.abs(d) < 0.05) {
            st.base = st.target
            st.target = null
            st.hold = now + 2600
          }
        } else if (Math.abs(st.vel) > 4) {
          st.base += st.vel * dt
          st.vel *= Math.exp(-dt * 3.2)
          if (Math.abs(st.vel) <= 4) {
            st.vel = 0
            st.target = Math.round(st.base / SLOT) * SLOT
          }
        } else if (p.autoplay && !st.hover && now > st.hold && !document.hidden) {
          st.base += DRIFT * dt
        }
      }
      paint()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  // --- drag -----------------------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const st = s.current
    st.down = true
    st.dragging = false
    st.suppressClick = false
    st.startX = st.lastX = e.clientX
    st.lastT = performance.now()
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const st = s.current
    if (!st.down) return
    if (!st.dragging) {
      if (Math.abs(e.clientX - st.startX) < 6) return
      st.dragging = true
      st.suppressClick = true
      st.target = null
      st.vel = 0
      stage.current?.setPointerCapture(e.pointerId)
      stage.current?.classList.add('is-dragging')
    }
    const now = performance.now()
    const g = geometry(st.w, st.h)
    const dDeg = (-(e.clientX - st.lastX) / g.rx) * (180 / Math.PI)
    st.base += dDeg
    const dt = Math.max(0.008, (now - st.lastT) / 1000)
    st.vel = st.vel * 0.6 + (dDeg / dt) * 0.4
    st.lastX = e.clientX
    st.lastT = now
  }
  const onPointerUp = () => {
    const st = s.current
    st.down = false
    if (!st.dragging) return
    st.dragging = false
    stage.current?.classList.remove('is-dragging')
    st.vel = Math.max(-420, Math.min(420, st.vel))
    if (Math.abs(st.vel) <= 4) st.target = Math.round(st.base / SLOT) * SLOT
  }

  const open = (i: number) => {
    const st = s.current
    if (st.suppressClick) {
      st.suppressClick = false
      return
    }
    // the ring is a menu: a tap brings a style to the front, a second tap opens it
    if (i !== st.active) {
      st.vel = 0
      st.target = nearest(i)
      return
    }
    const rect = figs.current[i]?.getBoundingClientRect()
    if (rect) props.onOpen(i, rect)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const st = s.current
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const from = st.target ?? st.base
      st.vel = 0
      st.target = (Math.round(from / SLOT) + (e.key === 'ArrowRight' ? 1 : -1)) * SLOT
    } else if (e.key === 'Enter') {
      e.preventDefault()
      st.suppressClick = false
      open(st.active)
    } else if (e.key === ' ') {
      e.preventDefault()
      props.onToggleAutoplay()
    }
  }

  return (
    <div
      ref={stage}
      className="ring"
      data-cursor="drag"
      tabIndex={0}
      role="group"
      aria-roledescription="carousel"
      aria-label="Nine styles. Arrow keys rotate, Enter opens the front style, Space pauses."
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <div ref={guide} className="ring-guide" aria-hidden="true" />
      {props.children}
      {LOOKS.map((look, i) => (
        <button
          key={look.id}
          ref={(el) => {
            figs.current[i] = el
          }}
          type="button"
          className="fig"
          data-cursor="view"
          tabIndex={-1}
          aria-label={`${pad2(i + 1)} of ${pad2(N)}, ${look.aesthetic}, 3 items from ${money(Math.min(...look.items.map((it) => it.price)))}`}
          onClick={() => open(i)}
          onPointerEnter={(e) => {
            if (e.pointerType === 'mouse') s.current.hover = true
          }}
          onPointerLeave={() => {
            s.current.hover = false
          }}
        >
          <span className="fig-inner" style={{ animationDelay: `${300 + i * 60}ms` }}>
            <span className="fig-shadow" />
            {props.results?.[look.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="fig-photo" src={props.results[look.id]} alt="" draggable={false} />
            ) : props.photos?.[look.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className={`fig-photo${/\.(png|webp)$/i.test(props.photos[look.id]) ? ' cutout' : ''}`}
                src={props.photos[look.id]}
                alt=""
                draggable={false}
              />
            ) : (
              <Figure outfit={look.outfit} />
            )}
            <span className="fig-label">{look.aesthetic}</span>
          </span>
        </button>
      ))}
    </div>
  )
})

export default Ring

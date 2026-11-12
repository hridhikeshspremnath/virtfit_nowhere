'use client'

import { useEffect, useRef } from 'react'

/** Trailing cursor label: DRAG over the ring, VIEW over a figure. Mouse only. */
export default function CursorFollower() {
  const el = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = el.current
    if (!node || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    let x = -100
    let y = -100
    let tx = x
    let ty = y
    let raf = 0
    let seen = false

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      tx = e.clientX
      ty = e.clientY
      if (!seen) {
        seen = true
        x = tx
        y = ty
      }
      const hit = (e.target as Element | null)?.closest?.('[data-cursor]')
      node.dataset.mode = hit?.getAttribute('data-cursor') ?? 'none'
    }
    const leave = () => {
      node.dataset.mode = 'none'
    }
    const loop = () => {
      x += (tx - x) * 0.18
      y += (ty - y) * 0.18
      node.style.transform = `translate3d(${x}px,${y}px,0)`
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener('pointermove', move, { passive: true })
    document.documentElement.addEventListener('pointerleave', leave)
    raf = requestAnimationFrame(loop)
    return () => {
      window.removeEventListener('pointermove', move)
      document.documentElement.removeEventListener('pointerleave', leave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={el} className="cursor" data-mode="none" aria-hidden="true">
      <span className="cursor-disc">
        <b className="cursor-drag">Drag</b>
        <b className="cursor-view">View</b>
      </span>
    </div>
  )
}

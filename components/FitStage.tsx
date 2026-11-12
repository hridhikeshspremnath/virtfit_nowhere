'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Body, Fit } from '@/lib/fit'
import type { Outfit } from '@/lib/looks'

export type Clip = 'idle' | 'walk' | 'turn' | 'arms'
export type View = 'front' | 'side' | 'back'

type Props = {
  body: Body
  outfit: Outfit
  fit: Fit
  heatmap: boolean
  clip: Clip
  /** bump `n` to animate the camera to a preset */
  view: { name: View; n: number }
  resetSignal: number
  onUnsupported: () => void
}

type Rig = { root: THREE.Group; armL: THREE.Group; armR: THREE.Group; legL: THREE.Group; legR: THREE.Group; chest: THREE.Group }

const DEPTH = 0.72 // front-to-back ÷ side-to-side of the torso cross-section
const TIGHT = new THREE.Color('#e5372f')
const LOOSE = new THREE.Color('#2f6fe5')

/** half-width (m) of an ellipse with the given circumference (cm) and the torso depth ratio */
const halfWidth = (circCm: number) => circCm / 100 / (Math.PI * (1 + DEPTH))

function lathe(profile: [number, number][], depth = 1, segments = 48) {
  const curve = new THREE.CatmullRomCurve3(
    profile.map(([r, y]) => new THREE.Vector3(r, y, 0)),
    false,
    'centripetal',
  )
  const pts = curve.getPoints(profile.length * 8).map((p) => new THREE.Vector2(Math.max(0.0005, p.x), p.y))
  const g = new THREE.LatheGeometry(pts, segments)
  g.scale(1, 1, depth)
  g.computeVertexNormals()
  return g
}

function interp(profile: [number, number][], y: number) {
  // profile is [radius, y] with y ascending
  if (y <= profile[0][1]) return profile[0][0]
  for (let i = 1; i < profile.length; i++) {
    if (y <= profile[i][1]) {
      const [r0, y0] = profile[i - 1]
      const [r1, y1] = profile[i]
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0)
    }
  }
  return profile[profile.length - 1][0]
}

/** keep the part of a profile above yMin, with a clean edge exactly at yMin */
function cut(profile: [number, number][], yMin: number): [number, number][] {
  if (yMin <= profile[0][1]) return profile
  return [[interp(profile, yMin), yMin], ...profile.filter(([, y]) => y > yMin + 0.015)]
}

function buildAvatar(body: Body, outfit: Outfit, fit: Fit, heatmap: boolean): Rig {
  const H = body.height / 100
  const s = H / 1.75
  const aH = halfWidth(body.hips)
  const aW = halfWidth(body.waist)
  const aC = halfWidth(body.chest)

  const skin = new THREE.MeshStandardMaterial({ color: outfit.skin, roughness: 0.62, side: THREE.DoubleSide })
  const cloth = (color: string, rough = 0.86) => new THREE.MeshStandardMaterial({ color, roughness: rough, side: THREE.DoubleSide })

  const root = new THREE.Group()
  const chest = new THREE.Group()
  root.add(chest)

  // ── torso ────────────────────────────────────────────────────────────────
  const torso: [number, number][] = [
    [0.004, 0.452 * H],
    [aH * 0.78, 0.468 * H],
    [aH, 0.52 * H],
    [aW, 0.62 * H],
    [aC, 0.73 * H],
    [aC * 1.05, 0.79 * H],
    [aC * 0.8, 0.83 * H],
    [0.056 * s, 0.855 * H],
    [0.05 * s, 0.89 * H],
  ]
  chest.add(new THREE.Mesh(lathe(torso, DEPTH), skin))

  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 28), skin)
  head.scale.set(0.078 * s, 0.112 * s, 0.092 * s)
  head.position.y = H - 0.112 * s
  chest.add(head)
  const hair = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: outfit.hair, roughness: 0.9 }),
  )
  hair.scale.set(0.083 * s, 0.118 * s, 0.098 * s)
  hair.position.set(0, H - 0.112 * s + 0.004, -0.004)
  hair.rotation.x = -0.18
  chest.add(hair)

  // ── legs ─────────────────────────────────────────────────────────────────
  const LL = 0.455 * H
  const rT = (body.hips * 0.6) / 100 / (2 * Math.PI)
  const legProfile = (grow = 0, flare = 0): [number, number][] =>
    (
      [
        [rT * 0.4, -LL],
        [rT * 0.42, -0.95 * LL],
        [rT * 0.66, -0.68 * LL],
        [rT * 0.6, -0.5 * LL],
        [rT * 0.74, -0.4 * LL],
        [rT, -0.07 * LL],
        [rT * 0.96, 0.01],
      ] as [number, number][]
    ).map(([r, y]) => [r + grow + flare * Math.min(1, -y / LL), y])

  const bottomMat = cloth(outfit.bottom.color)
  const shoeMat = cloth(outfit.shoes.color, 0.55)
  const kind = outfit.bottom.kind
  const legCover = kind === 'shorts' ? 0.36 : kind === 'skirt' || kind === 'mini' ? 0 : 0.955

  const makeLeg = (sx: number) => {
    const g = new THREE.Group()
    g.position.set(sx * aH * 0.5, 0.5 * H, 0)
    g.add(new THREE.Mesh(lathe(legProfile()), skin))
    if (legCover > 0) {
      const grow = kind === 'cargo' ? 0.016 : 0.01
      const flare = kind === 'wide' ? 0.045 : kind === 'cargo' ? 0.012 : 0
      g.add(new THREE.Mesh(lathe(cut(legProfile(grow, flare), -legCover * LL)), bottomMat))
    }
    const shoe = new THREE.Mesh(new THREE.CapsuleGeometry(0.047 * s, 0.15 * s, 6, 16), shoeMat)
    shoe.rotation.x = Math.PI / 2
    shoe.scale.set(1, 1, outfit.shoes.kind === 'boot' || outfit.shoes.kind === 'platform' ? 1.25 : 0.82)
    shoe.position.set(0, -LL + 0.012, 0.05 * s)
    g.add(shoe)
    root.add(g)
    return g
  }
  const legL = makeLeg(1)
  const legR = makeLeg(-1)

  // pelvis / skirt
  if (kind === 'skirt' || kind === 'mini') {
    const len = (kind === 'mini' ? 0.15 : 0.3) * H
    const skirt: [number, number][] = [
      [aH * (kind === 'mini' ? 1.16 : 1.42), 0.52 * H - len],
      [aH + 0.012, 0.52 * H],
      [(aH + aW) / 2 + 0.008, 0.57 * H],
      [aW + 0.005, 0.622 * H],
    ]
    root.add(new THREE.Mesh(lathe(skirt, DEPTH + 0.02), bottomMat))
  } else {
    const pelvis = torso.slice(0, 4).map(([r, y]) => [r + 0.009, y] as [number, number])
    pelvis.push([aW + 0.009, 0.635 * H])
    root.add(new THREE.Mesh(lathe(pelvis, DEPTH), bottomMat))
  }

  // ── top garment (the fitted item) ────────────────────────────────────────
  const tk = outfit.top.kind
  const hemY = (tk === 'coat' ? 0.3 : outfit.top.crop ? 0.56 : tk === 'hoodie' || tk === 'jacket' ? 0.47 : 0.49) * H
  const gChest = halfWidth(fit.spec.chest)
  const gHem = halfWidth(fit.spec.hem)
  const bodyAt = (y: number) => (y < 0.5 * H ? aH * 0.98 : interp(torso, y))
  const garmentAt = (y: number) => {
    const k = Math.max(0, Math.min(1, (y - 0.52 * H) / (0.21 * H)))
    return gHem + (gChest - gHem) * k
  }
  const offset = 0.007
  const ys = [hemY, 0.52, 0.57, 0.62, 0.675, 0.73, 0.76, 0.79, 0.83, 0.852].map((v, i) => (i === 0 ? v : v * H)).filter((y, i) => i === 0 || y > hemY + 0.01)
  const shell: [number, number][] = ys.map((y) => {
    // clipping guard: the shell never goes inside the body surface
    const r = y <= 0.765 * H ? Math.max(bodyAt(y) + offset, garmentAt(y)) : bodyAt(y) + offset + 0.004
    return [r, y]
  })
  const shellGeo = lathe(shell, DEPTH)

  const base = new THREE.Color(outfit.top.color)
  const tAt = (y: number) => {
    const { hem, waist, chest: c } = fit.t
    if (y <= 0.52 * H) return hem
    if (y <= 0.62 * H) return hem + ((waist - hem) * (y - 0.52 * H)) / (0.1 * H)
    if (y <= 0.73 * H) return waist + ((c - waist) * (y - 0.62 * H)) / (0.11 * H)
    return c
  }
  const heat = (t: number, out: THREE.Color) => {
    if (t < 0) return out.copy(base).lerp(TIGHT, Math.min(1, -t * 1.6 + 0.25) * 0.8)
    if (t > 1) return out.copy(base).lerp(LOOSE, Math.min(1, (t - 1) * 0.9 + 0.2) * 0.8)
    return out.copy(base)
  }
  const topMat = new THREE.MeshStandardMaterial({ roughness: 0.88, side: THREE.DoubleSide, vertexColors: true })
  {
    const pos = shellGeo.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      if (heatmap) heat(tAt(pos.getY(i)), c)
      else c.copy(base)
      colors.set([c.r, c.g, c.b], i * 3)
    }
    shellGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }
  chest.add(new THREE.Mesh(shellGeo, topMat))

  if (tk === 'hoodie') {
    const hood = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), cloth(outfit.top.color))
    hood.scale.set(0.1 * s, 0.085 * s, 0.085 * s)
    hood.position.set(0, 0.86 * H, -0.075 * s)
    chest.add(hood)
  }

  // ── arms & sleeves ───────────────────────────────────────────────────────
  const LA = 0.33 * H
  const rA = (body.chest * 0.3) / 100 / (2 * Math.PI)
  const armProfile = (grow = 0): [number, number][] => [
    [rA * 0.55 + grow, -LA],
    [rA * 0.6 + grow, -0.94 * LA],
    [rA * 0.76 + grow, -0.56 * LA],
    [rA * 0.84 + grow, -0.46 * LA],
    [rA + grow, -0.1 * LA],
    [rA * 0.92 + grow, 0.012],
  ]
  // sleeves gain room with the chest ease
  const sleeveGrow = 0.007 + Math.max(0, Math.min(0.03, fit.chest * 0.0012))
  const sleeveLen = outfit.top.sleeve === 'short' ? 0.34 : 0.95
  const sleeveColor = new THREE.Color()
  if (heatmap) heat(fit.t.chest, sleeveColor)
  else sleeveColor.copy(base)
  const sleeveMat = new THREE.MeshStandardMaterial({ color: sleeveColor, roughness: 0.88, side: THREE.DoubleSide })

  const makeArm = (sx: number) => {
    const g = new THREE.Group()
    g.position.set(sx * (aC * 1.05 - rA * 0.15), 0.772 * H, 0)
    g.add(new THREE.Mesh(lathe(armProfile()), skin))
    const cap = new THREE.Mesh(new THREE.SphereGeometry(rA * 0.9, 24, 16), skin)
    g.add(cap)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), skin)
    hand.scale.set(0.034 * s, 0.05 * s, 0.022 * s)
    hand.position.y = -LA - 0.04 * s
    g.add(hand)
    g.add(new THREE.Mesh(lathe(cut(armProfile(sleeveGrow), -sleeveLen * LA)), sleeveMat))
    const scap = new THREE.Mesh(new THREE.SphereGeometry(rA * 0.9 + sleeveGrow * 0.8, 24, 16), sleeveMat)
    g.add(scap)
    chest.add(g)
    return g
  }
  const armL = makeArm(1)
  const armR = makeArm(-1)

  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = false
  })
  return { root, armL, armR, legL, legR, chest }
}

function disposeGroup(g: THREE.Object3D) {
  g.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    m.geometry.dispose()
    const mats = Array.isArray(m.material) ? m.material : [m.material]
    mats.forEach((x) => x.dispose())
  })
}

function radialTexture(inner: string, outer: string) {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const ctx = c.getContext('2d')!
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  g.addColorStop(0, inner)
  g.addColorStop(1, outer)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 256, 256)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

export default function FitStage(props: Props) {
  const mount = useRef<HTMLDivElement>(null)
  const live = useRef(props)
  live.current = props
  const api = useRef<{ rebuild: () => void; setView: (v: View) => void; reset: () => void } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = mount.current
    if (!el) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    } catch {
      setFailed(true)
      live.current.onUnsupported()
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    el.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50)
    const target = new THREE.Vector3(0, 0.92, 0)
    const home = new THREE.Vector3(1.9, 1.15, 4.3)
    camera.position.copy(home)

    scene.add(new THREE.HemisphereLight(0xffffff, 0x1a1a1c, 1.25))
    const key = new THREE.DirectionalLight(0xffffff, 2.4)
    key.position.set(2.2, 4, 3.2)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffffff, 1.1)
    rim.position.set(-3, 2.4, -2.6)
    scene.add(rim)

    // studio floor: a faint white pool and a soft contact shadow
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 7),
      new THREE.MeshBasicMaterial({ map: radialTexture('rgba(255,255,255,.2)', 'rgba(255,255,255,0)'), transparent: true, depthWrite: false }),
    )
    pool.rotation.x = -Math.PI / 2
    scene.add(pool)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.1, 1.1),
      new THREE.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,.75)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }),
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = 0.002
    scene.add(shadow)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.copy(target)
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 1.5
    controls.maxDistance = 7
    controls.minPolarAngle = Math.PI * 0.2
    controls.maxPolarAngle = Math.PI * 0.54

    let viewTo: number | null = null
    let resetting = false
    controls.addEventListener('start', () => {
      viewTo = null
      resetting = false
    })

    let rig: Rig | null = null
    const rebuild = () => {
      const p = live.current
      const rotY = rig?.root.rotation.y ?? 0
      if (rig) {
        scene.remove(rig.root)
        disposeGroup(rig.root)
      }
      rig = buildAvatar(p.body, p.outfit, p.fit, p.heatmap)
      rig.root.rotation.y = rotY
      scene.add(rig.root)
      target.y = (p.body.height / 100) * 0.53
    }
    rebuild()

    api.current = {
      rebuild,
      setView: (v) => {
        viewTo = v === 'front' ? 0 : v === 'side' ? Math.PI / 2 : Math.PI
        resetting = false
      },
      reset: () => {
        resetting = true
        viewTo = null
      },
    }

    const resize = () => {
      const w = el.clientWidth
      const h = el.clientHeight
      if (!w || !h) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // keep the whole figure in frame on narrow stages
      camera.fov = w / h < 0.8 ? 40 : 30
      camera.updateProjectionMatrix()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()

    const pose = { armZ: 0.16, armX: 0, legX: 0, bob: 0 }
    const sph = new THREE.Spherical()
    const off = new THREE.Vector3()
    const clock = new THREE.Clock()
    let raf = 0
    let lost = false

    const frame = () => {
      raf = requestAnimationFrame(frame)
      if (lost || document.hidden) return
      const dt = Math.min(0.05, clock.getDelta())
      const t = clock.elapsedTime
      const k = 1 - Math.exp(-dt * 9)
      const clip = live.current.clip

      let armZ = 0.16
      let armX = 0
      let legX = 0
      let bob = 0
      if (clip === 'walk') {
        const ph = Math.sin(t * 5.4)
        legX = ph * 0.48
        armX = -ph * 0.42
        bob = Math.abs(Math.cos(t * 5.4)) * 0.012
      } else if (clip === 'arms') {
        armZ = 2.72
      }
      pose.armZ += (armZ - pose.armZ) * k
      pose.armX += (armX - pose.armX) * k
      pose.legX += (legX - pose.legX) * k
      pose.bob += (bob - pose.bob) * k

      if (rig) {
        rig.armL.rotation.set(pose.armX, 0, pose.armZ)
        rig.armR.rotation.set(-pose.armX, 0, -pose.armZ)
        rig.legL.rotation.x = pose.legX
        rig.legR.rotation.x = -pose.legX
        rig.root.position.y = pose.bob
        const breath = 1 + Math.sin(t * 1.7) * 0.004
        rig.chest.scale.set(breath, 1, breath)
        if (clip === 'turn') {
          rig.root.rotation.y += dt * 1.9
        } else {
          const rest = Math.round(rig.root.rotation.y / (Math.PI * 2)) * Math.PI * 2
          rig.root.rotation.y += (rest - rig.root.rotation.y) * k * 0.6
        }
      }

      controls.target.lerp(target, k)

      if (viewTo !== null) {
        off.copy(camera.position).sub(controls.target)
        sph.setFromVector3(off)
        let d = viewTo - sph.theta
        d = Math.atan2(Math.sin(d), Math.cos(d))
        sph.theta += d * (1 - Math.exp(-dt * 7))
        sph.phi += (Math.PI * 0.47 - sph.phi) * (1 - Math.exp(-dt * 7))
        camera.position.copy(controls.target).add(off.setFromSpherical(sph))
        if (Math.abs(d) < 0.003) viewTo = null
      } else if (resetting) {
        camera.position.lerp(home, 1 - Math.exp(-dt * 6))
        if (camera.position.distanceTo(home) < 0.01) resetting = false
      }

      controls.update()
      renderer.render(scene, camera)
    }
    raf = requestAnimationFrame(frame)

    const onLost = (e: Event) => {
      e.preventDefault()
      lost = true
    }
    const onRestored = () => {
      lost = false
    }
    renderer.domElement.addEventListener('webglcontextlost', onLost)
    renderer.domElement.addEventListener('webglcontextrestored', onRestored)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      controls.dispose()
      if (rig) disposeGroup(rig.root)
      disposeGroup(scene)
      renderer.dispose()
      renderer.domElement.remove()
      api.current = null
    }
  }, [])

  const { body, outfit, fit, heatmap } = props
  useEffect(() => {
    api.current?.rebuild()
  }, [body.height, body.chest, body.waist, body.hips, outfit, fit.size, heatmap])

  useEffect(() => {
    if (props.view.n > 0) api.current?.setView(props.view.name)
  }, [props.view])

  useEffect(() => {
    if (props.resetSignal > 0) api.current?.reset()
  }, [props.resetSignal])

  if (failed) return null
  return <div ref={mount} className="fit-canvas" role="img" aria-label="Real-time 3D mannequin wearing the selected top. Drag to rotate, scroll or pinch to zoom." />
}

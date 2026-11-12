'use client'

import type { Body } from './fit'

/**
 * On-device pose detection (design.md VF-8): MediaPipe PoseLandmarker runs in the browser,
 * so the photo itself never leaves the device for this step.
 * The library and model are loaded from their public CDNs on first use; self-host them before launch.
 */

const VERSION = '0.10.14'
const LIB = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${VERSION}`
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'

export type Landmark = { x: number; y: number; visibility?: number }

/** the limbs worth drawing, as pairs of landmark indices */
export const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
]
export const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let landmarker: Promise<any> | null = null
function load() {
  landmarker ??= (async () => {
    // the library reports its start-up as console.error("INFO: ..."), which trips the dev error badge
    const raw = console.error
    console.error = (...a: unknown[]) => (typeof a[0] === 'string' && a[0].startsWith('INFO:') ? undefined : raw(...a))
    const vision = await import(/* webpackIgnore: true */ `${LIB}/vision_bundle.mjs`)
    const files = await vision.FilesetResolver.forVisionTasks(`${LIB}/wasm`)
    return vision.PoseLandmarker.createFromOptions(files, {
      baseOptions: { modelAssetPath: MODEL },
      runningMode: 'IMAGE',
      numPoses: 1,
    })
  })()
  landmarker.catch(() => (landmarker = null))
  return landmarker
}

export async function detectPose(dataUrl: string): Promise<Landmark[] | null> {
  const img = new Image()
  img.src = dataUrl
  await img.decode()
  const result = (await load()).detect(img)
  return (result?.landmarks?.[0] as Landmark[] | undefined) ?? null
}

const seen = (p: Landmark | undefined) => !!p && (p.visibility ?? 1) > 0.5
const clamp = (v: number, lo: number, hi: number) => Math.round(Math.max(lo, Math.min(hi, v)))

/**
 * Rough body numbers from the photo plus the shopper's height (VF-8 steps 4–6, simplified:
 * joint distances only, no silhouette mask). Estimates, good for proportions, not for tailoring.
 * `aspect` is image width / height.
 */
export function bodyFromPose(lm: Landmark[], heightCm: number, aspect = 0.75): Body | null {
  const need = [0, 11, 12, 23, 24, 27, 28]
  if (!need.every((i) => seen(lm[i]))) return null
  const dist = (a: Landmark, b: Landmark) => Math.hypot((a.x - b.x) * aspect, a.y - b.y)
  const ankleY = (lm[27].y + lm[28].y) / 2
  const span = ankleY - lm[0].y // nose to ankle is about 89% of standing height
  if (span < 0.3) return null
  const cm = (heightCm * 0.89) / span
  const shoulders = dist(lm[11], lm[12]) * cm
  const hipJoints = dist(lm[23], lm[24]) * cm
  const chest = clamp(Math.max(heightCm * 0.47, Math.min(heightCm * 0.66, shoulders * 2.45)), 76, 130)
  // hip joints are the noisiest landmarks: keep hips within a believable range of the chest
  const hips = clamp(Math.max(chest * 0.9, Math.min(chest * 1.12, hipJoints * 4.6)), 80, 130)
  return { height: clamp(heightCm, 150, 200), chest, waist: clamp(((chest + hips) / 2) * 0.85, 60, 125), hips }
}

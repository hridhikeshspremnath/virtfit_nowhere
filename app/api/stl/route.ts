import { existsSync, readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { findLook } from '@/lib/looks'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Development-only helper behind /picker.
 * Reads the Pinterest "Shop the Look" dataset (STL-Dataset/) and serves outfit photos that have
 * a top, a bottom and shoes tagged; POST copies the chosen ones into public/looks and public/garments.
 */

const ROLES = ['top', 'bottom', 'shoes'] as const
type Role = (typeof ROLES)[number]
type Scene = { scene: string } & Record<Role, string[]>

const dev = () => process.env.NODE_ENV !== 'production'
const dir = () => path.join(process.cwd(), 'STL-Dataset')
const SIG = /^[0-9a-f]{32}$/
const url = (sig: string, w: '236x' | '736x') => `https://i.pinimg.com/${w}/${sig.slice(0, 2)}/${sig.slice(2, 4)}/${sig.slice(4, 6)}/${sig}.jpg`

function roleOf(category: string | undefined): Role | null {
  if (!category) return null
  if (category.endsWith('|Shoes')) return 'shoes'
  if (category.includes('Shirts & Tops') || category.includes('Outerwear')) return 'top'
  if (/\|(Pants|Skirts|Shorts)$/.test(category)) return 'bottom'
  return null
}

let index: Scene[] | null = null
/** where each product sits in its outfit photo: "scene|product" → [left, top, right, bottom], 0–1 */
const boxes = new Map<string, number[]>()
function load() {
  if (index) return index
  const cats = JSON.parse(readFileSync(path.join(dir(), 'fashion-cat.json'), 'utf8')) as Record<string, string>
  const scenes = new Map<string, Scene>()
  for (const line of readFileSync(path.join(dir(), 'fashion.json'), 'utf8').split('\n')) {
    if (!line) continue
    const row = JSON.parse(line) as { product: string; scene: string; bbox: number[] }
    const role = roleOf(cats[row.product])
    if (!role) continue
    let s = scenes.get(row.scene)
    if (!s) scenes.set(row.scene, (s = { scene: row.scene, top: [], bottom: [], shoes: [] }))
    if (!s[role].includes(row.product)) s[role].push(row.product)
    boxes.set(`${row.scene}|${row.product}`, row.bbox)
  }
  // full outfits only, in a stable but mixed-up order (signatures are hashes, so sorting shuffles)
  index = [...scenes.values()].filter((s) => ROLES.every((r) => s[r].length)).sort((a, b) => (a.scene < b.scene ? -1 : 1))
  return index
}

export async function GET(req: Request) {
  if (!dev()) return new NextResponse(null, { status: 404 })
  if (!existsSync(path.join(dir(), 'fashion.json')))
    return NextResponse.json({ message: 'STL-Dataset folder not found in the project.' }, { status: 404 })
  const q = new URL(req.url).searchParams
  const size = 48
  const page = Math.max(0, Number(q.get('page')) || 0)
  const all = load()
  return NextResponse.json({
    total: all.length,
    pages: Math.ceil(all.length / size),
    page,
    scenes: all.slice(page * size, page * size + size),
  })
}

export async function POST(req: Request) {
  if (!dev()) return new NextResponse(null, { status: 404 })
  const body = await req.json().catch(() => null)
  const look = findLook(body?.style)
  if (!look) return NextResponse.json({ message: 'Unknown style.' }, { status: 400 })

  const wanted: [string, string, string][] = [] // [signature, folder, file name]
  if (SIG.test(body?.scene ?? '')) wanted.push([body.scene, 'looks', `${look.id}.jpg`])
  for (const role of ROLES) if (SIG.test(body?.[role] ?? '')) wanted.push([body[role], 'garments', `${look.id}-${role}.jpg`])
  if (!wanted.length) return NextResponse.json({ message: 'Nothing picked.' }, { status: 400 })

  const pub = path.join(process.cwd(), 'public')
  const creditsPath = path.join(pub, 'credits.json')
  const credits = JSON.parse(await readFile(creditsPath, 'utf8').catch(() => '{}'))
  const saved: string[] = []
  const failed: string[] = []

  for (const [sig, folder, file] of wanted) {
    try {
      const res = await fetch(url(sig, '736x'))
      if (!res.ok || !res.headers.get('content-type')?.startsWith('image/')) throw new Error(String(res.status))
      await mkdir(path.join(pub, folder), { recursive: true })
      await writeFile(path.join(pub, folder, file), Buffer.from(await res.arrayBuffer()))
      credits[`${folder}/${file}`] = { source: 'Pinterest Shop the Look dataset (Kang et al., CVPR 2019)', page: url(sig, '736x') }
      saved.push(`${folder}/${file}`)
    } catch {
      failed.push(`${folder}/${file}`)
    }
  }
  await writeFile(creditsPath, JSON.stringify(credits, null, 2) + '\n')

  // remember where each garment sits in the photo, for the hotspots in the look view
  if (SIG.test(body?.scene ?? '')) {
    load()
    const metaPath = path.join(pub, 'looks', 'meta.json')
    const meta = JSON.parse(await readFile(metaPath, 'utf8').catch(() => '{}'))
    meta[look.id] = Object.fromEntries(
      ROLES.map((role) => {
        const b = boxes.get(`${body.scene}|${body[role]}`)
        return [role, b ? { x: Math.round(((b[0] + b[2]) / 2) * 1000) / 10, y: Math.round(((b[1] + b[3]) / 2) * 1000) / 10 } : null]
      }),
    )
    await writeFile(metaPath, JSON.stringify(meta, null, 2) + '\n')
  }
  return NextResponse.json({ saved, failed })
}

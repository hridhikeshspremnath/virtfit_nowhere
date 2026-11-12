import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Photo-real try-on through the public Kolors Virtual Try-On demo on Hugging Face (free, anonymous, no GPU quota).
 * The shopper's photo and the garment picture are uploaded to that demo; it returns the dressed picture.
 * shortcut: a shared public demo with no uptime promise and its own terms; move to a paid or self-hosted
 * model (TRYON_SPACE can point elsewhere) before real traffic or commercial use.
 */
const BASE = process.env.TRYON_SPACE || 'https://kwai-kolors-kolors-virtual-try-on.hf.space'

const fail = (status: number, message: string) => NextResponse.json({ message }, { status })
const fileData = (p: string) => ({ path: p, meta: { _type: 'gradio.FileData' } })

async function upload(name: string, data: Buffer) {
  const form = new FormData()
  form.append('files', new Blob([new Uint8Array(data)], { type: 'image/jpeg' }), name)
  const res = await fetch(`${BASE}/upload`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`upload ${res.status}`)
  return ((await res.json()) as string[])[0]
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const person = body?.person
  const garment = body?.garment
  if (typeof person !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(person) || person.length > 6_000_000)
    return fail(400, 'That photo could not be read. Try a JPEG or PNG.')
  // only our own product pictures, never an arbitrary path or URL
  if (typeof garment !== 'string' || !/^\/(catalog|garments)\/[a-z0-9-]+\.(png|jpe?g|webp)$/i.test(garment)) return fail(400, 'Unknown garment.')

  try {
    const file = await readFile(path.join(process.cwd(), 'public', garment)).catch(() => null)
    if (!file) return fail(404, 'That garment has no picture.')
    // cut-outs are transparent; the model wants the garment on plain white
    const garmentJpeg = await sharp(file).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer()
    // flatten first: a transparent photo would turn black in a JPEG
    const personJpeg = await sharp(Buffer.from(person.slice(person.indexOf(',') + 1), 'base64')).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer()

    const [p, g] = await Promise.all([upload('person.jpg', personJpeg), upload('garment.jpg', garmentJpeg)])
    // the demo hides its try-on function (no api_name), so it is called by index (2) through the queue
    const hash = Math.random().toString(36).slice(2, 12)
    const start = await fetch(`${BASE}/queue/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // person, garment, seed, random seed
      body: JSON.stringify({ data: [fileData(p), fileData(g), 0, true], fn_index: 2, session_hash: hash }),
    })
    if (!start.ok) throw new Error(`start ${start.status}`)

    // progress arrives as server-sent events; the last one is "process_completed"
    const text = await (await fetch(`${BASE}/queue/data?session_hash=${hash}`)).text()
    const done = /data: (\{"msg":"process_completed".+)/.exec(text)
    const out = done ? (JSON.parse(done[1]) as { success?: boolean; output?: { data?: ({ url?: string } | number | string)[] } }) : null
    const first = out?.output?.data?.[0]
    const url = typeof first === 'object' ? first?.url : undefined
    if (!out?.success || !url) {
      console.error('[vton] service said:', text.slice(-400))
      return fail(429, 'The free try-on demo declined this one. It is shared and sometimes busy, or it could not find a full-length person in the photo. Try a clear front-facing full-body photo, or again later.')
    }
    return NextResponse.json({ url })
  } catch (e) {
    console.error('[vton]', e)
    return fail(502, 'The try-on service did not respond. Try again in a moment.')
  }
}

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const maxDuration = 300

/**
 * Photo-real try-on through the public IDM-VTON demo on Hugging Face (free, anonymous, rate-limited).
 * The shopper's photo and the garment picture are uploaded to that demo; it returns the dressed picture.
 * shortcut: a shared public demo with a small free quota and a research licence; move to a paid or
 * self-hosted model (TRYON_SPACE can point elsewhere) before real traffic or commercial use.
 */
const BASE = process.env.TRYON_SPACE || 'https://yisol-idm-vton.hf.space'

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
    const personJpeg = await sharp(Buffer.from(person.slice(person.indexOf(',') + 1), 'base64')).jpeg({ quality: 90 }).toBuffer()

    const [p, g] = await Promise.all([upload('person.jpg', personJpeg), upload('garment.jpg', garmentJpeg)])
    const start = await fetch(`${BASE}/call/tryon`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // person, garment, description, auto-mask, auto-crop, steps, seed
      body: JSON.stringify({ data: [{ background: fileData(p), layers: [], composite: null }, fileData(g), String(body?.name || 'a garment').slice(0, 80), true, false, 30, 42] }),
    })
    if (!start.ok) throw new Error(`start ${start.status}`)
    const { event_id } = (await start.json()) as { event_id: string }

    // the answer arrives as a server-sent event stream ending in "complete" or "error"
    const text = await (await fetch(`${BASE}/call/tryon/${event_id}`)).text()
    const done = /event: complete\s+data: (.+)/.exec(text)
    if (!done) {
      const busy = /quota|queue|GPU/i.test(text)
      return fail(busy ? 429 : 502, busy ? 'The free try-on service is busy or out of quota. Try again in a few minutes.' : 'The try-on service could not dress this photo.')
    }
    const url = (JSON.parse(done[1]) as { url?: string }[])[0]?.url
    if (!url) return fail(502, 'The try-on service returned no picture.')
    return NextResponse.json({ url })
  } catch (e) {
    console.error('[vton]', e)
    return fail(502, 'The try-on service did not respond. Try again in a moment.')
  }
}

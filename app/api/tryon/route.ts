import { NextResponse } from 'next/server'
import { findLook } from '@/lib/looks'
import { TRYON_MODEL, UpstreamError, asInput, configured, createPrediction, readAsset } from '@/lib/replicate'

export const runtime = 'nodejs'

const fail = (status: number, code: string, message: string) => NextResponse.json({ code, message }, { status })

/** Starts a try-on: the shopper's photo + the look's top → a still of them wearing it. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const person = body?.person
  const look = findLook(body?.lookId)

  if (typeof person !== 'string' || !/^data:image\/(jpeg|png|webp);base64,/.test(person) || person.length > 6_000_000)
    return fail(400, 'bad_photo', 'That photo could not be read. Try a JPEG or PNG.')
  if (!look) return fail(400, 'bad_look', 'Unknown style.')

  if (!configured())
    return fail(501, 'not_configured', 'Try-on is not connected yet. Add REPLICATE_API_TOKEN to .env.local and restart.')

  const top = look.items[0]
  const garment = await readAsset('garments', top.id, ['.png', '.jpg', '.jpeg', '.webp'])
  if (!garment)
    return fail(424, 'no_garment', `No product photo for ${top.name}. Add public/garments/${top.id}.png (a flat shot of the garment).`)

  try {
    const id = await createPrediction(TRYON_MODEL, {
      human_img: person,
      garm_img: await asInput(garment),
      garment_des: `${top.name}, ${look.aesthetic.toLowerCase()} style`,
      category: 'upper_body',
    })
    return NextResponse.json({ id })
  } catch (e) {
    return fail(502, 'upstream', e instanceof UpstreamError ? e.message : 'The try-on service did not respond.')
  }
}

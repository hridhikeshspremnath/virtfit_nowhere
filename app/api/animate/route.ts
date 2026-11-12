import { NextResponse } from 'next/server'
import { MOTIONS } from '@/lib/motions'
import { ANIMATE_MODEL, UpstreamError, asInput, configured, createPrediction, readAsset } from '@/lib/replicate'

export const runtime = 'nodejs'

const fail = (status: number, code: string, message: string) => NextResponse.json({ code, message }, { status })

/** Starts an animation: a try-on still + one clip from the motion library → a short video. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const image = body?.image
  const motion = MOTIONS.find((m) => m.id === body?.motion)

  if (typeof image !== 'string' || !/^https:\/\/[a-z0-9.-]+\//i.test(image) || image.length > 2000)
    return fail(400, 'bad_image', 'Try a style on first, then pick a motion.')
  if (!motion) return fail(400, 'bad_motion', 'Unknown motion.')

  if (!configured())
    return fail(501, 'not_configured', 'Animation is not connected yet. Add REPLICATE_API_TOKEN to .env.local and restart.')

  const clip = await readAsset('motions', motion.id, ['.mp4'])
  if (!clip) return fail(424, 'no_motion', `No driving clip for “${motion.name}”. Add public/motions/${motion.id}.mp4.`)

  try {
    const id = await createPrediction(ANIMATE_MODEL, {
      appearance_image: image,
      motion_video: await asInput(clip),
    })
    return NextResponse.json({ id })
  } catch (e) {
    return fail(502, 'upstream', e instanceof UpstreamError ? e.message : 'The animation service did not respond.')
  }
}

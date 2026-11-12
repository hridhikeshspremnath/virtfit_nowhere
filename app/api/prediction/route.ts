import { NextResponse } from 'next/server'
import { UpstreamError, configured, getPrediction } from '@/lib/replicate'

export const runtime = 'nodejs'

/** Polled by the browser while a try-on or animation is running. */
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id') ?? ''
  if (!/^[a-z0-9]{8,64}$/i.test(id)) return NextResponse.json({ code: 'bad_id', message: 'Unknown job.' }, { status: 400 })
  if (!configured()) return NextResponse.json({ code: 'not_configured', message: 'Not connected.' }, { status: 501 })
  try {
    return NextResponse.json(await getPrediction(id))
  } catch (e) {
    return NextResponse.json(
      { code: 'upstream', message: e instanceof UpstreamError ? e.message : 'The service did not respond.' },
      { status: 502 },
    )
  }
}

import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Thin server-side client for Replicate, which hosts the try-on and animation models.
 * Nothing here runs unless REPLICATE_API_TOKEN is set.
 */

const API = 'https://api.replicate.com/v1'

export const TRYON_MODEL = process.env.TRYON_MODEL || 'cuuupid/idm-vton'
export const ANIMATE_MODEL = process.env.ANIMATE_MODEL || 'zsxkib/mimic-motion'

export const configured = () => !!process.env.REPLICATE_API_TOKEN

const headers = (): Record<string, string> => ({
  Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
})

export class UpstreamError extends Error {}

async function call(url: string, init?: RequestInit) {
  const res = await fetch(url, { ...init, headers: { ...headers(), ...(init?.headers ?? {}) }, cache: 'no-store' })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new UpstreamError(body?.detail || body?.title || `Replicate answered ${res.status}`)
  return body
}

const versions = new Map<string, string>()
async function latestVersion(model: string) {
  const hit = versions.get(model)
  if (hit) return hit
  const body = await call(`${API}/models/${model}`)
  const id = body?.latest_version?.id as string | undefined
  if (!id) throw new UpstreamError(`No public version found for ${model}`)
  versions.set(model, id)
  return id
}

export async function createPrediction(model: string, input: Record<string, unknown>) {
  const version = await latestVersion(model)
  const body = await call(`${API}/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ version, input }),
  })
  return body.id as string
}

export async function getPrediction(id: string) {
  const body = await call(`${API}/predictions/${encodeURIComponent(id)}`)
  const out = Array.isArray(body.output) ? body.output[0] : body.output
  return {
    status: body.status as 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled',
    output: typeof out === 'string' ? out : null,
    error: body.error ? String(body.error) : null,
  }
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
}

/** Finds public/<dir>/<name>.<ext> for the first extension that exists. */
export async function readAsset(dir: string, name: string, exts: string[]) {
  for (const ext of exts) {
    try {
      const file = path.join(process.cwd(), 'public', dir, `${name}${ext}`)
      return { data: await readFile(file), mime: MIME[ext], filename: `${name}${ext}` }
    } catch {
      // try the next extension
    }
  }
  return null
}

/** Small files go inline; larger ones are uploaded so the model can fetch them. */
export async function asInput(asset: { data: Buffer; mime: string; filename: string }) {
  if (asset.data.byteLength < 200_000) return `data:${asset.mime};base64,${asset.data.toString('base64')}`
  const form = new FormData()
  form.append('content', new Blob([new Uint8Array(asset.data)], { type: asset.mime }), asset.filename)
  const body = await call(`${API}/files`, { method: 'POST', body: form })
  const url = body?.urls?.get as string | undefined
  if (!url) throw new UpstreamError('Could not upload the file to Replicate')
  return url
}

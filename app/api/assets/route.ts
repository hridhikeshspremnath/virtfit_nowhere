import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Lists the real photos present in public/looks and public/garments, so the UI can use them when they exist. */
async function list(dir: string) {
  const out: Record<string, string> = {}
  try {
    for (const file of await readdir(path.join(process.cwd(), 'public', dir))) {
      const m = /^([a-z0-9-]+)\.(png|webp|jpe?g)$/i.exec(file)
      if (m) out[m[1].toLowerCase()] = `/${dir}/${file}`
    }
  } catch {
    // folder not there yet
  }
  return out
}

export async function GET() {
  const meta = JSON.parse(await readFile(path.join(process.cwd(), 'public', 'looks', 'meta.json'), 'utf8').catch(() => '{}'))
  return NextResponse.json({ looks: await list('looks'), garments: await list('garments'), hotspots: meta })
}

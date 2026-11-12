#!/usr/bin/env node
/**
 * Fills public/looks and public/garments with stock photos through the official
 * Pexels or Unsplash API (whichever key is in .env.local), and records credits.
 *
 *   npm run images                      fetch everything that is missing
 *   npm run images -- --only goth       only names containing "goth"
 *   npm run images -- --force           replace files that already exist
 *   npm run images -- --pick goth-top=3 take the 3rd search result for that one
 *
 * These are placeholders: stock photos will not match each other or your real products.
 */
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

// --- config -----------------------------------------------------------------
for (const file of ['.env.local', '.env']) {
  const p = path.join(root, file)
  if (!existsSync(p)) continue
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
}
const PEXELS = process.env.PEXELS_API_KEY
const UNSPLASH = process.env.UNSPLASH_ACCESS_KEY

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const value = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined)
const only = value('only')
const picks = Object.fromEntries((value('pick') ?? '').split(',').filter(Boolean).map((p) => p.split('=')))

// --- what to fetch ------------------------------------------------------------
// [style id, model photo, top, bottom, shoes]
const STYLES = [
  ['streetwear', 'streetwear outfit hoodie cargo pants full body', 'grey hoodie', 'olive cargo pants', 'white sneakers'],
  ['old-money', 'preppy outfit knit sweater trousers full body', 'cream cable knit sweater', 'navy pleated trousers', 'brown penny loafers'],
  ['goth', 'goth outfit long black coat full body', 'long black coat', 'black wide leg trousers', 'black platform boots'],
  ['y2k', 'y2k outfit crop top denim mini skirt full body', 'light blue cropped t-shirt', 'denim mini skirt', 'chunky lilac sneakers'],
  ['techwear', 'techwear outfit black shell jacket full body', 'black shell jacket', 'grey cargo trousers', 'trail running shoes'],
  ['quiet-luxury', 'minimal beige cashmere sweater wide trousers full body', 'camel cashmere sweater', 'cream wide leg trousers', 'suede loafers'],
  ['coquette', 'pink cardigan pleated skirt outfit full body', 'pink cardigan', 'white pleated midi skirt', 'burgundy mary jane shoes'],
  ['grunge', 'grunge outfit flannel shirt jeans boots full body', 'red flannel shirt', 'light wash straight jeans', 'black lug sole boots'],
  ['minimalist', 'minimalist outfit white t-shirt black trousers full body', 'white t-shirt', 'black tapered trousers', 'white leather sneakers'],
]
const product = (q) => `${q} product photo white background`
const jobs = STYLES.flatMap(([id, look, top, bottom, shoes]) => [
  { name: id, dir: 'looks', query: look },
  { name: `${id}-top`, dir: 'garments', query: product(top) },
  { name: `${id}-bottom`, dir: 'garments', query: product(bottom) },
  { name: `${id}-shoes`, dir: 'garments', query: product(shoes) },
]).filter((j) => !only || j.name.includes(only))

// --- providers ----------------------------------------------------------------
async function json(url, headers) {
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}${res.status === 429 ? ' (rate limit, try again later)' : ''}`)
  return res.json()
}

async function searchPexels(query, index) {
  const body = await json(`https://api.pexels.com/v1/search?per_page=${index}&orientation=portrait&query=${encodeURIComponent(query)}`, {
    Authorization: PEXELS,
  })
  const p = body.photos?.[index - 1] ?? body.photos?.[0]
  return p && { url: p.src.portrait, by: p.photographer, page: p.url, source: 'Pexels' }
}

async function searchUnsplash(query, index) {
  const headers = { Authorization: `Client-ID ${UNSPLASH}`, 'Accept-Version': 'v1' }
  const body = await json(`https://api.unsplash.com/search/photos?per_page=${index}&orientation=portrait&query=${encodeURIComponent(query)}`, headers)
  const p = body.results?.[index - 1] ?? body.results?.[0]
  if (!p) return null
  // Unsplash asks API users to report each download
  await fetch(p.links.download_location, { headers }).catch(() => {})
  return { url: `${p.urls.raw}&w=1024&h=1365&fit=crop&fm=jpg&q=85`, by: p.user.name, page: p.links.html, source: 'Unsplash' }
}

// --- run ----------------------------------------------------------------------
if (!PEXELS && !UNSPLASH) {
  console.error(
    'No stock photo key found.\n' +
      'Add one of these to .env.local, then run `npm run images` again:\n' +
      '  PEXELS_API_KEY=...        free, instant: https://www.pexels.com/api/\n' +
      '  UNSPLASH_ACCESS_KEY=...   free: https://unsplash.com/developers',
  )
  process.exit(1)
}
const search = PEXELS ? searchPexels : searchUnsplash
const creditsPath = path.join(root, 'public', 'credits.json')
const credits = existsSync(creditsPath) ? JSON.parse(readFileSync(creditsPath, 'utf8')) : {}

let saved = 0
let failed = 0
for (const job of jobs) {
  const dir = path.join(root, 'public', job.dir)
  const taken = ['.png', '.webp', '.jpg', '.jpeg'].some((ext) => existsSync(path.join(dir, job.name + ext)))
  if (taken && !flag('force')) {
    console.log(`skip  ${job.dir}/${job.name} (already there)`)
    continue
  }
  try {
    const hit = await search(job.query, Math.max(1, Number(picks[job.name]) || 1))
    if (!hit) throw new Error('no results')
    const res = await fetch(hit.url)
    if (!res.ok) throw new Error(`image download answered ${res.status}`)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, `${job.name}.jpg`), Buffer.from(await res.arrayBuffer()))
    credits[`${job.dir}/${job.name}.jpg`] = { by: hit.by, page: hit.page, source: hit.source, query: job.query }
    await writeFile(creditsPath, JSON.stringify(credits, null, 2) + '\n')
    console.log(`saved ${job.dir}/${job.name}.jpg  — ${hit.by} / ${hit.source}`)
    saved++
  } catch (e) {
    console.error(`FAIL  ${job.dir}/${job.name}: ${e.message}`)
    failed++
  }
  await new Promise((r) => setTimeout(r, 400))
}
console.log(`\n${saved} saved, ${failed} failed. Credits are in public/credits.json.`)
if (failed) process.exitCode = 1

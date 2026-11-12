import { CATALOG } from './catalog'

export type Role = 'top' | 'bottom' | 'shoes'
export type Category = 'tops' | 'jackets' | 'dresses' | 'trousers' | 'skirts' | 'shorts' | 'shoes'
export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'tops', label: 'Tops' },
  { id: 'jackets', label: 'Jackets' },
  { id: 'dresses', label: 'Dresses' },
  { id: 'trousers', label: 'Trousers' },
  { id: 'skirts', label: 'Skirts' },
  { id: 'shorts', label: 'Shorts' },
  { id: 'shoes', label: 'Shoes' },
]

export type TopKind = 'tee' | 'crew' | 'shirt' | 'cardigan' | 'hoodie' | 'jacket' | 'coat'
export type BottomKind = 'trousers' | 'wide' | 'cargo' | 'shorts' | 'skirt' | 'mini'
export type ShoeKind = 'sneaker' | 'loafer' | 'boot' | 'platform'

export type Outfit = {
  skin: string
  hair: string
  hairStyle: 'short' | 'long' | 'bob' | 'bun' | 'beanie'
  top: {
    kind: TopKind
    color: string
    sleeve: 'short' | 'long'
    detail?: 'zip' | 'stripes' | 'buttons' | 'check' | 'collar'
    accent?: string
    crop?: boolean
  }
  bottom: { kind: BottomKind; color: string }
  shoes: { kind: ShoeKind; color: string; sole?: string }
}

export type Item = {
  id: string
  name: string
  role: Role
  price: number
  color: string
  /** position on the figure, in % of the figure box */
  hotspot: { x: number; y: number }
  category: Category
  /** product photo */
  image?: string
}

export type Look = {
  id: string
  index: number
  aesthetic: string
  subtitle: string
  blurb: string
  outfit: Outfit
  items: [Item, Item, Item]
}

export const BRAND = 'VIRTFIT NOWHERE'
export const TILL = 'VOL. 01 · TILL 0034 · LISBON'
export const WHOLE_FIT_DISCOUNT = 0.1

type Seed = {
  id: string
  aesthetic: string
  subtitle: string
  blurb: string
  outfit: Outfit
  top: [string, number]
  bottom: [string, number]
  shoes: [string, number]
}

const seeds: Seed[] = [
  {
    id: 'streetwear',
    aesthetic: 'Streetwear',
    subtitle: 'Dial-Up',
    blurb: 'A boxy fleece, wide charcoal denim and tan boots.',
    outfit: {
      skin: '#C68E6A',
      hair: '#D9502E',
      hairStyle: 'beanie',
      top: { kind: 'hoodie', color: '#3B3E44', sleeve: 'long' },
      bottom: { kind: 'cargo', color: '#727A5B' },
      shoes: { kind: 'sneaker', color: '#F3F1EA', sole: '#D9D5CA' },
    },
    top: ['Brown zip fleece', 96],
    bottom: ['Charcoal wide-leg jeans', 118],
    shoes: ['Tan work boots', 160],
  },
  {
    id: 'old-money',
    aesthetic: 'Old Money',
    subtitle: 'Long Weekend',
    blurb: 'Leather over cream pleats and a polished oxblood shoe.',
    outfit: {
      skin: '#E8C4A2',
      hair: '#6B4A2B',
      hairStyle: 'short',
      top: { kind: 'crew', color: '#EFE6D2', sleeve: 'long', detail: 'collar', accent: '#FFFFFF' },
      bottom: { kind: 'trousers', color: '#27324A' },
      shoes: { kind: 'loafer', color: '#6B4226' },
    },
    top: ['Brown leather jacket', 240],
    bottom: ['Cream wide-leg trousers', 110],
    shoes: ['Oxblood leather shoes', 185],
  },
  {
    id: 'goth',
    aesthetic: 'Goth',
    subtitle: 'Midnight Shift',
    blurb: 'Black leather, fishnet and a lifted combat boot.',
    outfit: {
      skin: '#F1DDD0',
      hair: '#141416',
      hairStyle: 'long',
      top: { kind: 'coat', color: '#1B1B1F', sleeve: 'long', detail: 'buttons' },
      bottom: { kind: 'wide', color: '#2A2A2F' },
      shoes: { kind: 'platform', color: '#101012', sole: '#2E2E33' },
    },
    top: ['Black leather jacket', 280],
    bottom: ['Fishnet tights', 24],
    shoes: ['Platform combat boots', 190],
  },
  {
    id: 'y2k',
    aesthetic: 'Y2K',
    subtitle: 'Dial Tone',
    blurb: 'A plaid overshirt over a crop, loose cargos, worn-in trainers.',
    outfit: {
      skin: '#B97A56',
      hair: '#2B1B14',
      hairStyle: 'bun',
      top: { kind: 'tee', color: '#A9D4F5', sleeve: 'short', crop: true },
      bottom: { kind: 'mini', color: '#6F8FBF' },
      shoes: { kind: 'sneaker', color: '#C9B8F0', sole: '#FFFFFF' },
    },
    top: ['Plaid overshirt', 72],
    bottom: ['Olive cargo pants', 88],
    shoes: ['Grey canvas sneakers', 64],
  },
  {
    id: 'techwear',
    aesthetic: 'Techwear',
    subtitle: 'Dry Run',
    blurb: 'Sculpted vest, strapped cargos and a heavy boot.',
    outfit: {
      skin: '#8D5B3F',
      hair: '#17171A',
      hairStyle: 'short',
      top: { kind: 'jacket', color: '#2C3035', sleeve: 'long', detail: 'zip' },
      bottom: { kind: 'cargo', color: '#444A51' },
      shoes: { kind: 'sneaker', color: '#C6E04A', sole: '#1B1B1D' },
    },
    top: ['Armoured crop vest', 130],
    bottom: ['Black cargo pants', 104],
    shoes: ['Black chunky boots', 170],
  },
  {
    id: 'quiet-luxury',
    aesthetic: 'Quiet Luxury',
    subtitle: 'Soft Launch',
    blurb: 'A soft henley, loose pinstripe and quiet trainers.',
    outfit: {
      skin: '#DDB08C',
      hair: '#B9905A',
      hairStyle: 'bob',
      top: { kind: 'crew', color: '#C8A77E', sleeve: 'long' },
      bottom: { kind: 'wide', color: '#EDE7DB' },
      shoes: { kind: 'loafer', color: '#8B7765' },
    },
    top: ['Cream waffle henley', 84],
    bottom: ['Pinstripe trousers', 112],
    shoes: ['Grey suede trainers', 120],
  },
  {
    id: 'coquette',
    aesthetic: 'Coquette',
    subtitle: 'Sunday Letter',
    blurb: 'Puff sleeves, a tiered skirt and ballet flats.',
    outfit: {
      skin: '#F0CDB4',
      hair: '#8A4B2A',
      hairStyle: 'long',
      top: { kind: 'cardigan', color: '#F4D5D9', sleeve: 'long', detail: 'buttons', crop: true },
      bottom: { kind: 'skirt', color: '#FBF4E6' },
      shoes: { kind: 'loafer', color: '#6E1F2B' },
    },
    top: ['Puff-sleeve lace bodice', 78],
    bottom: ['Tiered ruffle skirt', 96],
    shoes: ['Blush ballet flats', 68],
  },
  {
    id: 'grunge',
    aesthetic: 'Grunge',
    subtitle: 'Feedback Loop',
    blurb: 'Leather over a green hoodie and faded, ripped denim.',
    outfit: {
      skin: '#E3BC9C',
      hair: '#3A2A1E',
      hairStyle: 'bob',
      top: { kind: 'shirt', color: '#9B3A32', sleeve: 'long', detail: 'check', accent: '#2A1614' },
      bottom: { kind: 'trousers', color: '#8FA3B8' },
      shoes: { kind: 'boot', color: '#17171A', sole: '#2C2C30' },
    },
    top: ['Black leather jacket', 260],
    bottom: ['Faded distressed jeans', 98],
    shoes: ['Black chunky trainers', 110],
  },
  {
    id: 'minimalist',
    aesthetic: 'Skater',
    subtitle: 'White Noise',
    blurb: 'A plaid shirt, the widest jeans and low trainers.',
    outfit: {
      skin: '#A66E4C',
      hair: '#1C1512',
      hairStyle: 'short',
      top: { kind: 'tee', color: '#F6F6F3', sleeve: 'short' },
      bottom: { kind: 'trousers', color: '#1C1C1E' },
      shoes: { kind: 'sneaker', color: '#FAFAF7', sole: '#E4E4E1' },
    },
    top: ['Pink plaid shirt', 58],
    bottom: ['Black baggy jeans', 96],
    shoes: ['Low black trainers', 90],
  },
]

export const LOOKS: Look[] = seeds.map((s, i) => {
  const short = s.outfit.bottom.kind === 'shorts' || s.outfit.bottom.kind === 'mini'
  return {
    id: s.id,
    index: i,
    aesthetic: s.aesthetic,
    subtitle: s.subtitle,
    blurb: s.blurb,
    outfit: s.outfit,
    items: [
      { id: `${s.id}-top`, name: s.top[0], role: 'top', price: s.top[1], color: s.outfit.top.color, hotspot: { x: 58, y: 33 }, category: 'tops', image: `/garments/${s.id}-top.png` },
      { id: `${s.id}-bottom`, name: s.bottom[0], role: 'bottom', price: s.bottom[1], color: s.outfit.bottom.color, hotspot: { x: 40, y: short ? 54 : 62 }, category: 'trousers', image: `/garments/${s.id}-bottom.png` },
      { id: `${s.id}-shoes`, name: s.shoes[0], role: 'shoes', price: s.shoes[1], color: s.outfit.shoes.color, hotspot: { x: 60, y: 90 }, category: 'shoes', image: `/garments/${s.id}-shoes.png` },
    ],
  }
})

const itemIndex = new Map<string, { item: Item; look: Look }>()
for (const look of LOOKS) for (const item of look.items) itemIndex.set(item.id, { item, look })

/** Everything outside the nine looks is sold on its own; this stands in for "its look" where one is expected. */
const SHOP_LOOK: Look = { ...LOOKS[0], id: 'shop', index: -1, aesthetic: 'Shop', subtitle: 'Single pieces', blurb: '' }
export const SHOP_ITEMS: Item[] = CATALOG.map((c) => ({ ...c, color: '#d8d8d4', hotspot: { x: 50, y: 50 } }))
for (const item of SHOP_ITEMS) itemIndex.set(item.id, { item, look: SHOP_LOOK })

/** Every product in the store: the looks' pieces first, then the single pieces. */
export const PRODUCTS: Item[] = [...LOOKS.flatMap((l) => l.items), ...SHOP_ITEMS]

export const findItem = (id: string | null | undefined) => (id ? itemIndex.get(id) : undefined)
export const findLook = (id: string | null | undefined) => LOOKS.find((l) => l.id === id)

export const pad2 = (n: number) => String(n).padStart(2, '0')

export const money = (n: number) =>
  Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`

const APPAREL = ['S', 'M', 'L', 'XL']
const FOOTWEAR = ['41', '42', '43', '44']
export const SIZE_COUNT = 4
export const sizeLabel = (role: Role, idx: number) => (role === 'shoes' ? FOOTWEAR : APPAREL)[idx] ?? 'M'

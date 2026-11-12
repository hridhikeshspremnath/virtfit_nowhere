/** Decorative barcode: bar widths are derived from the seed, it is not a scannable symbology. */
export default function Barcode({ seed, height = 44 }: { seed: string; height?: number }) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  const next = () => {
    h ^= h << 13
    h ^= h >>> 17
    h ^= h << 5
    return (h >>> 0) / 4294967296
  }
  const bars: { x: number; w: number }[] = []
  let x = 0
  while (x < 196) {
    const w = 1 + Math.floor(next() * 3)
    bars.push({ x, w })
    x += w + 1 + Math.floor(next() * 3)
  }
  const digits = Array.from({ length: 12 }, () => Math.floor(next() * 10)).join('')
  return (
    <div className="barcode" aria-hidden="true">
      <svg viewBox={`0 0 200 ${height}`} preserveAspectRatio="none" style={{ height }}>
        {bars.map((b) => (
          <rect key={b.x} x={b.x} y={0} width={b.w} height={height} fill="currentColor" />
        ))}
      </svg>
      <span>{digits.replace(/(\d{4})(?=\d)/g, '$1 ')}</span>
    </div>
  )
}

import { useId, type ReactNode } from 'react'
import type { Outfit, Role } from '@/lib/looks'

/**
 * Illustrated stand-in for the model cut-outs the spec calls for.
 * Drawn from the look's outfit data, so garment colours are the real item colours.
 * Swap for transparent photography when it exists; the box is 2:5.
 */

const EDGE = 'rgba(10,10,10,.22)'
const METAL = '#C9CCD1'

const isDark = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255) < 90
}
/** seam/fold colour that stays visible on both light and dark cloth */
const ink = (hex: string, a = 0.2) => (isDark(hex) ? `rgba(255,255,255,${a * 0.85})` : `rgba(10,10,10,${a})`)

type M = (x: number) => number
const LEFT: M = (x) => x
const RIGHT: M = (x) => 200 - x
const SIDES: [string, M][] = [
  ['l', LEFT],
  ['r', RIGHT],
]

const TOPS = {
  tee: { sh: 56, side: 62, hemX: 62, hem: 248, arm: 0 },
  crew: { sh: 56, side: 62, hemX: 63, hem: 246, arm: 1 },
  shirt: { sh: 56, side: 61, hemX: 60, hem: 262, arm: 1 },
  cardigan: { sh: 57, side: 63, hemX: 64, hem: 246, arm: 1 },
  hoodie: { sh: 52, side: 58, hemX: 59, hem: 256, arm: 4 },
  jacket: { sh: 53, side: 59, hemX: 59, hem: 250, arm: 3 },
  coat: { sh: 53, side: 59, hemX: 49, hem: 372, arm: 3 },
} as const

export default function Figure({ outfit, label }: { outfit: Outfit; label?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '')
  const u = (k: string) => `url(#${id}${k})`
  const { skin, hair, hairStyle, top, bottom, shoes } = outfit

  const shape = (d: string, fill: string, key?: string) => (
    <g key={key}>
      <path d={d} fill={fill} stroke={EDGE} strokeWidth={1} strokeLinejoin="round" />
      <path d={d} fill={u('c')} />
    </g>
  )
  const ln = (d: string, stroke: string, w = 1.2, key?: string): ReactNode => (
    <path key={key} d={d} stroke={stroke} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" fill="none" />
  )

  // --- top geometry ---------------------------------------------------------
  const g = TOPS[top.kind]
  const { sh, side, arm: aw } = g
  const hem = top.crop ? (top.kind === 'tee' ? 208 : 218) : g.hem
  const hemX = top.crop ? 66 : g.hemX
  const vDepth = top.kind === 'cardigan' ? 150 : top.kind === 'coat' ? 176 : 0
  const neckline = vDepth ? `L100 ${vDepth} L113 94` : `Q100 ${top.kind === 'jacket' ? 99 : 106} 113 94`
  const torso = `M87 94 ${neckline} L${200 - sh} 103 Q${202 - sh} 118 ${200 - side} 134 L${200 - hemX} ${hem} Q100 ${hem + 4} ${hemX} ${hem} L${side} 134 Q${sh - 2} 118 ${sh} 103 Z`

  const sleeveLong = (m: M) =>
    `M${m(sh + 5)} 101 C${m(sh - 7 - aw)} 106 ${m(sh - 13 - aw)} 150 ${m(sh - 14 - aw)} 190 L${m(sh - 16 - aw)} 250 L${m(sh - 1)} 252 L${m(sh + 4)} 190 Q${m(sh + 8)} 152 ${m(side + 5)} 130 Z`
  const sleeveShort = (m: M) =>
    `M${m(sh + 5)} 101 C${m(sh - 7)} 105 ${m(sh - 12)} 128 ${m(sh - 13)} 154 L${m(sh + 7)} 158 Q${m(sh + 9)} 142 ${m(side + 5)} 130 Z`
  const bareArm = (m: M) =>
    `M${m(sh + 4)} 108 C${m(sh - 6)} 128 ${m(sh - 10)} 165 ${m(sh - 10)} 192 L${m(sh - 13)} 250 L${m(sh - 1)} 251 L${m(sh + 3)} 192 Q${m(sh + 7)} 160 ${m(side + 4)} 130 Z`
  const long = top.sleeve === 'long'
  const sleeve = long ? sleeveLong : sleeveShort
  const handX = long ? sh - 8.5 - aw / 2 : sh - 7

  const tl = ink(top.color, 0.22)
  const tlSoft = ink(top.color, 0.12)
  const knit = top.kind === 'crew' || top.kind === 'cardigan'
  const ribbed = knit || top.kind === 'hoodie'
  const accent = top.accent ?? 'rgba(10,10,10,.4)'

  // --- bottoms --------------------------------------------------------------
  const W = bottom.kind === 'skirt' || bottom.kind === 'wide' ? 212 : bottom.kind === 'mini' ? 226 : 220
  const bottoms = (() => {
    switch (bottom.kind) {
      case 'wide':
        return `M65 ${W} H135 Q147 300 152 450 H103 L100.5 272 Q100 266 99.5 272 L97 450 H48 Q53 300 65 ${W} Z`
      case 'cargo':
        return `M64 ${W} H136 Q143 262 141 300 L136 438 Q136 446 131 446 H108 Q104 446 104 440 L101.5 270 Q100 262 98.5 270 L96 440 Q96 446 92 446 H69 Q64 446 64 438 L59 300 Q57 262 64 ${W} Z`
      case 'shorts':
        return `M64 ${W} H136 Q141 262 142 320 H103 L100.5 272 Q100 266 99.5 272 L97 320 H58 Q59 262 64 ${W} Z`
      case 'skirt':
        return `M66 ${W} H134 Q151 290 162 370 Q100 384 38 370 Q49 290 66 ${W} Z`
      case 'mini':
        return `M63 ${W} H137 Q144 262 147 298 Q100 307 53 298 Q56 262 63 ${W} Z`
      default:
        return `M64 ${W} H136 Q141 262 138 300 L131 446 H105 L101.5 270 Q100 262 98.5 270 L95 446 H69 L62 300 Q59 262 64 ${W} Z`
    }
  })()
  const bl = ink(bottom.color, 0.2)
  const blSoft = ink(bottom.color, 0.11)
  const bareFrom = bottom.kind === 'shorts' ? 314 : bottom.kind === 'mini' ? 292 : bottom.kind === 'skirt' ? 364 : 0
  const leg = (m: M) =>
    bareFrom > 350
      ? `M${m(70)} ${bareFrom} H${m(95)} Q${m(96)} 400 ${m(90)} 450 H${m(74)} Q${m(68)} 400 ${m(70)} ${bareFrom} Z`
      : `M${m(67)} ${bareFrom} H${m(98)} Q${m(98)} 330 ${m(94)} 356 Q${m(97)} 392 ${m(90)} 450 H${m(74)} Q${m(67)} 392 ${m(69)} 356 Q${m(65)} 330 ${m(67)} ${bareFrom} Z`

  // --- shoes ----------------------------------------------------------------
  const sl = ink(shoes.color, 0.26)
  const sole = shoes.sole ?? 'rgba(10,10,10,.55)'
  const shoe = (cx: number) => {
    switch (shoes.kind) {
      case 'boot':
      case 'platform': {
        const thick = shoes.kind === 'platform'
        return (
          <g key={cx}>
            {shape(`M${cx - 12} 414 H${cx + 12} Q${cx + 13} 440 ${cx + 16} 458 Q${cx + 17} 472 ${cx} 472 Q${cx - 17} 472 ${cx - 16} 458 Q${cx - 13} 440 ${cx - 12} 414 Z`, shoes.color)}
            {ln(`M${cx - 6} 424 H${cx + 6} M${cx - 6} 431 H${cx + 6} M${cx - 7} 438 H${cx + 7} M${cx - 7} 445 H${cx + 7}`, sl, 1.4)}
            {ln(`M${cx - 14} 457 Q${cx} 448 ${cx + 14} 457`, sl)}
            <path
              d={
                thick
                  ? `M${cx - 18} 459 Q${cx} 466 ${cx + 18} 459 V473 Q${cx + 18} 480 ${cx + 11} 480 H${cx - 11} Q${cx - 18} 480 ${cx - 18} 473 Z`
                  : `M${cx - 18} 462 Q${cx} 469 ${cx + 18} 462 Q${cx + 18} 478 ${cx} 478 Q${cx - 18} 478 ${cx - 18} 462 Z`
              }
              fill={sole}
              stroke={EDGE}
            />
            {ln(`M${cx - 15} ${thick ? 472 : 473} H${cx + 15}`, 'rgba(255,255,255,.14)', 1)}
          </g>
        )
      }
      case 'loafer':
        return (
          <g key={cx}>
            {shape(`M${cx - 10} 446 Q${cx - 15} 456 ${cx - 15} 465 Q${cx - 15} 474 ${cx} 474 Q${cx + 15} 474 ${cx + 15} 465 Q${cx + 15} 456 ${cx + 10} 446 Q${cx} 454 ${cx - 10} 446 Z`, shoes.color)}
            {ln(`M${cx - 12.5} 457 Q${cx} 462 ${cx + 12.5} 457`, sl, 3.5)}
            {ln(`M${cx - 14.5} 467 Q${cx - 14} 474.5 ${cx} 474.5 Q${cx + 14} 474.5 ${cx + 14.5} 467`, 'rgba(10,10,10,.4)', 1.6)}
            {ln(`M${cx - 8} 466 Q${cx - 4} 470 ${cx + 1} 470`, 'rgba(255,255,255,.3)', 1.4)}
          </g>
        )
      default:
        return (
          <g key={cx}>
            {shape(`M${cx - 10} 436 Q${cx - 16} 452 ${cx - 16} 464 Q${cx - 16} 473 ${cx} 473 Q${cx + 16} 473 ${cx + 16} 464 Q${cx + 16} 452 ${cx + 10} 436 Z`, shoes.color)}
            {ln(`M${cx - 5} 442 H${cx + 5} M${cx - 6} 447 H${cx + 6} M${cx - 6.5} 452 H${cx + 6.5}`, sl, 1.4)}
            {ln(`M${cx - 13.5} 461 Q${cx} 451 ${cx + 13.5} 461`, sl)}
            <path
              d={`M${cx - 17} 463 Q${cx} 471 ${cx + 17} 463 Q${cx + 17} 477 ${cx} 477 Q${cx - 17} 477 ${cx - 17} 463 Z`}
              fill={sole}
              stroke={EDGE}
            />
          </g>
        )
    }
  }
  const socks = bareFrom > 0 && shoes.kind !== 'loafer'

  // --- hair -----------------------------------------------------------------
  const curtain =
    hairStyle === 'long'
      ? 'M76 44 C71 6 129 6 124 44 C128 78 131 108 124 140 Q120 146 117 136 C118 106 118 80 115 48 Q100 24 85 48 C82 80 82 106 83 136 Q80 146 76 140 C69 108 72 78 76 44 Z'
      : hairStyle === 'bob'
        ? 'M76 44 C71 6 129 6 124 44 C127 58 127 70 123 80 Q118 85 114 78 C116 68 116 58 115 48 Q100 24 85 48 C84 58 84 68 86 78 Q82 85 77 80 C73 70 73 58 76 44 Z'
        : null
  const cap =
    hairStyle === 'short'
      ? 'M78 47 C73 11 127 11 122 47 C120 37 114 30 104 30 Q90 27 82 37 Q79 41 78 47 Z'
      : hairStyle === 'bun'
        ? 'M78 46 C75 15 125 15 122 46 C117 31 108 27 100 27 C92 27 83 31 78 46 Z'
        : null

  return (
    <svg viewBox="0 0 200 500" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} focusable="false">
      <defs>
        {/* soft cylinder light, applied per shape so every limb reads as round */}
        <linearGradient id={`${id}c`}>
          <stop offset="0" stopColor="#000" stopOpacity=".1" />
          <stop offset=".2" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".52" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".22" />
        </linearGradient>
        {/* shadow the top casts on whatever sits below its hem */}
        <linearGradient id={`${id}h`} gradientUnits="userSpaceOnUse" x1="0" y1={hem} x2="0" y2={hem + 16}>
          <stop offset="0" stopColor="#000" stopOpacity=".3" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <pattern id={`${id}k`} width="4.5" height="6" patternUnits="userSpaceOnUse">
          <path d="M2.25 0V6" stroke={ink(top.color, 0.09)} strokeWidth="1.2" />
        </pattern>
        <clipPath id={`${id}t`}>
          <path d={torso} />
        </clipPath>
        <clipPath id={`${id}r`}>
          <path d={sleeve(LEFT)} />
          <path d={sleeve(RIGHT)} />
        </clipPath>
        <clipPath id={`${id}a`}>
          <path d={torso} />
          <path d={sleeve(LEFT)} />
          <path d={sleeve(RIGHT)} />
        </clipPath>
        <clipPath id={`${id}b`}>
          <path d={bottoms} />
        </clipPath>
      </defs>

      {/* behind everything: hood, back of the hair */}
      {top.kind === 'hoodie' && shape('M73 99 C64 70 136 70 127 99 Q100 116 73 99 Z', top.color)}
      {hairStyle === 'long' && <path d="M78 56 H122 V132 Q100 141 78 132 Z" fill={hair} />}
      {hairStyle === 'bob' && <path d="M80 54 H120 V79 Q100 86 80 79 Z" fill={hair} />}
      {hairStyle === 'bun' && (
        <>
          <circle cx={100} cy={13} r={11.5} fill={hair} />
          <circle cx={100} cy={13} r={11.5} fill={u('c')} />
        </>
      )}

      {/* legs, ankles, socks, shoes */}
      {bareFrom > 0
        ? SIDES.map(([k, m]) => shape(leg(m), skin, k))
        : [82, 118].map((cx) => <rect key={cx} x={cx - 8} y={432} width={16} height={22} fill={skin} />)}
      {bareFrom > 0 && bareFrom < 340 && SIDES.map(([k, m]) => ln(`M${m(76)} 352 Q${m(82)} 357 ${m(88)} 352`, 'rgba(10,10,10,.14)', 1.2, k))}
      {socks &&
        [82, 118].map((cx) => (
          <g key={cx}>
            <rect x={cx - 9.5} y={420} width={19} height={22} rx={3} fill="#F7F5EF" stroke={EDGE} />
            <path d={`M${cx - 9} 424 H${cx + 9}`} stroke="rgba(10,10,10,.16)" strokeWidth={5} strokeDasharray="1 2.6" />
          </g>
        ))}
      {shoe(82)}
      {shoe(118)}

      {/* midriff under cropped tops */}
      {top.crop && <path d="M66 186 Q63 214 62 240 H138 Q137 214 134 186 Z" fill={skin} stroke={EDGE} />}

      {/* bottoms */}
      {shape(bottoms, bottom.color)}
      <g clipPath={u('b')}>
        {bottom.kind === 'trousers' && (
          <>
            {ln('M82 262 L82 444 M118 262 L118 444', blSoft)}
            {ln('M70 344 Q78 349 88 346 M112 346 Q122 349 130 344', blSoft)}
            {ln('M71 428 Q82 433 93 429 M107 429 Q118 433 129 428', blSoft)}
          </>
        )}
        {bottom.kind === 'wide' && (
          <>
            {ln(`M78 ${W} Q72 320 68 450 M88 ${W} Q86 320 84 450 M122 ${W} Q128 320 132 450 M112 ${W} Q114 320 116 450`, blSoft)}
            <path d={`M48 450 Q53 300 65 ${W} H74 Q64 320 60 450 Z M152 450 Q147 300 135 ${W} H126 Q136 320 140 450 Z`} fill={ink(bottom.color, 0.05)} />
          </>
        )}
        {bottom.kind === 'cargo' && (
          <>
            {SIDES.map(([k, m]) => (
              <g key={k}>
                <path d={`M${m(58)} 306 H${m(76)} V344 Q${m(76)} 348 ${m(72)} 348 H${m(59)} Z`} fill={ink(bottom.color, 0.07)} stroke={bl} strokeLinejoin="round" />
                {ln(`M${m(58)} 317 H${m(76)}`, bl)}
                <circle cx={m(68)} cy={312} r={1.3} fill={bl} />
                {ln(`M${m(66)} 372 Q${m(80)} 380 ${m(96)} 374`, blSoft)}
                {ln(`M${m(65)} 426 Q${m(80)} 433 ${m(95)} 427 M${m(65)} 436 Q${m(80)} 441 ${m(95)} 437`, blSoft)}
              </g>
            ))}
          </>
        )}
        {bottom.kind === 'shorts' && ln('M58 314 H97 M103 314 H142', blSoft)}
        {bottom.kind === 'skirt' && (
          <>
            <path
              d={`M66 ${W} L38 372 L54 378 L76 ${W} Z M86 ${W} L70 381 L86 383 L95 ${W} Z M105 ${W} L114 383 L130 381 L114 ${W} Z M124 ${W} L146 378 L162 372 L134 ${W} Z`}
              fill={ink(bottom.color, 0.06)}
            />
            {ln(`M76 ${W} L54 378 M86 ${W} L70 381 M95 ${W} L86 383 M105 ${W} L114 383 M114 ${W} L130 381 M124 ${W} L146 378`, blSoft)}
          </>
        )}
        {bottom.kind === 'mini' && (
          <>
            {ln(`M100 ${W + 8} V304`, bl)}
            <path d="M52 293 Q100 302 148 293" stroke="rgba(255,255,255,.5)" strokeWidth={1} strokeDasharray="3 2.4" fill="none" />
            {ln(`M70 ${W + 9} Q76 ${W + 22} 66 ${W + 26} M130 ${W + 9} Q124 ${W + 22} 134 ${W + 26}`, bl)}
          </>
        )}
        {/* waistband */}
        <rect x={56} y={W} width={88} height={8} fill={ink(bottom.color, 0.08)} />
        {ln(`M58 ${W + 8} H142`, bl, 1)}
        <circle cx={100} cy={W + 4} r={1.8} fill={bottom.kind === 'mini' ? METAL : bl} />
        {/* the top's cast shadow */}
        <rect x={30} y={hem} width={140} height={16} fill={u('h')} />
      </g>

      {/* hands, bare arms */}
      {SIDES.map(([k, m]) => (
        <g key={k}>
          <ellipse cx={m(handX)} cy={262} rx={6.8} ry={11} fill={skin} stroke={EDGE} />
          {ln(`M${m(handX + 2.5)} 262 V270`, 'rgba(10,10,10,.14)', 1)}
          {!long && shape(bareArm(m), skin)}
        </g>
      ))}

      {/* neck and chest */}
      <path d="M91 64 V86 Q91 92 84 95 L100 114 L116 95 Q109 92 109 86 V64 Z" fill={skin} stroke={EDGE} />
      <path d="M91 70 Q100 82 109 70 V75 Q100 88 91 75 Z" fill="rgba(10,10,10,.16)" />

      {/* what shows inside an open front */}
      {top.kind === 'cardigan' && <path d="M85 95 Q100 113 115 95 L104 154 H96 Z" fill="#FFFDF8" stroke={EDGE} />}
      {top.kind === 'coat' && (
        <path d="M89 80 Q100 86 111 80 L115 96 L102 180 H98 L85 96 Z" fill={isDark(top.color) ? '#3A3A41' : '#FFFFFF'} stroke={EDGE} />
      )}

      {/* body of the top, then sleeves over it */}
      {shape(torso, top.color)}
      <g clipPath={u('t')}>
        {SIDES.map(([k, m]) => ln(`M${m(side + 6)} 132 L${m(sh + 6)} 252`, 'rgba(10,10,10,.1)', 7, k))}
      </g>
      {SIDES.map(([k, m]) => shape(sleeve(m), top.color, k))}

      {/* cloth: texture, pattern, ribbing, folds */}
      <g clipPath={u('a')}>
        {knit && <rect x={20} y={90} width={160} height={180} fill={u('k')} />}
        {top.detail === 'check' && (
          <g stroke={accent}>
            {[112, 136, 160, 184, 208, 232, 256].map((y) => (
              <path key={y} d={`M20 ${y} H180`} strokeWidth={6} opacity={0.42} />
            ))}
            {[45, 67, 89, 111, 133, 155].map((x) => (
              <path key={x} d={`M${x} 90 V270`} strokeWidth={5} opacity={0.3} />
            ))}
            {[124, 172, 220].map((y) => (
              <path key={y} d={`M20 ${y} H180`} stroke="rgba(255,255,255,.3)" strokeWidth={1} />
            ))}
          </g>
        )}
        {top.detail === 'stripes' &&
          [122, 148, 174, 200, 226].map((y) => <path key={y} d={`M20 ${y} H180`} stroke={accent} strokeWidth={9} opacity={0.75} />)}
      </g>
      <g clipPath={u('t')}>
        {ribbed && <path d={`M40 ${hem - 3.5} H160`} stroke={tl} strokeWidth={9} strokeDasharray="1.2 3" />}
        {ribbed && ln(`M40 ${hem - 8.5} H160`, tlSoft, 1)}
        {top.kind === 'jacket' && ln(`M40 ${hem - 6} H160`, tlSoft, 1)}
        {top.kind === 'jacket' && ln('M54 124 Q100 136 146 124', tlSoft)}
        {top.kind === 'coat' ? (
          <>
            {ln(`M72 200 L64 ${hem} M128 200 L136 ${hem}`, tlSoft)}
            {ln('M60 270 H80 M120 270 H140', tl, 1.4)}
          </>
        ) : (
          <>
            {ln(`M${side + 3} 141 Q${side + 10} 151 ${side + 17} 152 M${197 - side} 141 Q${190 - side} 151 ${183 - side} 152`, tlSoft)}
            {!top.crop &&
              ln(`M${hemX + 3} ${hem - 26} Q${hemX + 12} ${hem - 19} ${hemX + 21} ${hem - 20} M${197 - hemX} ${hem - 30} Q${188 - hemX} ${hem - 23} ${179 - hemX} ${hem - 24}`, tlSoft)}
          </>
        )}
      </g>
      <g clipPath={u('r')}>
        {long && ribbed && <path d="M20 247 H180" stroke={tl} strokeWidth={9} strokeDasharray="1.2 3" />}
        {long && (ribbed || top.kind === 'shirt') && ln('M20 242 H180', tlSoft, 1)}
        {long && top.kind === 'jacket' && ln('M20 240 H180', tlSoft, 1)}
        {long && SIDES.map(([k, m]) => ln(`M${m(sh - 12 - aw)} 186 Q${m(sh - 5)} 193 ${m(sh + 3)} 190`, tlSoft, 1.2, k))}
        {!long && ln('M20 150 H80 M120 150 H180', tlSoft, 1)}
      </g>

      {/* necklines, closures, pockets */}
      {(top.kind === 'tee' || (top.kind === 'crew' && top.detail !== 'collar')) &&
        ln('M87.5 96 Q100 109 112.5 96', tl, top.kind === 'tee' ? 2.4 : 4)}

      {top.kind === 'hoodie' && (
        <>
          {ln('M84 93 Q88 109 100 117 Q112 109 116 93', tl, 2)}
          {ln('M94 113 V147 M106 113 V140', 'rgba(255,255,255,.62)', 1.8)}
          {ln('M94 147 V152 M106 140 V145', METAL, 2.4)}
          <path d="M76 208 H124 L131 242 H69 Z" fill={ink(top.color, 0.07)} stroke={tl} strokeLinejoin="round" />
          {ln(`M${sh + 9} 104 Q${sh + 5} 120 ${side + 5} 134 M${191 - sh} 104 Q${195 - sh} 120 ${195 - side} 134`, tlSoft)}
        </>
      )}

      {top.kind === 'jacket' && (
        <>
          {shape('M85 81 Q100 89 115 81 L118 97 Q100 110 82 97 Z', top.color)}
          {ln(`M100 86 V${hem}`, ink(top.color, 0.5), 1.5)}
          {ln(`M96.5 108 V${hem - 1}`, tlSoft, 1)}
          <rect x={98.4} y={87} width={3.2} height={7} rx={1} fill={METAL} />
          {ln('M112 160 L130 156', top.accent ?? METAL, 1.6)}
          {ln(`M66 ${hem - 34} L76 ${hem - 12} M134 ${hem - 34} L124 ${hem - 12}`, tl, 1.4)}
          {SIDES.map(([k, m]) => (
            <rect key={k} x={Math.min(m(sh - 12 - aw), m(sh - 4 - aw))} y={241} width={8} height={5} rx={1} fill={ink(top.color, 0.28)} />
          ))}
        </>
      )}

      {top.kind === 'coat' && (
        <>
          {SIDES.map(([k, m]) =>
            shape(`M${m(87)} 94 L${m(70)} 121 L${m(79)} 124 L${m(76)} 132 L${m(99.5)} 177 Z`, top.color, k),
          )}
          {ln(`M100 177 V${hem + 1}`, tl, 1.4)}
        </>
      )}

      {top.kind === 'cardigan' && (
        <>
          {ln('M87.5 96 L100 150 L112.5 96', tl, 4)}
          {ln(`M100 152 V${hem}`, tlSoft, 9)}
          {ln(`M100 152 V${hem}`, tl, 1)}
        </>
      )}

      {top.kind === 'shirt' && (
        <>
          {ln(`M97 110 V${hem + 1} M103 110 V${hem + 1}`, tl, 1)}
          <path d="M111 152 H128 V168 L119.5 173 L111 168 Z" fill="none" stroke={tl} strokeLinejoin="round" />
        </>
      )}

      {(top.detail === 'collar' || top.kind === 'shirt') && (
        <>
          {SIDES.map(([k, m]) => (
            <path
              key={k}
              d={`M${m(87)} 92 L${m(100)} 108 L${m(89)} 123 L${m(79)} 99 Z`}
              fill={top.kind === 'shirt' ? top.color : (top.accent ?? top.color)}
              stroke={EDGE}
              strokeLinejoin="round"
            />
          ))}
          {top.kind !== 'shirt' && (
            <>
              {ln('M100 108 V142', tl, 1)}
              <circle cx={100} cy={120} r={1.8} fill={ink(top.color, 0.42)} />
              <circle cx={100} cy={133} r={1.8} fill={ink(top.color, 0.42)} />
            </>
          )}
        </>
      )}

      {(top.detail === 'buttons' || top.kind === 'shirt') &&
        Array.from({ length: Math.max(1, Math.floor((hem - (vDepth || 110) - 22) / (top.kind === 'coat' ? 34 : 22)) + 1) }, (_, i) => {
          const step = top.kind === 'coat' ? 34 : 22
          const y = (vDepth || 110) + 14 + i * step
          return top.kind === 'cardigan' ? (
            <circle key={i} cx={100} cy={y} r={2.3} fill="#FFFDF8" stroke={EDGE} />
          ) : (
            <circle key={i} cx={top.kind === 'coat' ? 105 : 100} cy={y} r={top.kind === 'coat' ? 2.8 : 1.9} fill={ink(top.color, 0.5)} />
          )
        }).slice(0, top.kind === 'coat' ? 3 : 8)}

      {/* head */}
      {!curtain && (
        <>
          <ellipse cx={79.5} cy={50} rx={3.2} ry={5.6} fill={skin} stroke={EDGE} />
          <ellipse cx={120.5} cy={50} rx={3.2} ry={5.6} fill={skin} stroke={EDGE} />
        </>
      )}
      {shape('M79 42 C79 21 121 21 121 42 C121 58 112 73 100 73 C88 73 79 58 79 42 Z', skin)}

      {/* hair over the head */}
      {curtain && (
        <>
          <path d={curtain} fill={hair} />
          <path d={curtain} fill={u('c')} />
          {ln('M100 26 Q99 20 100 13', 'rgba(255,255,255,.14)', 1)}
        </>
      )}
      {cap && (
        <>
          <path d={cap} fill={hair} />
          <path d={cap} fill={u('c')} />
        </>
      )}
      {hairStyle === 'beanie' && (
        <>
          {shape('M77 40 C74 5 126 5 123 40 Z', hair)}
          {shape('M75.5 32 H124.5 Q126 32 126 34 V43 Q126 45 124.5 45 H75.5 Q74 45 74 43 V34 Q74 32 75.5 32 Z', hair)}
          <path d="M76 38.5 H124" stroke="rgba(10,10,10,.2)" strokeWidth={12} strokeDasharray="1.2 3" />
        </>
      )}
    </svg>
  )
}

/** Small garment glyph in the item's real colour. */
export function ItemThumb({ role, color }: { role: Role; color: string }) {
  const common = { fill: color, stroke: EDGE, strokeWidth: 1, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      {role === 'top' && <path d="M13 7 Q20 12 27 7 L36 13 L32 20 L29 18 V33 H11 V18 L8 20 L4 13 Z" {...common} />}
      {role === 'bottom' && <path d="M11 6 H29 L31 34 H22 L20 16 L18 34 H9 Z" {...common} />}
      {role === 'shoes' && (
        <>
          <path d="M5 26 V17 Q5 14 9 14 H16 L24 21 Q35 22 35 28 V29 H5 Z" {...common} />
          <path d="M5 29 H35" stroke="rgba(10,10,10,.5)" strokeWidth={2.5} strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

const INK = '#1C2E1E'
const MOSS = '#4D6D47'
const SAGE = '#C7CDC1'

/** Кольца с диском в центре. */
function Rings({ seed }: { seed: number }) {
  const cx = 120 + ((seed * 19) % 70)
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <circle
          key={i}
          cx={cx}
          cy="110"
          r={30 + i * 26}
          fill="none"
          stroke={INK}
          strokeWidth={i === 0 ? 2 : 1}
          opacity={0.55 - i * 0.11}
        />
      ))}
      <circle cx={cx} cy="110" r={24} fill={INK} />
      <rect x="228" y="54" width="54" height="54" rx="14" fill={MOSS} opacity="0.6" />
    </>
  )
}

/** Диагональные полосы, срезанные аркой. */
function Stripes({ seed }: { seed: number }) {
  const gap = 14 + (seed % 3) * 4
  return (
    <>
      <g transform="rotate(-24 160 110)">
        {Array.from({ length: 22 }, (_, i) => (
          <rect
            key={i}
            x={-60 + i * gap}
            y="-60"
            width={gap / 2}
            height="340"
            fill={INK}
            opacity={0.08 + (i % 4) * 0.05}
          />
        ))}
      </g>
      <path d="M96 190 A64 64 0 0 1 224 190 Z" fill={MOSS} opacity="0.75" />
      <circle cx="160" cy="70" r="26" fill="none" stroke={INK} strokeWidth="2" opacity="0.6" />
    </>
  )
}

/** Модульная сетка с несколькими залитыми ячейками. */
function Modules({ seed }: { seed: number }) {
  const cells = Array.from({ length: 24 }, (_, i) => i)
  return (
    <g transform="translate(40 30)">
      {cells.map((i) => {
        const col = i % 6
        const row = Math.floor(i / 6)
        const filled = (i * (seed + 3)) % 5 === 0
        return (
          <rect
            key={i}
            x={col * 40}
            y={row * 40}
            width="32"
            height="32"
            rx={filled ? 16 : 6}
            fill={filled ? INK : 'none'}
            stroke={filled ? 'none' : SAGE}
            strokeWidth="1.5"
            opacity={filled ? 0.9 : 0.85}
          />
        )
      })}
      <rect x="80" y="40" width="72" height="32" rx="16" fill={MOSS} opacity="0.8" />
    </g>
  )
}

/** Волна из линий — отсылка к сетке на первом экране. */
function Wave({ seed }: { seed: number }) {
  const amp = 20 + (seed % 4) * 6
  return (
    <>
      {Array.from({ length: 11 }, (_, i) => {
        const y = 30 + i * 16
        return (
          <path
            key={i}
            d={`M-10 ${y} Q 80 ${y - amp}, 160 ${y} T 330 ${y}`}
            fill="none"
            stroke={INK}
            strokeWidth="1.5"
            opacity={0.1 + i * 0.045}
          />
        )
      })}
      <circle cx="240" cy="70" r="30" fill={MOSS} opacity="0.75" />
      <circle cx="240" cy="70" r="30" fill="none" stroke={INK} strokeWidth="1.5" opacity="0.5" />
    </>
  )
}

const VARIANTS = [Rings, Stripes, Modules, Wave]

/**
 * Генеративное превью. Картинок в проекте нет специально: SVG весит сотни
 * байт, масштабируется без потерь и не делает ни одного запроса. Тип
 * композиции и её параметры детерминированы — их задаёт seed.
 */
export default function ProjectThumb({
  seed,
  className = '',
}: {
  seed: number
  className?: string
}) {
  const Variant = VARIANTS[seed % VARIANTS.length]
  const id = `thumb-${seed}`

  return (
    <svg viewBox="0 0 320 220" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F4F6F3" />
          <stop offset="100%" stopColor="#DFE5DD" />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect width="320" height="220" rx="18" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <rect width="320" height="220" fill={`url(#${id}-bg)`} />
        <Variant seed={seed} />
      </g>
    </svg>
  )
}

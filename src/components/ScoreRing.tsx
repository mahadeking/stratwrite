interface Props {
  score: number
  size?: number
  stroke?: number
}

export default function ScoreRing({ score, size = 88, stroke = 8 }: Props) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, score))
  const dash = (pct / 100) * circ

  const color = pct >= 90 ? '#7c3aed' : pct >= 75 ? '#4f46e5' : pct >= 50 ? '#e0a100' : '#e5484d'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eceef2" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.5s ease, stroke 0.3s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-700 leading-none text-ink-900" style={{ fontWeight: 700 }}>
          {pct}
        </span>
        <span className="mt-0.5 text-[10px] font-600 uppercase tracking-wide text-ink-400">Score</span>
      </div>
    </div>
  )
}

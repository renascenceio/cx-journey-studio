import type { EmotionalArcPoint } from "@/lib/types"

interface MiniEmotionalArcProps {
  data: EmotionalArcPoint[]
  width?: number
  height?: number
}

export function MiniEmotionalArc({
  data,
  width = 120,
  height = 32,
}: MiniEmotionalArcProps) {
  if (data.length < 2) return null

  const padX = 4
  const padY = 4
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const scores = data.map((d) => d.score)
  const min = Math.min(-5, ...scores)
  const max = Math.max(5, ...scores)
  const range = max - min

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padY + ((max - d.score) / range) * innerH,
  }))

  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = points[i - 1]
      const cpx = (prev.x + p.x) / 2
      return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
    })
    .join(" ")

  // Zero line position
  const zeroY = padY + ((max - 0) / range) * innerH

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
      role="img"
      aria-label="Emotional arc sparkline"
    >
      <line
        x1={padX}
        y1={zeroY}
        x2={width - padX}
        y2={zeroY}
        stroke="currentColor"
        strokeOpacity={0.08}
        strokeDasharray="2 2"
      />
      <path
        d={pathD}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <circle
          key={data[i].stageName}
          cx={p.x}
          cy={p.y}
          r={2}
          fill={
            data[i].score >= 0
              ? "var(--color-chart-1)"
              : "var(--color-chart-2)"
          }
        />
      ))}
    </svg>
  )
}

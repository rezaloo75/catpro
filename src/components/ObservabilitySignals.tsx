import { useMemo } from 'react'
import { Clock, Activity, AlertTriangle } from 'lucide-react'

// Deterministic pseudo-random from a seed string
function seededRandom(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 0x45d9f3b)
    h = Math.imul(h ^ (h >>> 13), 0x45d9f3b)
    h = (h ^ (h >>> 16)) >>> 0
    return (h % 1000) / 1000
  }
}

function generatePoints(seed: string, count: number, min: number, max: number): number[] {
  const rng = seededRandom(seed)
  const points: number[] = []
  let value = min + (max - min) * 0.5
  for (let i = 0; i < count; i++) {
    value += (rng() - 0.48) * (max - min) * 0.15
    value = Math.max(min, Math.min(max, value))
    points.push(value)
  }
  return points
}

function Sparkline({ points, color, height = 28, width = 80 }: { points: number[]; color: string; height?: number; width?: number }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1

  const pathPoints = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width
    const y = height - ((p - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  const d = `M ${pathPoints.join(' L ')}`

  // Gradient fill
  const fillPoints = [...pathPoints, `${width},${height}`, `0,${height}`]
  const fillD = `M ${fillPoints.join(' L ')} Z`

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#grad-${color})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SignalCard({ label, value, unit, icon: Icon, color, sparkColor, points, trend }: {
  label: string
  value: string
  unit: string
  icon: React.ElementType
  color: string
  sparkColor: string
  points: number[]
  trend: { value: string; positive: boolean }
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] rounded-lg border border-kong-border-subtle">
      <Icon size={14} className={color} />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-kong-text-muted">{label}</div>
        <div className="flex items-baseline gap-1">
          <span className="text-[15px] font-semibold text-kong-text">{value}</span>
          <span className="text-[10px] text-kong-text-muted">{unit}</span>
        </div>
      </div>
      <Sparkline points={points} color={sparkColor} />
      <div className={`text-[10px] font-medium ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
        {trend.value}
      </div>
    </div>
  )
}

export function ObservabilitySignals({ interfaceId }: { interfaceId: string }) {
  const signals = useMemo(() => {
    const latencyPoints = generatePoints(interfaceId + '-lat', 20, 15, 60)
    const throughputPoints = generatePoints(interfaceId + '-thr', 20, 800, 5000)
    const errorPoints = generatePoints(interfaceId + '-err', 20, 0, 2.5)

    const latencyAvg = Math.round(latencyPoints.reduce((a, b) => a + b, 0) / latencyPoints.length)
    const throughputAvg = Math.round(throughputPoints.reduce((a, b) => a + b, 0) / throughputPoints.length)
    const errorAvg = (errorPoints.reduce((a, b) => a + b, 0) / errorPoints.length).toFixed(2)

    return { latencyPoints, throughputPoints, errorPoints, latencyAvg, throughputAvg, errorAvg }
  }, [interfaceId])

  return (
    <div className="grid grid-cols-3 gap-2 mt-3">
      <SignalCard
        label="P99 Latency"
        value={String(signals.latencyAvg)}
        unit="ms"
        icon={Clock}
        color="text-sky-400"
        sparkColor="#38bdf8"
        points={signals.latencyPoints}
        trend={{ value: '-2.1ms', positive: true }}
      />
      <SignalCard
        label="Throughput"
        value={signals.throughputAvg > 999 ? `${(signals.throughputAvg / 1000).toFixed(1)}k` : String(signals.throughputAvg)}
        unit="req/m"
        icon={Activity}
        color="text-emerald-400"
        sparkColor="#34d399"
        points={signals.throughputPoints}
        trend={{ value: '+4.3%', positive: true }}
      />
      <SignalCard
        label="Error Rate"
        value={signals.errorAvg}
        unit="%"
        icon={AlertTriangle}
        color={Number(signals.errorAvg) > 1.5 ? 'text-red-400' : 'text-amber-400'}
        sparkColor={Number(signals.errorAvg) > 1.5 ? '#f87171' : '#fbbf24'}
        points={signals.errorPoints}
        trend={{ value: Number(signals.errorAvg) > 1 ? '+0.3%' : '-0.1%', positive: Number(signals.errorAvg) <= 1 }}
      />
    </div>
  )
}

function MiniSignal({ label, value, unit, sparkColor, points }: { label: string; value: string; unit: string; sparkColor: string; points: number[] }) {
  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${value}${unit}`}>
      <Sparkline points={points} color={sparkColor} height={16} width={32} />
      <span className="text-[10px] text-kong-text-secondary whitespace-nowrap">
        {value}<span className="text-kong-text-muted">{unit}</span>
      </span>
    </div>
  )
}

export function ObservabilityMiniSignals({ interfaceId }: { interfaceId: string }) {
  const signals = useMemo(() => {
    const latencyPoints = generatePoints(interfaceId + '-lat', 12, 15, 60)
    const throughputPoints = generatePoints(interfaceId + '-thr', 12, 800, 5000)
    const errorPoints = generatePoints(interfaceId + '-err', 12, 0, 2.5)

    const latencyAvg = Math.round(latencyPoints.reduce((a, b) => a + b, 0) / latencyPoints.length)
    const throughputAvg = Math.round(throughputPoints.reduce((a, b) => a + b, 0) / throughputPoints.length)
    const errorAvg = (errorPoints.reduce((a, b) => a + b, 0) / errorPoints.length).toFixed(1)

    return { latencyPoints, throughputPoints, errorPoints, latencyAvg, throughputAvg, errorAvg }
  }, [interfaceId])

  return (
    <div className="flex items-center gap-3">
      <MiniSignal label="P99 Latency" value={String(signals.latencyAvg)} unit="ms" sparkColor="#38bdf8" points={signals.latencyPoints} />
      <MiniSignal
        label="Throughput"
        value={signals.throughputAvg > 999 ? `${(signals.throughputAvg / 1000).toFixed(1)}k` : String(signals.throughputAvg)}
        unit="/m" sparkColor="#34d399" points={signals.throughputPoints}
      />
      <MiniSignal label="Error Rate" value={signals.errorAvg} unit="%" sparkColor={Number(signals.errorAvg) > 1.5 ? '#f87171' : '#fbbf24'} points={signals.errorPoints} />
    </div>
  )
}

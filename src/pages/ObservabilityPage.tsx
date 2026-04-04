import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, Activity, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react'
import { interfaces } from '../data/interfaces'

export function ObservabilityPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const iface = id ? interfaces.find(i => i.id === id) : undefined

  return (
    <div>
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-[12px] text-kong-text-secondary hover:text-kong-text mb-4">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-sky-500/15 flex items-center justify-center">
          <Eye size={20} className="text-sky-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-kong-text">Observability</h1>
          {iface ? (
            <p className="text-sm text-kong-text-secondary">{iface.name} — dashboards, SLOs, and error tracking</p>
          ) : (
            <p className="text-sm text-kong-text-secondary">Unified observability across all interfaces</p>
          )}
        </div>
      </div>

      {iface ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <MetricCard icon={CheckCircle} label="SLO Target" value="99.9%" ok />
            <MetricCard icon={Activity} label="Current Availability" value="99.97%" ok />
            <MetricCard icon={AlertTriangle} label="Error Budget Remaining" value="72%" ok />
            <MetricCard icon={BarChart3} label="Avg Response Time" value="38ms" ok />
          </div>

          <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
            <h2 className="text-sm font-semibold text-kong-text mb-4">Request Rate — Last 24h</h2>
            <div className="h-40 bg-white/[0.02] rounded-lg flex items-end justify-between px-4 pb-4 gap-1 border border-kong-border-subtle">
              {Array.from({ length: 24 }, (_, i) => {
                const h = 20 + Math.random() * 80
                return (
                  <div key={i} className="flex-1 bg-sky-500/50 rounded-t hover:bg-sky-400/60 transition-opacity" style={{ height: `${h}%` }} title={`${i}:00 — ${Math.round(h * 100)} req/s`} />
                )
              })}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-kong-text-muted">
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>Now</span>
            </div>
          </div>

          <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
            <h2 className="text-sm font-semibold text-kong-text mb-4">Recent Errors</h2>
            <div className="space-y-2">
              {[
                { time: '14:23:01', code: '502', msg: 'Bad gateway — upstream timeout', count: 3 },
                { time: '13:45:12', code: '429', msg: 'Rate limit exceeded', count: 12 },
                { time: '12:10:55', code: '500', msg: 'Internal server error', count: 1 },
              ].map((e, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-lg border border-kong-border-subtle">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-kong-text-muted font-mono">{e.time}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/15 text-red-400">{e.code}</span>
                    <span className="text-[12px] text-kong-text">{e.msg}</span>
                  </div>
                  <span className="text-[11px] text-kong-text-muted">{e.count}x</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <button onClick={() => nav(`/interfaces/${iface.id}`)} className="text-[12px] text-kong-teal hover:underline">
              ← Back to {iface.name} in Catalog
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-kong-surface rounded-lg border border-kong-border p-8 text-center">
          <Eye size={32} className="text-kong-text-muted mx-auto mb-3" />
          <h2 className="text-sm font-medium text-kong-text mb-1">Observability</h2>
          <p className="text-[12px] text-kong-text-secondary">Unified observability for all Konnect-managed interfaces.</p>
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, ok }: { icon: React.ElementType; label: string; value: string; ok: boolean }) {
  return (
    <div className="bg-kong-surface rounded-lg border border-kong-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={ok ? 'text-green-400' : 'text-red-400'} />
        <span className="text-[11px] text-kong-text-muted">{label}</span>
      </div>
      <div className={`text-lg font-semibold ${ok ? 'text-green-400' : 'text-red-400'}`}>{value}</div>
    </div>
  )
}

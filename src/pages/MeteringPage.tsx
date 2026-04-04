import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Receipt, TrendingUp, Users, CreditCard } from 'lucide-react'
import { interfaces } from '../data/interfaces'

export function MeteringPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const iface = id ? interfaces.find(i => i.id === id) : undefined

  return (
    <div>
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-[12px] text-kong-text-secondary hover:text-kong-text mb-4">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Receipt size={20} className="text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-kong-text">Metering & Billing</h1>
          {iface ? (
            <p className="text-sm text-kong-text-secondary">{iface.name} — product plans, usage, and revenue</p>
          ) : (
            <p className="text-sm text-kong-text-secondary">API monetization and usage metering</p>
          )}
        </div>
      </div>

      {iface && iface.associatedApps.meteringBilling.linked ? (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <MetricCard icon={CreditCard} label="Active Plans" value={String(iface.associatedApps.meteringBilling.details?.plans || 3)} />
            <MetricCard icon={Users} label="Paying Subscribers" value="23" />
            <MetricCard icon={TrendingUp} label="Monthly Revenue" value={String(iface.associatedApps.meteringBilling.details?.monthlyRevenue || '$8,200')} />
            <MetricCard icon={Receipt} label="API Calls (MTD)" value="2.4M" />
          </div>

          <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
            <h2 className="text-sm font-semibold text-kong-text mb-4">Billing Products</h2>
            <div className="space-y-2">
              {[
                { name: 'Free Tier', calls: '1,000/mo', price: 'Free', subscribers: 12 },
                { name: 'Standard', calls: '100,000/mo', price: '$99/mo', subscribers: 8 },
                { name: 'Enterprise', calls: 'Unlimited', price: '$499/mo', subscribers: 3 },
              ].map(plan => (
                <div key={plan.name} className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-lg border border-kong-border-subtle">
                  <div>
                    <div className="text-[13px] font-medium text-kong-text">{plan.name}</div>
                    <div className="text-[11px] text-kong-text-muted">{plan.calls} · {plan.price}</div>
                  </div>
                  <span className="text-[12px] text-kong-text-secondary">{plan.subscribers} subscribers</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
            <h2 className="text-sm font-semibold text-kong-text mb-4">Usage — Last 30 Days</h2>
            <div className="h-32 bg-white/[0.02] rounded-lg flex items-end justify-between px-3 pb-3 gap-0.5 border border-kong-border-subtle">
              {Array.from({ length: 30 }, (_, i) => {
                const h = 15 + Math.random() * 85
                return (
                  <div key={i} className="flex-1 bg-amber-500/40 rounded-t hover:bg-amber-400/60 transition-opacity" style={{ height: `${h}%` }} />
                )
              })}
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
          <Receipt size={32} className="text-kong-text-muted mx-auto mb-3" />
          <h2 className="text-sm font-medium text-kong-text mb-1">Metering & Billing</h2>
          <p className="text-[12px] text-kong-text-secondary max-w-md mx-auto">
            {iface ? `${iface.name} is not yet configured for metering and billing.` : 'Monetize APIs with usage-based plans and billing.'}
          </p>
          {iface && (
            <button className="mt-4 px-4 py-2 bg-kong-cta text-[#0d1117] text-[12px] font-semibold rounded-md hover:brightness-110 transition">
              Promote to Product
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-kong-surface rounded-lg border border-kong-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-amber-400" />
        <span className="text-[11px] text-kong-text-muted">{label}</span>
      </div>
      <div className="text-lg font-semibold text-kong-text">{value}</div>
    </div>
  )
}

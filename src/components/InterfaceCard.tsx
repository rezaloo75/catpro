import { useNavigate } from 'react-router-dom'
import type { CatalogInterface } from '../types'
import { TypePill, CriticalityPill, GatewayBadge } from './Pills'
import { LLMProviderBadge } from './LLMProviderLogo'
import { ObservabilityMiniSignals } from './ObservabilitySignals'
import { Eye, Globe, Receipt, Waypoints, Trash2 } from 'lucide-react'
import { useMode } from '../contexts/ModeContext'

export function InterfaceCard({ iface }: { iface: CatalogInterface }) {
  const nav = useNavigate()
  const { mode, removeInterface } = useMode()
  const apps = [
    { linked: iface.associatedApps.observability.linked, icon: Eye, label: 'Observability' },
    { linked: iface.associatedApps.portal.linked, icon: Globe, label: 'Portal' },
    { linked: iface.associatedApps.meteringBilling.linked, icon: Receipt, label: 'Metering' },
    { linked: iface.associatedApps.contextMesh.linked, icon: Waypoints, label: 'Context Mesh' },
  ]

  return (
    <div
      onClick={() => nav(`/interfaces/${iface.id}`)}
      className="bg-kong-surface rounded-lg border border-kong-border p-4 hover:border-kong-teal/30 hover:bg-kong-surface-raised cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-semibold text-kong-text leading-tight">{iface.name}</h3>
          <p className="text-[11px] text-kong-text-muted mt-1 line-clamp-2">{iface.description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {mode === 'creation' && (
            <button
              onClick={e => { e.stopPropagation(); removeInterface(iface.id) }}
              className="p-1 rounded text-kong-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
          <TypePill type={iface.type} />
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-3">
        <CriticalityPill criticality={iface.criticality} />
        {iface.llmProvider && <LLMProviderBadge provider={iface.llmProvider} />}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="text-[11px] text-kong-text-secondary flex items-center gap-1.5">
          <span className="font-medium">{iface.domain}</span>
          <span className="text-kong-text-muted">·</span>
          <span>{iface.ownerTeam}</span>
          {iface.specType && iface.specType !== 'Unknown' && (
            <>
              <span className="text-kong-text-muted">·</span>
              <span className="text-kong-text-muted">{iface.specType}</span>
            </>
          )}
        </div>
        <span title={iface.gatewayLink ? `Linked to ${iface.gatewayLink.controlPlaneName}` : 'Not linked to a gateway'}>
          <GatewayBadge linked={!!iface.gatewayLink} />
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-kong-border flex items-center justify-between">
        {iface.associatedApps.observability.linked ? (
          <ObservabilityMiniSignals interfaceId={iface.id} />
        ) : <div />}
        <div className="flex items-center gap-1.5">
          {apps.map(a => {
            const Icon = a.icon
            return (
              <span key={a.label} title={a.linked ? `${a.label}: Associated` : `${a.label}: Not associated`}>
                <Icon size={13} className={a.linked ? 'text-kong-teal' : 'text-white/10'} strokeWidth={a.linked ? 2 : 1.5} />
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

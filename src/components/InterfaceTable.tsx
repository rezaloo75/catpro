import { useNavigate } from 'react-router-dom'
import { ArrowUp, ArrowDown, ArrowUpDown, Eye, Globe, Receipt, Waypoints, Trash2 } from 'lucide-react'
import type { CatalogInterface } from '../types'
import type { SortField, SortDir } from '../hooks/useCatalogFilters'
import { TypePill, GatewayBadge, SpecBadge } from './Pills'
import { LLMProviderBadge } from './LLMProviderLogo'
import { ObservabilityMiniSignals } from './ObservabilitySignals'
import { useMode } from '../contexts/ModeContext'

function AppDots({ iface }: { iface: CatalogInterface }) {
  const apps = [
    { linked: iface.associatedApps.observability.linked, icon: Eye, label: 'Observability', color: 'text-sky-400' },
    { linked: iface.associatedApps.portal.linked, icon: Globe, label: 'Portal', color: 'text-green-400' },
    { linked: iface.associatedApps.meteringBilling.linked, icon: Receipt, label: 'Metering', color: 'text-amber-400' },
    { linked: iface.associatedApps.contextMesh.linked, icon: Waypoints, label: 'Context Mesh', color: 'text-purple-400' },
  ]
  return (
    <div className="flex items-center gap-1.5">
      {apps.map(a => {
        const Icon = a.icon
        return (
          <span key={a.label} title={`${a.label}: ${a.linked ? 'Yes' : 'No'}`}>
            <Icon size={13} className={a.linked ? a.color : 'text-white/10'} strokeWidth={a.linked ? 2 : 1.5} />
          </span>
        )
      })}
    </div>
  )
}

interface SortableThProps {
  label: string
  field: SortField
  currentField: SortField
  currentDir: SortDir
  onSort: (field: SortField) => void
}

function SortableTh({ label, field, currentField, currentDir, onSort }: SortableThProps) {
  const isActive = currentField === field
  return (
    <th
      className="px-4 py-2.5 text-[11px] font-semibold text-kong-text-secondary uppercase tracking-wide cursor-pointer select-none hover:text-kong-text transition-colors group"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          currentDir === 'asc'
            ? <ArrowUp size={11} className="text-kong-teal" />
            : <ArrowDown size={11} className="text-kong-teal" />
        ) : (
          <ArrowUpDown size={11} className="text-kong-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </span>
    </th>
  )
}

interface InterfaceTableProps {
  items: CatalogInterface[]
  sortField: SortField
  sortDir: SortDir
  onSort: (field: SortField) => void
}

export function InterfaceTable({ items, sortField, sortDir, onSort }: InterfaceTableProps) {
  const nav = useNavigate()
  const { mode, removeInterface } = useMode()

  return (
    <div className="bg-kong-surface rounded-lg border border-kong-border overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-kong-border">
            <SortableTh label="Name" field="name" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <SortableTh label="Type" field="type" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <SortableTh label="Domain" field="domain" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <SortableTh label="Owner" field="ownerTeam" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <SortableTh label="Gateway" field="gateway" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <th className="px-4 py-2.5 text-[11px] font-semibold text-kong-text-secondary uppercase tracking-wide">Apps</th>
            <th className="px-4 py-2.5 text-[11px] font-semibold text-kong-text-secondary uppercase tracking-wide">Signals</th>
            <SortableTh label="Spec" field="specType" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            <SortableTh label="Updated" field="updatedAt" currentField={sortField} currentDir={sortDir} onSort={onSort} />
            {mode === 'creation' && <th className="px-4 py-2.5 w-10" />}
          </tr>
        </thead>
        <tbody>
          {items.map(iface => (
            <tr
              key={iface.id}
              onClick={() => nav(`/interfaces/${iface.id}`)}
              className="border-b border-kong-border-subtle last:border-0 hover:bg-white/[0.02] cursor-pointer transition-colors"
            >
              <td className="px-4 py-3">
                <div className="text-[13px] font-medium text-kong-text hover:text-kong-teal transition-colors">{iface.name}</div>
                <div className="text-[11px] text-kong-text-muted mt-0.5 line-clamp-1 max-w-[280px]">{iface.description}</div>
              </td>
              <td className="px-4 py-3">
                <TypePill type={iface.type} />
              </td>
              <td className="px-4 py-3 text-[12px] text-kong-text-secondary">{iface.domain}</td>
              <td className="px-4 py-3 text-[12px] text-kong-text-secondary">{iface.ownerTeam}</td>
              <td className="px-4 py-3"><GatewayBadge linked={!!iface.gatewayLink} /></td>
              <td className="px-4 py-3"><AppDots iface={iface} /></td>
              <td className="px-4 py-3">
                {iface.associatedApps.observability.linked
                  ? <ObservabilityMiniSignals interfaceId={iface.id} />
                  : <span className="text-[10px] text-kong-text-muted">—</span>
                }
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-col items-end gap-1">
                  <SpecBadge specType={iface.specType} />
                  {iface.llmProvider && <LLMProviderBadge provider={iface.llmProvider} />}
                </div>
              </td>
              <td className="px-4 py-3 text-[12px] text-kong-text-muted whitespace-nowrap">{iface.updatedAt}</td>
              {mode === 'creation' && (
                <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => removeInterface(iface.id)}
                    className="p-1 rounded text-kong-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <div className="py-12 text-center text-kong-text-secondary text-sm">
          No interfaces match the current filters.
        </div>
      )}
    </div>
  )
}

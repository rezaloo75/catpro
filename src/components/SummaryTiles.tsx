import { Radio, Layers, Sparkles, Waypoints, BookOpen, Eye, Globe, Receipt, Puzzle } from 'lucide-react'
import type { InterfaceType } from '../types'
import type { FilterState } from '../hooks/useCatalogFilters'

interface Stats {
  total: number
  rest: number
  event: number
  llm: number
  mcp: number
  generic: number
  gatewayLinked: number
  portalPublished: number
  monetized: number
  observable: number
  inContextMesh: number
}

function Tile({ label, value, icon: Icon, iconColor, active, onClick }: {
  label: string; value: number; icon: React.ElementType; iconColor?: string; active?: boolean; onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-md border px-3 py-2 flex items-center gap-2.5 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      } ${
        active
          ? 'bg-kong-teal/10 border-kong-teal/30 ring-1 ring-kong-teal/20'
          : 'bg-kong-surface border-kong-border hover:border-kong-text-muted'
      }`}
    >
      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
        <Icon size={15} strokeWidth={1.5} className={iconColor || 'text-kong-text-secondary'} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-base font-semibold text-kong-text">{value}</span>
        <span className="text-[10px] text-kong-text-secondary">{label}</span>
      </div>
    </div>
  )
}

function SectionLabelAccent({ label }: { label: string }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-widest text-kong-cta mb-1.5">{label}</div>
  )
}

interface SummaryTilesProps {
  stats: Stats
  filters: FilterState
  setFilters: (fn: (prev: FilterState) => FilterState) => void
}

export function SummaryTiles({ stats, filters, setFilters }: SummaryTilesProps) {
  const toggleType = (type: InterfaceType) => {
    setFilters(f => {
      const has = f.types.includes(type)
      return { ...f, types: has ? f.types.filter(t => t !== type) : [...f.types, type] }
    })
  }

  const clearTypes = () => {
    setFilters(f => ({ ...f, types: [] }))
  }

  const toggleGateway = () => {
    setFilters(f => ({ ...f, gatewayLinked: f.gatewayLinked === 'linked' ? 'all' : 'linked' }))
  }

  const toggleCoverage = (key: 'hasObservability' | 'hasPortal' | 'hasMetering' | 'hasContextMesh') => {
    setFilters(f => ({ ...f, [key]: f[key] === true ? null : true }))
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <div>
        <SectionLabelAccent label="Interface Types" />
        <div className="grid grid-cols-6 gap-2">
          <Tile label="Total" value={stats.total} icon={BookOpen} iconColor="text-kong-text-secondary"
            active={filters.types.length === 0} onClick={clearTypes} />
          <Tile label="REST APIs" value={stats.rest} icon={Radio} iconColor="text-blue-400"
            active={filters.types.includes('REST API')} onClick={() => toggleType('REST API')} />
          <Tile label="Event APIs" value={stats.event} icon={Layers} iconColor="text-purple-400"
            active={filters.types.includes('Event API')} onClick={() => toggleType('Event API')} />
          <Tile label="LLM APIs" value={stats.llm} icon={Sparkles} iconColor="text-fuchsia-400"
            active={filters.types.includes('LLM API')} onClick={() => toggleType('LLM API')} />
          <Tile label="MCP" value={stats.mcp} icon={Waypoints} iconColor="text-emerald-400"
            active={filters.types.includes('MCP')} onClick={() => toggleType('MCP')} />
          <Tile label="Generic" value={stats.generic} icon={Puzzle} iconColor="text-kong-text-muted"
            active={filters.types.includes('Generic API')} onClick={() => toggleType('Generic API')} />
        </div>
      </div>
      <div>
        <SectionLabelAccent label="Konnect Coverage" />
        <div className="grid grid-cols-5 gap-2">
          <Tile label="Gateway Linked" value={stats.gatewayLinked} icon={Radio} iconColor="text-kong-teal"
            active={filters.gatewayLinked === 'linked'} onClick={toggleGateway} />
          <Tile label="Portal Published" value={stats.portalPublished} icon={Globe} iconColor="text-green-400"
            active={filters.hasPortal === true} onClick={() => toggleCoverage('hasPortal')} />
          <Tile label="Monetized" value={stats.monetized} icon={Receipt} iconColor="text-amber-400"
            active={filters.hasMetering === true} onClick={() => toggleCoverage('hasMetering')} />
          <Tile label="Observable" value={stats.observable} icon={Eye} iconColor="text-sky-400"
            active={filters.hasObservability === true} onClick={() => toggleCoverage('hasObservability')} />
          <Tile label="Context Mesh" value={stats.inContextMesh} icon={Waypoints} iconColor="text-purple-400"
            active={filters.hasContextMesh === true} onClick={() => toggleCoverage('hasContextMesh')} />
        </div>
      </div>
    </div>
  )
}

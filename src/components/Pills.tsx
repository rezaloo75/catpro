import type { InterfaceType, Criticality, DataClassification } from '../types'

const typeColors: Record<InterfaceType, string> = {
  'REST API':    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Event API':   'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'LLM API':     'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  'MCP':         'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Generic API': 'bg-white/[0.04] text-kong-text-muted border-kong-border',
}

const typeLabels: Record<InterfaceType, string> = {
  'REST API': 'REST',
  'Event API': 'Event',
  'LLM API': 'LLM',
  'MCP': 'MCP',
  'Generic API': 'Generic',
}

const criticalityColors: Record<Criticality, string> = {
  'Mission Critical': 'bg-kong-cta/10 text-kong-cta/70',
  'Business Critical': 'bg-kong-cta/10 text-kong-cta/70',
  'Standard': 'bg-kong-cta/10 text-kong-cta/70',
}

const classificationColors: Record<DataClassification, string> = {
  'Public': 'bg-kong-cta/10 text-kong-cta/70',
  'Internal': 'bg-kong-cta/10 text-kong-cta/70',
  'Confidential': 'bg-kong-cta/10 text-kong-cta/70',
  'Restricted': 'bg-kong-cta/10 text-kong-cta/70',
}

export function TypePill({ type }: { type: InterfaceType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${typeColors[type]}`}>
      {typeLabels[type]}
    </span>
  )
}

export function CriticalityPill({ criticality }: { criticality: Criticality }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-kong-cta/20 ${criticalityColors[criticality]}`}>
      {criticality}
    </span>
  )
}

export function ClassificationPill({ classification }: { classification: DataClassification }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${classificationColors[classification]}`}>
      {classification}
    </span>
  )
}

export function ComplianceTag({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-kong-text-secondary border border-kong-border-subtle">
      {tag}
    </span>
  )
}

export function GatewayBadge({ linked }: { linked: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${linked ? 'bg-kong-teal' : 'bg-kong-text-muted'}`} />
  )
}

export function SpecBadge({ specType }: { specType: string }) {
  if (!specType || specType === 'Unknown') return null
  const colors: Record<string, string> = {
    OpenAPI: 'bg-green-500/15 text-green-400 border-green-500/20',
    AsyncAPI: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    MCP: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${colors[specType] || 'bg-white/[0.06] text-kong-text-muted border-white/[0.06]'}`}>
      {specType}
    </span>
  )
}

import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Waypoints, Puzzle, Sparkles, Radio, Layers, ExternalLink, ArrowRight, BookOpen } from 'lucide-react'
import { interfaces } from '../data/interfaces'
import { useInterfaces, useMode } from '../contexts/ModeContext'
import type { CatalogInterface, Dependency } from '../types'

const CREATION_MODE_REGISTRIES: { registryId: string; registryName: string; agents: string[] }[] = [
  { registryId: 'meridian-internal-registry', registryName: 'Meridian Internal MCP Registry', agents: [] },
  { registryId: 'meridian-external-registry', registryName: 'Meridian External MCP Registry', agents: [] },
]

interface ParsedTool {
  name: string
  description: string
}

function parseTools(specSnippet?: string): ParsedTool[] {
  if (!specSnippet) return []
  try {
    const parsed = JSON.parse(specSnippet)
    if (parsed.tools && Array.isArray(parsed.tools)) {
      return parsed.tools.map((t: { name: string; description: string }) => ({
        name: t.name,
        description: t.description || '',
      }))
    }
  } catch {
    // not JSON
  }
  return []
}

function findSourceForTool(toolName: string, deps: Dependency[]): Dependency[] {
  return deps.filter(d =>
    d.relationship === 'composes-from' &&
    d.detail?.toLowerCase().includes(toolName.toLowerCase())
  )
}

function getSourceInterface(dep: Dependency): CatalogInterface | undefined {
  return dep.interfaceId ? interfaces.find(i => i.id === dep.interfaceId) : undefined
}

function gwLabel(type: string) {
  if (type === 'event') return 'Event Gateway'
  if (type === 'ai') return 'AI Gateway'
  return 'API Gateway'
}

// ===== MCP Tool Mapping View =====
function MCPToolMapping({ iface }: { iface: CatalogInterface }) {
  const tools = parseTools(iface.specSnippet)
  const deps = iface.dependencies.filter(d => d.relationship === 'composes-from')

  // Build a map of all source interfaces
  const sourceInterfaces = new Map<string, { dep: Dependency; source?: CatalogInterface }>()
  for (const dep of deps) {
    const key = dep.interfaceId || dep.interfaceName
    if (!sourceInterfaces.has(key)) {
      sourceInterfaces.set(key, { dep, source: getSourceInterface(dep) })
    }
  }

  return (
    <div className="space-y-6">
      {/* MCP server header */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Waypoints size={16} className="text-emerald-400" />
          <h3 className="text-sm font-medium text-emerald-400">MCP Server — Tool Composition</h3>
        </div>
        <p className="text-[12px] text-emerald-300/70">
          This MCP server exposes {tools.length} tools composed from {sourceInterfaces.size} source interfaces.
          Each tool maps to one or more API endpoints, event topics, or LLM capabilities.
        </p>
      </div>

      {/* Tool → Source mapping */}
      <div className="bg-kong-surface rounded-lg border border-kong-border overflow-hidden">
        <div className="px-4 py-3 border-b border-kong-border">
          <h3 className="text-sm font-semibold text-kong-text">Tool → Source Mapping</h3>
        </div>
        <div className="divide-y divide-kong-border-subtle">
          {tools.map(tool => {
            const sources = findSourceForTool(tool.name, deps)
            // If no direct match, try broader matching from deps that mention this tool
            const allSources = sources.length > 0 ? sources : deps.filter(d =>
              d.detail?.toLowerCase().includes(tool.name.replace(/_/g, ' ').toLowerCase()) ||
              d.detail?.toLowerCase().includes(tool.name.toLowerCase())
            )

            return (
              <div key={tool.name} className="px-4 py-3">
                <div className="flex items-start gap-4">
                  {/* Tool */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        tool
                      </span>
                      <span className="text-[13px] font-semibold text-kong-text font-mono">{tool.name}</span>
                    </div>
                    <p className="text-[11px] text-kong-text-muted leading-relaxed">{tool.description}</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 pt-1.5">
                    <ArrowRight size={14} className="text-kong-text-muted" />
                  </div>

                  {/* Sources */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {allSources.length > 0 ? allSources.map((dep, i) => {
                      const src = getSourceInterface(dep)
                      return <SourceLink key={i} dep={dep} source={src} />
                    }) : (
                      <span className="text-[11px] text-kong-text-muted">Internal implementation</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* All source interfaces summary */}
      <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
        <h3 className="text-sm font-semibold text-kong-text mb-4">Source Interfaces</h3>
        <div className="space-y-2">
          {Array.from(sourceInterfaces.values()).map(({ dep, source }, i) => (
            <SourceInterfaceRow key={i} dep={dep} source={source} />
          ))}
        </div>
      </div>

    </div>
  )
}

function SourceLink({ dep, source }: { dep: Dependency; source?: CatalogInterface }) {
  const typeIcon = dep.type === 'REST API' ? Radio : dep.type === 'Event API' ? Layers : dep.type === 'LLM API' ? Sparkles : Puzzle
  const TypeIcon = typeIcon
  const typeColor = dep.type === 'REST API' ? 'text-blue-400' : dep.type === 'Event API' ? 'text-purple-400' : dep.type === 'LLM API' ? 'text-fuchsia-400' : 'text-kong-text-muted'

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/[0.02] rounded border border-kong-border-subtle">
      <TypeIcon size={12} className={typeColor} />
      <div className="flex-1 min-w-0">
        {source ? (
          <span className="flex items-center gap-1.5">
            <Link to={`/interfaces/${source.id}`} className="text-[12px] font-medium text-kong-teal hover:underline inline-flex items-center gap-1">
              {dep.interfaceName} <ExternalLink size={9} />
            </Link>
            {source.gatewayLink && (
              <Link
                to={`/gateway/${source.gatewayLink.gatewayProductType}/${source.gatewayLink.navigableTargetId}`}
                className="text-[10px] text-kong-text-muted hover:text-kong-teal inline-flex items-center gap-0.5"
                title={gwLabel(source.gatewayLink.gatewayProductType)}
              >
                <Radio size={9} />
              </Link>
            )}
          </span>
        ) : (
          <span className="text-[12px] font-medium text-kong-text truncate block">{dep.interfaceName}</span>
        )}
      </div>
      {!source && dep.type === 'External' && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/20 flex-shrink-0">
          External
        </span>
      )}
    </div>
  )
}

function SourceInterfaceRow({ dep, source }: { dep: Dependency; source?: CatalogInterface }) {
  const typeIcon = dep.type === 'REST API' ? Radio : dep.type === 'Event API' ? Layers : dep.type === 'LLM API' ? Sparkles : Puzzle
  const TypeIcon = typeIcon
  const typeBg = dep.type === 'REST API' ? 'bg-blue-500/15 text-blue-400 border-blue-500/20'
    : dep.type === 'Event API' ? 'bg-purple-500/15 text-purple-400 border-purple-500/20'
    : dep.type === 'LLM API' ? 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20'
    : dep.type === 'External' ? 'bg-orange-500/15 text-orange-400 border-orange-500/20'
    : 'bg-white/[0.06] text-kong-text-secondary border-kong-border'

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-lg border border-kong-border-subtle">
      <div className="flex items-center gap-3">
        <TypeIcon size={15} className="text-kong-text-muted" />
        <div>
          {source ? (
            <Link to={`/interfaces/${source.id}`} className="text-[13px] font-medium text-kong-teal hover:underline inline-flex items-center gap-1">
              {dep.interfaceName} <ExternalLink size={10} />
            </Link>
          ) : (
            <span className="text-[13px] font-medium text-kong-text">{dep.interfaceName}</span>
          )}
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${typeBg}`}>
              {String(dep.type)}
            </span>
            {source && <span className="text-[11px] text-kong-text-muted">{source.domain}</span>}
            {dep.detail && <span className="text-[11px] text-kong-text-muted">· {dep.detail}</span>}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {source?.gatewayLink && (
          <Link
            to={`/gateway/${source.gatewayLink.gatewayProductType}/${source.gatewayLink.navigableTargetId}`}
            className="text-[11px] text-kong-text-muted hover:text-kong-teal inline-flex items-center gap-1 transition-colors"
          >
            {gwLabel(source.gatewayLink.gatewayProductType)} <ExternalLink size={10} />
          </Link>
        )}
      </div>
    </div>
  )
}

// ===== Non-MCP Source View =====
function SourceInterfaceView({ iface }: { iface: CatalogInterface }) {
  const mcpsUsingThis = interfaces.filter(m =>
    m.type === 'MCP' && m.dependencies.some(d => d.interfaceId === iface.id)
  )

  return (
    <div className="space-y-6">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Puzzle size={16} className="text-blue-400" />
          <h3 className="text-sm font-medium text-blue-400">Used as Source Interface</h3>
        </div>
        <p className="text-[12px] text-blue-300/70">
          This interface provides capabilities that are composed into MCP servers within the Context Mesh.
        </p>
      </div>

      {mcpsUsingThis.length > 0 ? (
        <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
          <h3 className="text-sm font-semibold text-kong-text mb-4">
            Composed into {mcpsUsingThis.length} MCP Server{mcpsUsingThis.length > 1 ? 's' : ''}
          </h3>
          <div className="space-y-2">
            {mcpsUsingThis.map(mcp => {
              // Find which tools use this interface
              const relevantDeps = mcp.dependencies.filter(d => d.interfaceId === iface.id)
              const tools = parseTools(mcp.specSnippet)
              const mappedTools = tools.filter(t =>
                relevantDeps.some(d => d.detail?.toLowerCase().includes(t.name.toLowerCase()))
              )

              return (
                <div key={mcp.id} className="px-4 py-3 bg-white/[0.02] rounded-lg border border-kong-border-subtle">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Waypoints size={16} className="text-emerald-400" />
                      <Link to={`/interfaces/${mcp.id}`} className="text-[13px] font-medium text-kong-teal hover:underline">
                        {mcp.name}
                      </Link>
                    </div>
                    <Link
                      to={`/context-mesh/${mcp.id}`}
                      className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-kong-teal bg-kong-teal/10 rounded hover:bg-kong-teal/15 transition-colors"
                    >
                      View Mapping <ExternalLink size={10} />
                    </Link>
                  </div>
                  {mappedTools.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {mappedTools.map(t => (
                        <span key={t.name} className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-kong-surface rounded-lg border border-kong-border p-5 text-center">
          <p className="text-[12px] text-kong-text-muted">No MCP servers currently compose from this interface.</p>
        </div>
      )}

    </div>
  )
}

// ===== Landing Page =====
function ContextMeshLanding() {
  const nav = useNavigate()
  const { mode } = useMode()
  const allInterfaces = useInterfaces()
  const allMCPs = allInterfaces.filter(i => i.type === 'MCP')

  // Build registry groups
  const registryMap = new Map<string, { registryName: string; registryId: string; agents: string[]; mcps: { mcp: CatalogInterface; toolsExposed: number }[] }>()

  if (mode === 'creation') {
    for (const r of CREATION_MODE_REGISTRIES) {
      registryMap.set(r.registryId, { registryName: r.registryName, registryId: r.registryId, agents: r.agents, mcps: [] })
    }
  }

  for (const mcp of allMCPs) {
    const regs = mcp.associatedApps.contextMesh.registries
    if (!regs) continue
    for (const reg of regs) {
      const existing = registryMap.get(reg.registryId)
      if (existing) {
        existing.mcps.push({ mcp, toolsExposed: reg.toolsExposed })
      } else {
        registryMap.set(reg.registryId, { registryName: reg.registryName, registryId: reg.registryId, agents: reg.agents, mcps: [{ mcp, toolsExposed: reg.toolsExposed }] })
      }
    }
  }

  const totalTools = allMCPs.reduce((sum, m) => sum + (Number(m.associatedApps.contextMesh.details?.toolsExposed) || 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
          <Waypoints size={20} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-kong-text">Context Mesh</h1>
          <p className="text-sm text-kong-text-secondary">Manage MCP registries and AI-consumable tool sets</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard icon={Waypoints} label="Registries" value={String(registryMap.size)} iconClass="text-purple-400" />
        <SummaryCard icon={Waypoints} label="Registered MCP Servers" value={String(allMCPs.length)} iconClass="text-emerald-400" />
        <SummaryCard icon={Sparkles} label="Total Tools" value={String(totalTools)} iconClass="text-kong-cta" />
      </div>

      {/* Registry containers → registered MCP servers */}
      <div className="space-y-4">
        {Array.from(registryMap.entries()).map(([regId, registry]) => (
          <div key={regId} className="bg-kong-surface rounded-lg border border-kong-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-purple-500/15 flex items-center justify-center">
                  <Waypoints size={16} className="text-purple-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-kong-text">{registry.registryName}</h2>
                  <p className="text-[11px] text-kong-text-muted">{registry.mcps.length} MCP server{registry.mcps.length !== 1 ? 's' : ''} registered · {registry.agents.length} agent{registry.agents.length !== 1 ? 's' : ''} consuming</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-400">Active</span>
            </div>

            <div className="space-y-1.5">
              {registry.mcps.map(({ mcp, toolsExposed }) => {
                const sourceCount = mcp.dependencies.filter(d => d.relationship === 'composes-from').length
                const isCreatedHere = mcp.origin === 'context-mesh'

                return (
                  <div
                    key={mcp.id}
                    onClick={() => nav(`/context-mesh/${mcp.id}`)}
                    className="flex items-center justify-between px-3 py-2.5 bg-white/[0.02] rounded border border-kong-border-subtle hover:border-kong-teal/20 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium text-kong-teal">{mcp.name}</span>
                      <span className="text-[10px] text-kong-text-muted">{toolsExposed} tools · {sourceCount} sources · {mcp.domain}</span>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${isCreatedHere ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-white/[0.04] text-kong-text-muted border border-kong-border-subtle'}`}>
                      {isCreatedHere ? 'Created here' : 'Registered (BYOS)'}
                    </span>
                  </div>
                )
              })}
            </div>

            {registry.agents.length > 0 && (
              <div className="mt-3 pt-3 border-t border-kong-border-subtle">
                <div className="text-[10px] text-kong-text-muted mb-1.5">Consuming agents</div>
                <div className="flex items-center gap-1.5">
                  {registry.agents.map(a => (
                    <span key={a} className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/15">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, iconClass }: { icon: React.ElementType; label: string; value: string; iconClass: string }) {
  return (
    <div className="bg-kong-surface rounded-lg border border-kong-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={iconClass} />
        <span className="text-[11px] text-kong-text-muted">{label}</span>
      </div>
      <div className="text-lg font-semibold text-kong-text">{value}</div>
    </div>
  )
}

// ===== Main =====
export function ContextMeshPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const allInterfaces = useInterfaces()
  const iface = id ? allInterfaces.find(i => i.id === id) : undefined

  if (!iface) {
    return <ContextMeshLanding />
  }

  return (
    <div>
      <button onClick={() => nav('/context-mesh')} className="flex items-center gap-1 text-[12px] text-kong-text-secondary hover:text-kong-text mb-4">
        <ArrowLeft size={14} /> Back to Registries
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <Waypoints size={20} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-kong-text">Context Mesh</h1>
            <p className="text-sm text-kong-text-secondary">{iface.name}</p>
          </div>
        </div>
        <Link
          to={`/interfaces/${iface.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-kong-teal bg-kong-teal/10 rounded-md hover:bg-kong-teal/15 transition-colors"
        >
          <BookOpen size={13} /> View in Catalog
        </Link>
      </div>

      {iface.type === 'MCP'
        ? <MCPToolMapping iface={iface} />
        : <SourceInterfaceView iface={iface} />
      }
    </div>
  )
}

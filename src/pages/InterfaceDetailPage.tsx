import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Radio, Layers, Cpu, Waypoints, Eye, Globe, Receipt } from 'lucide-react'
import { useInterfaces, useMode } from '../contexts/ModeContext'
import type { InterfaceType } from '../types'
import { TypePill, CriticalityPill, ClassificationPill, GatewayBadge, SpecBadge } from '../components/Pills'
import { SpecViewer } from '../components/SpecViewer'
import { KongctlConfigViewer } from '../components/KongctlConfigViewer'
import { LLMProviderBadge } from '../components/LLMProviderLogo'
import { ObservabilitySignals } from '../components/ObservabilitySignals'
import { DependencyMap } from '../components/DependencyMap'
import type { CatalogInterface, GatewayLink, OriginApp } from '../types'

const originLabels: Record<OriginApp, { label: string; icon: typeof Radio }> = {
  'portal': { label: 'Dev Portal', icon: Globe },
  'api-gateway': { label: 'API Gateway', icon: Radio },
  'event-gateway': { label: 'Event Gateway', icon: Layers },
  'ai-gateway': { label: 'AI Gateway', icon: Cpu },
  'context-mesh': { label: 'Context Mesh', icon: Waypoints },
}

const tabs = ['Overview', 'Connectivity', 'Applications'] as const
type Tab = (typeof tabs)[number]

function gwTypeLabel(gl: GatewayLink) {
  switch (gl.gatewayProductType) {
    case 'api': return 'API Gateway'
    case 'event': return 'Event Gateway'
    case 'ai': return 'AI Gateway'
  }
}

function gwTypeRoute(gl: GatewayLink) {
  return `/gateway/${gl.gatewayProductType}/${gl.navigableTargetId}`
}

function gwLandingRoute(gl: GatewayLink) {
  switch (gl.gatewayProductType) {
    case 'api': return '/api-gateway'
    case 'event': return '/event-gateway'
    case 'ai': return '/ai-gateway'
  }
}

function gwIcon(gl: GatewayLink) {
  switch (gl.gatewayProductType) {
    case 'api': return Radio
    case 'event': return Layers
    case 'ai': return Cpu
  }
}

// ===== Overview Tab =====
function OverviewTab({ iface }: { iface: CatalogInterface }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Interface Summary">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Business Capability" value={iface.businessCapability} />
              <Field label="Domain" value={iface.domain} />
              <Field label="Authentication" value={iface.authPattern} />
              <Field label="Version" value={iface.version} />
            </div>
          </Section>

          <SpecViewer specType={iface.specType} specSnippet={iface.specSnippet} />
        </div>

        <div className="space-y-6">
          <Section title="Consumers">
            <div className="space-y-1.5">
              {iface.consumers.map(c => (
                <div key={c} className="text-[12px] text-kong-text-secondary px-2 py-1.5 bg-white/[0.03] rounded border border-kong-border-subtle">{c}</div>
              ))}
            </div>
          </Section>

          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              <TypePill type={iface.type} />
              <CriticalityPill criticality={iface.criticality} />
              <ClassificationPill classification={iface.dataClassification} />
              {iface.tags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-white/[0.04] rounded-full text-[11px] text-kong-text-secondary border border-kong-border-subtle">{t}</span>
              ))}
            </div>
          </Section>

          <Section title="Metadata">
            <Field label="Created" value={iface.createdAt} />
            <Field label="Last Updated" value={iface.updatedAt} />
            <Field label="ID" value={iface.id} />
          </Section>
        </div>
    </div>
  )
}
// ===== Connectivity Tab =====
function ConnectivityTab({ iface }: { iface: CatalogInterface }) {
  const gl = iface.gatewayLink
  if (!gl) {
    return (
      <div className="bg-kong-surface rounded-lg border border-kong-border p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto mb-3">
          <Radio size={20} className="text-kong-text-muted" />
        </div>
        <h3 className="text-sm font-medium text-kong-text mb-1">No Gateway Linkage</h3>
        <p className="text-[12px] text-kong-text-secondary max-w-md mx-auto">
          This interface is not yet linked to a Kong Gateway instance. Connect it to enable traffic management, security policies, and observability.
        </p>
        <button className="mt-4 px-4 py-2 bg-kong-cta text-[#0d1117] text-[12px] font-semibold rounded-md hover:brightness-110 transition">
          Link to Gateway
        </button>
      </div>
    )
  }

  const GwIcon = gwIcon(gl)

  return (
    <div className="space-y-6">
      <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-kong-teal/10 flex items-center justify-center">
            <GwIcon size={20} className="text-kong-teal" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-kong-text">{gwTypeLabel(gl)}</h3>
            <p className="text-[12px] text-kong-text-secondary">
              <Link to={gwLandingRoute(gl)} className="text-kong-teal hover:underline">{gl.controlPlaneName}</Link>
              {' '}· {gl.gatewayInstanceName}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-kong-border">
          <Field label="Control Plane">
            <Link to={gwLandingRoute(gl)} className="text-[13px] text-kong-teal hover:underline">{gl.controlPlaneName}</Link>
          </Field>
          <Field label="Gateway Instance" value={gl.gatewayInstanceName} />
          <Field label="Environment" value={gl.environment} />
        </div>
      </div>

      <Section title="Gateway Objects">
        <div className="mb-3 flex items-center gap-2">
          <GwIcon size={14} className="text-kong-teal" />
          <Link to={gwLandingRoute(gl)} className="text-[12px] font-semibold text-kong-teal hover:underline">{gl.controlPlaneName}</Link>
          <span className="text-[11px] text-kong-text-muted">· {gl.gatewayInstanceName} · {gl.environment}</span>
        </div>
        {(() => {
          const groups = new Map<string, typeof gl.objects>()
          for (const obj of gl.objects) {
            const list = groups.get(obj.type) || []
            list.push(obj)
            groups.set(obj.type, list)
          }
          return Array.from(groups.entries()).map(([type, objs]) => (
            <div key={type} className="mb-3 last:mb-0">
              <div className="text-[10px] font-semibold text-kong-text-muted uppercase tracking-wide mb-1.5 px-1">{type}s</div>
              <div className="space-y-1.5">
                {objs.map(obj => (
                  <div key={obj.id} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded-lg border border-kong-border-subtle">
                    <div className="flex items-center gap-2">
                      <Link to={gwTypeRoute(gl)} className="text-[13px] text-kong-teal font-medium hover:underline inline-flex items-center gap-1">
                        {obj.name} <ExternalLink size={10} />
                      </Link>
                    </div>
                    <span className="text-[11px] text-kong-text-muted font-mono">{obj.id}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        })()}
      </Section>

      <KongctlConfigViewer iface={iface} gatewayLink={gl} />
    </div>
  )
}

// ===== Applications Tab =====
function AssociatedAppsTab({ iface }: { iface: CatalogInterface }) {
  const apps = [
    {
      key: 'observability', label: 'Observability', icon: Eye, color: 'bg-sky-500/60',
      data: iface.associatedApps.observability, route: `/observability/${iface.id}`,
      desc: 'Dashboards, SLOs, and error tracking',
      cta: 'Enable Observability',
      benefit: 'Monitor latency, error rates, and throughput in real time. Set SLO targets, track error budgets, and get alerted before issues reach your consumers.',
    },
    {
      key: 'portal', label: 'Developer Portal', icon: Globe, color: 'bg-green-500/60',
      data: iface.associatedApps.portal, route: `/portal/${iface.id}`,
      desc: 'API documentation and developer experience',
      cta: 'Publish to Portal',
      benefit: 'Make this interface discoverable by internal teams and external partners. Auto-generate interactive documentation, manage API keys, and track developer adoption.',
    },
    {
      key: 'metering', label: 'Metering & Billing', icon: Receipt, color: 'bg-amber-500/60',
      data: iface.associatedApps.meteringBilling, route: `/metering/${iface.id}`,
      desc: 'Usage metering, plans, and billing',
      cta: 'Monetize Interface',
      benefit: 'Turn this interface into a billable product. Define usage-based plans, track consumption per consumer, and generate revenue from API access.',
    },
    {
      key: 'contextMesh', label: 'Context Mesh', icon: Waypoints, color: 'bg-purple-500/60',
      data: iface.associatedApps.contextMesh, route: `/context-mesh/${iface.id}`,
      desc: 'AI composition and semantic tool exposure',
      cta: 'Add to Context Mesh',
      benefit: 'Expose this interface as a tool for AI agents and copilots. Enable LLMs to discover and invoke its capabilities through the Model Context Protocol.',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {apps.map(app => {
        const Icon = app.icon
        return (
          <div key={app.key} className={`bg-kong-surface rounded-lg border p-5 ${app.data.linked ? 'border-kong-border' : 'border-dashed border-kong-border-subtle'} ${app.key === 'observability' && app.data.linked ? 'md:col-span-2' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${app.data.linked ? app.color : 'bg-white/[0.04]'} flex items-center justify-center`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-kong-text">{app.label}</h3>
                  <p className="text-[11px] text-kong-text-muted">{app.desc}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${app.data.linked ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.04] text-kong-text-muted'}`}>
                {app.data.linked ? 'Associated' : 'Not Associated'}
              </span>
            </div>

            {app.data.linked ? (
              <>
                <p className="text-[12px] text-kong-text-secondary mb-2">{app.data.summary}</p>

                {/* Portal: show named publications */}
                {app.key === 'portal' && iface.associatedApps.portal.publications && (
                  <div className="space-y-1.5 mb-3">
                    {iface.associatedApps.portal.publications.map(pub => (
                      <div key={pub.portalId} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded border border-kong-border-subtle">
                        <div className="flex items-center gap-2">
                          <Globe size={12} className="text-green-400" />
                          <Link to="/developer-portal" className="text-[12px] text-kong-teal hover:underline">{pub.portalName}</Link>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-kong-text-muted">{pub.audience} · {pub.visibility}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${pub.status === 'Published' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>{pub.status}</span>
                        </div>
                      </div>
                    ))}
                    {iface.type === 'MCP' && (
                      <p className="text-[10px] text-kong-text-muted italic mt-1">Portal provides developer documentation for this MCP server — not an MCP registry.</p>
                    )}
                  </div>
                )}

                {/* Context Mesh: show named registries */}
                {app.key === 'contextMesh' && iface.associatedApps.contextMesh.registries && (
                  <div className="space-y-1.5 mb-3">
                    {iface.associatedApps.contextMesh.registries.map(reg => (
                      <div key={reg.registryId} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded border border-kong-border-subtle">
                        <div className="flex items-center gap-2">
                          <Waypoints size={12} className="text-purple-400" />
                          <div>
                            <span className="text-[12px] text-kong-text">{reg.registryName}</span>
                            <span className="text-[10px] text-kong-text-muted ml-2">{reg.toolsExposed} tools</span>
                          </div>
                        </div>
                        <div className="text-[10px] text-kong-text-muted">{reg.agents.length} agent{reg.agents.length !== 1 ? 's' : ''}</div>
                      </div>
                    ))}
                  </div>
                )}

                {app.key !== 'portal' && app.key !== 'contextMesh' && app.data.linkedObjectsCount !== undefined && (
                  <p className="text-[11px] text-kong-text-muted mb-3">{app.data.linkedObjectsCount} linked objects</p>
                )}
                {app.key !== 'portal' && app.key !== 'contextMesh' && app.data.details && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {Object.entries(app.data.details).map(([k, v]) => (
                      <span key={k} className="text-[11px] text-kong-text-muted">
                        <span className="font-medium text-kong-text-secondary">{k}:</span> {String(v)}
                      </span>
                    ))}
                  </div>
                )}
                {app.key === 'observability' && <ObservabilitySignals interfaceId={iface.id} />}
                <Link to={app.route} className={`flex items-center gap-1 text-[12px] font-medium text-kong-teal hover:underline ${app.key === 'observability' ? 'mt-3' : ''}`}>
                  View in {app.label} <ExternalLink size={11} />
                </Link>
              </>
            ) : (
              <div>
                <p className="text-[12px] text-kong-text-secondary leading-relaxed mb-3">{app.benefit}</p>
                <button className="px-3 py-1.5 text-[12px] font-medium text-kong-teal bg-kong-teal/10 rounded-md hover:bg-kong-teal/15 transition-colors">
                  {app.cta}
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ===== Change Type Modal =====
const TYPE_OPTIONS: InterfaceType[] = ['REST API', 'Generic API']

function ChangeTypeModal({ current, onApply, onClose }: {
  current: InterfaceType
  onApply: (t: InterfaceType) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<InterfaceType>(current)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#0f1318] border border-kong-border rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-kong-border">
          <h2 className="text-[14px] font-semibold text-kong-text">Change Interface Type</h2>
          <button onClick={onClose} className="p-1 rounded text-kong-text-muted hover:text-kong-text hover:bg-white/[0.05] transition-colors">
            <ArrowLeft size={15} className="rotate-[135deg]" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-1.5">
          {TYPE_OPTIONS.map(t => (
            <button
              key={t}
              onClick={() => setSelected(t)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-[13px] transition-colors ${
                selected === t
                  ? 'border-kong-teal/40 bg-kong-teal/10 text-kong-text'
                  : 'border-kong-border bg-white/[0.02] text-kong-text-secondary hover:bg-white/[0.04]'
              }`}
            >
              <span>{t}</span>
              {selected === t && <span className="w-2 h-2 rounded-full bg-kong-teal" />}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-kong-border">
          <button onClick={onClose} className="px-4 py-1.5 text-[13px] text-kong-text-secondary hover:text-kong-text transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { onApply(selected); onClose() }}
            disabled={selected === current}
            className="px-4 py-1.5 text-[13px] font-semibold rounded-md bg-kong-cta text-[#0d1117] hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

// ===== Shared =====
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
      <h3 className="text-sm font-semibold text-kong-text mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="text-[11px] text-kong-text-muted font-medium mb-0.5">{label}</div>
      {children || <div className="text-[13px] text-kong-text">{value}</div>}
    </div>
  )
}

// ===== Main =====
export function InterfaceDetailPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [changeTypeOpen, setChangeTypeOpen] = useState(false)
  const allInterfaces = useInterfaces()
  const { mode, updateInterface } = useMode()

  const iface = allInterfaces.find(i => i.id === id)
  if (!iface) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-medium text-kong-text mb-2">Interface not found</h2>
        <button onClick={() => nav('/catalog')} className="text-kong-teal text-sm hover:underline">Back to Catalog</button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={() => nav('/catalog')} className="flex items-center gap-1 text-[12px] text-kong-text-secondary hover:text-kong-text mb-4 -mt-1">
        <ArrowLeft size={14} /> Back to Catalog
      </button>

      {/* Header */}
      <div className="bg-kong-surface rounded-lg border border-kong-border p-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-semibold text-kong-text">{iface.name}</h1>
              <TypePill type={iface.type} />
              <GatewayBadge linked={!!iface.gatewayLink} />
            </div>
            <p className="text-[13px] text-kong-text-secondary max-w-2xl">{iface.description}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {iface.llmProvider && <LLMProviderBadge provider={iface.llmProvider} size="md" />}
            <SpecBadge specType={iface.specType} />
            {mode === 'creation' && (iface.type === 'Generic API' || iface.type === 'REST API') && (
              <button
                onClick={() => setChangeTypeOpen(true)}
                className="px-3 py-1.5 text-[12px] font-medium rounded-md border border-kong-border text-kong-text-secondary hover:text-kong-text hover:border-kong-text-muted transition-colors"
              >
                Change Type
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-4 mt-4 pt-4 border-t border-kong-border">
          <Field label="Domain" value={iface.domain} />
          <Field label="Owner" value={iface.ownerTeam} />
          <Field label="Source" >
            {(() => {
              const o = originLabels[iface.origin]
              const OIcon = o.icon
              return (
                <div className="flex items-center gap-1.5 text-[13px] text-kong-text">
                  <OIcon size={13} strokeWidth={1.5} className="text-kong-text-secondary" />
                  {o.label}
                </div>
              )
            })()}
          </Field>
          <Field label="Version" value={iface.version} />
          <Field label="Environment" value={iface.environments.join(', ')} />
          <Field label="Region" value={iface.region} />
          <Field label="Last Updated" value={iface.updatedAt} />
        </div>

        <div className="mt-4 pt-4 border-t border-kong-border -mx-5 -mb-5">
          <DependencyMap iface={iface} />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-kong-border mb-6">
        <div className="flex items-center gap-0.5">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-kong-teal text-kong-teal'
                  : 'border-transparent text-kong-text-muted hover:text-kong-text-secondary hover:border-kong-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && <OverviewTab iface={iface} />}
      {activeTab === 'Connectivity' && <ConnectivityTab iface={iface} />}
      {activeTab === 'Applications' && <AssociatedAppsTab iface={iface} />}

      {changeTypeOpen && (
        <ChangeTypeModal
          current={iface.type as InterfaceType}
          onApply={t => updateInterface(iface.id, { type: t })}
          onClose={() => setChangeTypeOpen(false)}
        />
      )}
    </div>
  )
}

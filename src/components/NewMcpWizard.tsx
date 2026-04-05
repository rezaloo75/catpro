import { useState } from 'react'
import { X, BookOpen, Cpu, Waypoints, Plus, Trash2, ChevronDown } from 'lucide-react'
import { useMode } from '../contexts/ModeContext'
import type { CatalogInterface } from '../types'

// ─── Sample MCP server data ───────────────────────────────────────────────────

const SAMPLE_NAME = 'Banking Operations MCP Server'
const SAMPLE_URL = 'https://mcp.internal.meridianbank.com/banking-ops'
const SAMPLE_DESCRIPTION =
  'Exposes core banking operations as MCP tools. Enables AI agents to query account balances, list recent transactions, and initiate transfers on behalf of authenticated users.'
const SAMPLE_TOOLS: ToolRow[] = [
  { name: 'get_account_balance', description: 'Retrieve the current balance for a given account ID.' },
  { name: 'list_transactions', description: 'List recent transactions for an account with optional date range filters.' },
  { name: 'initiate_transfer', description: 'Initiate a fund transfer between two accounts.' },
  { name: 'get_exchange_rate', description: 'Return the current exchange rate between two currency codes.' },
]

// ─── Static options ───────────────────────────────────────────────────────────

const TRANSPORT_OPTIONS = ['HTTP/SSE', 'Streamable HTTP', 'stdio'] as const
type Transport = typeof TRANSPORT_OPTIONS[number]

const AUTH_OPTIONS = ['None', 'API Key', 'OAuth 2.0', 'mTLS'] as const
type Auth = typeof AUTH_OPTIONS[number]

const AI_CONTROL_PLANES = [
  { id: 'meridian-ai-prod', label: 'meridian-ai-prod' },
  { id: 'meridian-ai-sandbox', label: 'meridian-ai-sandbox' },
]

const REGISTRIES = [
  { id: 'meridian-internal-registry', label: 'Meridian Internal MCP Registry' },
  { id: 'meridian-external-registry', label: 'Meridian External MCP Registry' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

type YesNoMaybe = 'yes' | 'no' | null

interface ToolRow {
  name: string
  description: string
}

interface Step1State {
  serverName: string
  serverUrl: string
  description: string
  transport: Transport
  auth: Auth
  tools: ToolRow[]
  wantsGateway: YesNoMaybe
  wantsRegistry: YesNoMaybe
}

// ─── Shared components ────────────────────────────────────────────────────────

function ChoiceButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-[12px] font-medium border transition-colors ${
        selected
          ? 'bg-kong-teal/15 text-kong-teal border-kong-teal/40'
          : 'bg-transparent text-kong-text-muted border-kong-border hover:text-kong-text-secondary hover:border-kong-border-subtle'
      }`}
    >
      {label}
    </button>
  )
}

function Question({ title, description, value, onChange, children }: {
  title: string; description: string; value: YesNoMaybe
  onChange: (v: YesNoMaybe) => void; children?: React.ReactNode
}) {
  return (
    <div className="py-5 border-b border-kong-border last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-kong-text">{title}</p>
          <p className="text-[12px] text-kong-text-secondary mt-0.5 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
          <ChoiceButton label="Yes" selected={value === 'yes'} onClick={() => onChange(value === 'yes' ? null : 'yes')} />
          <ChoiceButton label="No" selected={value === 'no'} onClick={() => onChange(value === 'no' ? null : 'no')} />
        </div>
      </div>
      {children}
    </div>
  )
}

function SimpleSelect({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === value)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text focus:outline-none hover:border-kong-border-subtle transition-colors"
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={13} className={`text-kong-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-[#0f1318] border border-kong-border rounded-lg shadow-xl overflow-hidden z-20">
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false) }}
              className={`w-full text-left px-3 py-2.5 text-[13px] transition-colors ${
                value === opt.id ? 'bg-kong-teal/10 text-kong-teal' : 'text-kong-text hover:bg-white/[0.04]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SegmentedControl<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: readonly T[]
}) {
  return (
    <div className="flex rounded-md overflow-hidden border border-kong-border text-[12px] font-medium bg-kong-surface">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`flex-1 py-1.5 px-2 transition-colors ${
            i > 0 ? 'border-l border-kong-border' : ''
          } ${
            value === opt
              ? 'bg-kong-teal/15 text-kong-teal'
              : 'text-kong-text-muted hover:text-kong-text-secondary'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  )
}

// ─── Step 1 right panel ───────────────────────────────────────────────────────

function SetupSummary({ state }: { state: Step1State }) {
  const items = [
    {
      icon: BookOpen, label: 'Catalog entry', color: 'text-kong-teal',
      sub: 'MCP server registered in the interface catalog', active: true,
    },
    {
      icon: Cpu, label: 'AI Gateway proxy', color: 'text-blue-400',
      sub: state.wantsGateway === 'yes' ? 'Will be configured next'
        : state.wantsGateway === 'no' ? 'Not included'
        : 'Pending your answer',
      active: state.wantsGateway === 'yes',
    },
    {
      icon: Waypoints, label: 'Context Mesh registry', color: 'text-emerald-400',
      sub: state.wantsRegistry === 'yes' ? 'Will be configured next'
        : state.wantsRegistry === 'no' ? 'Not included'
        : 'Pending your answer',
      active: state.wantsRegistry === 'yes',
    },
  ]
  const answered = [state.wantsGateway, state.wantsRegistry].filter(v => v !== null).length
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-semibold text-kong-text">What gets created</span>
        <span className="text-[10px] text-kong-text-muted">{answered}/2 answered</span>
      </div>
      <p className="text-[11px] text-kong-text-secondary mb-4 leading-relaxed">Based on your answers, here's what will be set up for this MCP server.</p>
      <div className="space-y-3">
        {items.map(({ icon: Icon, label, sub, active, color }) => (
          <div key={label} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${active ? 'border-kong-border bg-white/[0.03]' : 'border-kong-border-subtle bg-transparent opacity-50'}`}>
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${active ? 'bg-white/[0.06]' : 'bg-white/[0.03]'}`}>
              <Icon size={13} className={active ? color : 'text-kong-text-muted'} />
            </div>
            <div>
              <p className={`text-[12px] font-medium ${active ? 'text-kong-text' : 'text-kong-text-muted'}`}>{label}</p>
              <p className="text-[10px] text-kong-text-muted mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-6">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-kong-border">
          <Waypoints size={12} className="text-kong-text-secondary flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-kong-text-secondary leading-relaxed">Gateway proxy and registry connections can always be added later from the interface's detail page.</p>
        </div>
      </div>
    </div>
  )
}

/// ─── Build CatalogInterface ───────────────────────────────────────────────────

function buildMcpInterface(s1: Step1State, controlPlane: string, registryId: string): CatalogInterface {
  const id = `created-mcp-${Date.now()}`
  const now = new Date().toISOString().split('T')[0]
  const validTools = s1.tools.filter(t => t.name.trim())

  const gatewayLink: CatalogInterface['gatewayLink'] = s1.wantsGateway === 'yes' ? {
    gatewayProductType: 'ai',
    controlPlaneName: controlPlane,
    gatewayInstanceName: controlPlane,
    environment: 'Development',
    objects: [
      { type: 'Service', name: s1.serverName || 'mcp-server', id: `svc-${id}` },
    ],
    navigableTargetId: `gw-${id}`,
  } : undefined

  const registryLinked = s1.wantsRegistry === 'yes'
  const registryLabel = REGISTRIES.find(r => r.id === registryId)?.label ?? registryId

  const specSnippet = JSON.stringify({
    name: s1.serverName || 'MCP Server',
    version: '1.0.0',
    transport: s1.transport,
    auth: s1.auth,
    tools: validTools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: { type: 'object', properties: {} },
    })),
  }, null, 2)

  return {
    id,
    name: s1.serverName || 'Unnamed MCP Server',
    type: 'MCP',
    origin: s1.wantsGateway === 'yes' ? 'ai-gateway' : 'context-mesh',
    description: s1.description || '',
    domain: 'AI & Automation',
    businessCapability: 'AI Agent Integration',
    ownerTeam: 'Donkey Kong',
    lifecycleStatus: 'Proposed',
    environments: ['Development'],
    region: '',
    complianceTags: [],
    criticality: 'Standard',
    dataClassification: 'Internal',
    authPattern: s1.auth !== 'None' ? s1.auth : 'None',
    version: '1.0.0',
    specType: 'MCP',
    specSnippet,
    gatewayLink,
    associatedApps: {
      observability: { linked: false },
      portal: { linked: false },
      meteringBilling: { linked: false },
      contextMesh: registryLinked ? {
        linked: true,
        summary: `Registered in ${registryLabel}`,
        linkedObjectsCount: 1,
        registries: [{
          registryName: registryLabel,
          registryId,
          toolsExposed: validTools.length,
          agents: [],
        }],
      } : { linked: false },
    },
    dependencies: [],
    consumers: [],
    tags: [],
    updatedAt: now,
    createdAt: now,
  }
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  launchMode?: 'registry-first'
  initialRegistryId?: string
}

export function NewMcpWizard({ onClose, launchMode, initialRegistryId }: Props) {
  const { addInterface } = useMode()
  const isRegistryFirst = launchMode === 'registry-first'
  const [step, setStep] = useState(1)
  const [s1, setS1] = useState<Step1State>({
    serverName: '', serverUrl: '', description: '',
    transport: 'HTTP/SSE', auth: 'None',
    tools: [{ name: '', description: '' }],
    wantsGateway: null,
    wantsRegistry: isRegistryFirst ? 'yes' : null,
  })
  const [controlPlane, setControlPlane] = useState('meridian-ai-gateway')
  const [registryId, setRegistryId] = useState(initialRegistryId ?? 'meridian-internal-registry')

  const setS = (patch: Partial<Step1State>) => setS1(prev => ({ ...prev, ...patch }))

  const step1Valid = s1.serverName.trim() !== '' && s1.wantsGateway !== null && s1.wantsRegistry !== null

  const save = () => {
    addInterface(buildMcpInterface(s1, controlPlane, registryId))
    onClose()
  }

  const handleNext = () => {
    if (step === 1) {
      if (s1.wantsGateway === 'yes') { setStep(2); return }
      if (s1.wantsRegistry === 'yes') { setStep(3); return }
      save()
    } else if (step === 2) {
      if (s1.wantsRegistry === 'yes') { setStep(3); return }
      save()
    } else {
      save()
    }
  }

  const goBack = () => {
    if (step === 3) setStep(s1.wantsGateway === 'yes' ? 2 : 1)
    else if (step === 2) setStep(1)
  }

  const totalSteps = [s1.wantsGateway === 'yes', s1.wantsRegistry === 'yes'].filter(Boolean).length + 1
  const stepIndex = step === 1 ? 1 : step === 2 ? 2 : totalSteps
  const stepLabel = `Step ${stepIndex} of ${totalSteps}`

  const isLastStep = (step === 1 && s1.wantsGateway !== 'yes' && s1.wantsRegistry !== 'yes') ||
    (step === 2 && s1.wantsRegistry !== 'yes') ||
    step === 3

  const addTool = () => setS({ tools: [...s1.tools, { name: '', description: '' }] })
  const removeTool = (i: number) => setS({ tools: s1.tools.filter((_, idx) => idx !== i) })
  const updateTool = (i: number, patch: Partial<ToolRow>) =>
    setS({ tools: s1.tools.map((t, idx) => idx === i ? { ...t, ...patch } : t) })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0f1318] border border-kong-border rounded-xl shadow-2xl flex flex-col h-[680px] max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-kong-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-semibold text-kong-text">{isRegistryFirst ? 'Register MCP Server' : 'New MCP Server'}</h2>
              <span className="text-[10px] text-kong-text-muted border border-kong-border rounded px-1.5 py-0.5">{stepLabel}</span>
            </div>
            <p className="text-[12px] text-kong-text-secondary mt-1">
              {step === 1 && (isRegistryFirst ? 'Describe your MCP server — it will be registered in the Context Mesh and a catalog entry created automatically.' : 'Describe your MCP server and configure its tools and connectivity options.')}
              {step === 2 && 'Proxy MCP traffic through Kong AI Gateway for managed access, rate limiting, and observability.'}
              {step === 3 && 'Register this server in a Context Mesh registry so AI agents can discover and invoke its tools.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-kong-text-muted hover:text-kong-text hover:bg-white/[0.05] transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div className="flex-1 overflow-y-auto px-6 pt-5 min-w-0">

                {/* Quick-start banner */}
                <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-kong-teal/20 bg-kong-teal/5">
                  <div>
                    <p className="text-[12px] font-semibold text-kong-text">New here? Let us pre-fill with a sample server.</p>
                    <p className="text-[11px] text-kong-text-muted mt-0.5">Loads a banking MCP server with sample tools so you can explore the full flow.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setS({
                      serverName: SAMPLE_NAME, serverUrl: SAMPLE_URL,
                      description: SAMPLE_DESCRIPTION,
                      transport: 'HTTP/SSE', auth: 'OAuth 2.0',
                      tools: SAMPLE_TOOLS,
                      wantsGateway: 'yes', wantsRegistry: 'yes',
                    })}
                    className="flex-shrink-0 px-3 py-1.5 rounded-md bg-kong-teal/15 text-kong-teal text-[12px] font-semibold hover:bg-kong-teal/25 transition-colors whitespace-nowrap"
                  >
                    Pre-fill for me
                  </button>
                </div>

                {/* Server identity */}
                <div className="space-y-3 py-4 border-b border-kong-border">
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] font-semibold text-kong-text w-24 flex-shrink-0">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Banking Operations MCP Server"
                      value={s1.serverName}
                      onChange={e => setS({ serverName: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] font-semibold text-kong-text w-24 flex-shrink-0">Server URL</label>
                    <input
                      type="text"
                      placeholder="e.g. https://mcp.internal.example.com/server"
                      value={s1.serverUrl}
                      onChange={e => setS({ serverUrl: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <label className="text-[12px] font-semibold text-kong-text w-24 flex-shrink-0 pt-1.5">Description</label>
                    <textarea
                      placeholder="What does this MCP server do?"
                      value={s1.description}
                      onChange={e => setS({ description: e.target.value })}
                      rows={2}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] font-semibold text-kong-text w-24 flex-shrink-0">Transport</label>
                    <div className="flex-1">
                      <SegmentedControl value={s1.transport} onChange={v => setS({ transport: v })} options={TRANSPORT_OPTIONS} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-[12px] font-semibold text-kong-text w-24 flex-shrink-0">Auth</label>
                    <div className="flex-1">
                      <SegmentedControl value={s1.auth} onChange={v => setS({ auth: v })} options={AUTH_OPTIONS} />
                    </div>
                  </div>
                </div>

                {/* Tools */}
                <div className="py-4 border-b border-kong-border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[13px] font-semibold text-kong-text">Tools</p>
                      <p className="text-[11px] text-kong-text-secondary mt-0.5">Functions this MCP server exposes to AI agents.</p>
                    </div>
                    <button
                      type="button"
                      onClick={addTool}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border border-kong-border text-kong-text-secondary hover:text-kong-text hover:border-kong-border-subtle transition-colors"
                    >
                      <Plus size={11} />
                      Add tool
                    </button>
                  </div>
                  <div className="space-y-2">
                    {s1.tools.map((tool, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="tool_name"
                          value={tool.name}
                          onChange={e => updateTool(i, { name: e.target.value })}
                          className="w-40 flex-shrink-0 px-2.5 py-1.5 rounded border border-kong-border bg-kong-surface text-[12px] text-kong-text placeholder:text-kong-text-muted font-mono focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Short description (optional)"
                          value={tool.description}
                          onChange={e => updateTool(i, { description: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 rounded border border-kong-border bg-kong-surface text-[12px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                        />
                        {s1.tools.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTool(i)}
                            className="p-1.5 rounded text-kong-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Questions */}
                <Question
                  title="Proxy via AI Gateway?"
                  description="Route MCP traffic through Kong AI Gateway for rate limiting, auth enforcement, and observability across all your AI agents."
                  value={s1.wantsGateway}
                  onChange={v => setS({ wantsGateway: v })}
                />
                <Question
                  title="Publish to Context Mesh registry?"
                  description="Register this server in a Context Mesh registry so it can be discovered and consumed by AI agents in your organization."
                  value={s1.wantsRegistry}
                  onChange={v => setS({ wantsRegistry: v })}
                />
              </div>

              {/* Right panel */}
              <div className="w-[260px] flex-shrink-0 border-l border-kong-border px-5 py-5 overflow-y-auto">
                <SetupSummary state={s1} />
              </div>
            </>
          )}

          {/* ── Step 2: AI Gateway ── */}
          {step === 2 && (
            <div className="flex-1 overflow-y-auto px-6 pt-5 space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-kong-text mb-0.5">Control Plane</p>
                <p className="text-[12px] text-kong-text-secondary mb-3 leading-relaxed">Select the AI Gateway control plane to manage this MCP server's proxy configuration.</p>
                <SimpleSelect
                  value={controlPlane}
                  onChange={setControlPlane}
                  options={AI_CONTROL_PLANES}
                />
              </div>
              <div className="rounded-lg border border-kong-border bg-white/[0.02] p-3">
                <p className="text-[11px] text-kong-text-muted leading-relaxed">
                  Kong AI Gateway will create a proxy route to <span className="text-kong-text">{s1.serverUrl || 'your MCP server URL'}</span> under this control plane.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Context Mesh registry ── */}
          {step === 3 && (
            <div className="flex-1 overflow-y-auto px-6 pt-5 space-y-3">
              <div>
                <p className="text-[13px] font-semibold text-kong-text mb-0.5">Registry</p>
                <p className="text-[12px] text-kong-text-secondary mb-3 leading-relaxed">Select the Context Mesh registry where this server will be discoverable by AI agents.</p>
                <SimpleSelect
                  value={registryId}
                  onChange={setRegistryId}
                  options={REGISTRIES}
                />
              </div>
              <div className="rounded-lg border border-kong-border bg-white/[0.02] p-3">
                <p className="text-[11px] text-kong-text-muted leading-relaxed">
                  Agents subscribed to this registry will be able to discover and call <span className="text-kong-text">{s1.tools.filter(t => t.name).length} tool{s1.tools.filter(t => t.name).length !== 1 ? 's' : ''}</span> exposed by this server.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-kong-border flex items-center justify-between flex-shrink-0">
          <button
            onClick={step === 1 ? onClose : goBack}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-kong-text-secondary hover:text-kong-text transition-colors rounded-md hover:bg-white/[0.04]"
          >
            {step === 1 ? 'Cancel' : <><span>←</span> Back</>}
          </button>
          <button
            onClick={handleNext}
            disabled={step === 1 && !step1Valid}
            className={`px-5 py-2 text-[13px] font-semibold rounded-md transition-all ${
              step === 1 && !step1Valid
                ? 'bg-kong-cta/30 text-[#0d1117]/50 cursor-not-allowed'
                : 'bg-kong-cta text-[#0d1117] hover:brightness-110'
            }`}
          >
            {isLastStep ? 'Create' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

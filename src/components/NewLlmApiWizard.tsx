import { useState } from 'react'
import { X, ChevronDown, BookOpen, Globe, Key, Lock, Layers, Cpu, Sparkles } from 'lucide-react'
import { useMode } from '../contexts/ModeContext'
import type { CatalogInterface, LLMProvider } from '../types'

// ─── Static data ──────────────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: 'openai' as LLMProvider,
    label: 'OpenAI',
    badge: 'GPT',
    bg: 'bg-emerald-500/10',
    activeBg: 'bg-emerald-500/20',
    border: 'border-emerald-500/20',
    activeBorder: 'border-emerald-500/50',
    text: 'text-emerald-400',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
  },
  {
    id: 'anthropic' as LLMProvider,
    label: 'Anthropic',
    badge: 'Claude',
    bg: 'bg-amber-500/10',
    activeBg: 'bg-amber-500/20',
    border: 'border-amber-500/20',
    activeBorder: 'border-amber-500/50',
    text: 'text-amber-400',
    models: ['claude-opus-4', 'claude-sonnet-4', 'claude-3-5-haiku'],
  },
  {
    id: 'mistral' as LLMProvider,
    label: 'Mistral AI',
    badge: 'Mistral',
    bg: 'bg-blue-500/10',
    activeBg: 'bg-blue-500/20',
    border: 'border-blue-500/20',
    activeBorder: 'border-blue-500/50',
    text: 'text-blue-400',
    models: ['mistral-large-latest', 'mistral-small-latest'],
  },
  {
    id: 'google' as LLMProvider,
    label: 'Google',
    badge: 'Gemini',
    bg: 'bg-red-500/10',
    activeBg: 'bg-red-500/20',
    border: 'border-red-500/20',
    activeBorder: 'border-red-500/50',
    text: 'text-red-400',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro'],
  },
]

const ROUTE_TYPES = [
  { id: 'llm/v1/chat',        label: 'Chat completions',  desc: 'Conversational AI interactions' },
  { id: 'llm/v1/completions', label: 'Completions',       desc: 'Text completion tasks' },
  { id: 'llm/v1/embeddings',  label: 'Embeddings',        desc: 'Vector embeddings for search / RAG' },
]

const AI_CONTROL_PLANES = [
  { id: 'meridian-ai-prod',    label: 'meridian-ai-prod',    env: 'Production' },
  { id: 'meridian-ai-sandbox', label: 'meridian-ai-sandbox', env: 'Development' },
]

const PORTALS = [
  { id: 'meridian-dev-hub',         label: 'Meridian Developer Hub' },
  { id: 'internal-partner-portal',  label: 'Internal Partner Portal' },
]

const AUTH_STRATEGIES = [
  { id: 'key-auth',  label: 'key-auth' },
  { id: 'disabled',  label: 'Disabled' },
]

const PORTAL_LABELS: Record<string, string> = {
  'meridian-dev-hub':        'Meridian Developer Hub',
  'internal-partner-portal': 'Internal Partner Portal',
}

// ─── Types ────────────────────────────────────────────────────────────────────

type YesNoMaybe = 'yes' | 'no' | null

interface Step1State {
  name: string
  version: string
  description: string
  businessCapability: string
  wantsGateway: YesNoMaybe
  wantsPortal: YesNoMaybe
}

interface GatewayState {
  provider: LLMProvider
  model: string
  routeType: string
  routePath: string
  controlPlane: string
}

interface PortalState {
  portalId: string
  authStrategy: string
  visibility: 'public' | 'private'
}

// ─── Shared sub-components ────────────────────────────────────────────────────

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
          <ChoiceButton label="No"  selected={value === 'no'}  onClick={() => onChange(value === 'no'  ? null : 'no')} />
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── Step 1 right panel ───────────────────────────────────────────────────────

function SetupSummary({ state }: { state: Step1State }) {
  const items = [
    { icon: BookOpen, label: 'Catalog entry',           sub: 'LLM API registered in catalog',                                            active: true,                       color: 'text-kong-teal' },
    { icon: Cpu,      label: 'AI Gateway proxy',        sub: state.wantsGateway === 'yes' ? 'Will be configured next' : state.wantsGateway === 'no' ? 'Not included' : 'Pending your answer', active: state.wantsGateway === 'yes', color: 'text-amber-400' },
    { icon: Globe,    label: 'Dev Portal publication',  sub: state.wantsPortal  === 'yes' ? 'Will be configured next' : state.wantsPortal  === 'no' ? 'Not included' : 'Pending your answer', active: state.wantsPortal  === 'yes', color: 'text-green-400' },
  ]
  const answered = [state.wantsGateway, state.wantsPortal].filter(v => v !== null).length
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-semibold text-kong-text">What gets created</span>
        <span className="text-[10px] text-kong-text-muted">{answered}/2 answered</span>
      </div>
      <p className="text-[11px] text-kong-text-secondary mb-4 leading-relaxed">Based on your answers, here's what will be set up for this LLM API.</p>
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
          <Layers size={12} className="text-kong-text-secondary flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-kong-text-secondary leading-relaxed">AI Gateway and Portal connections can always be added later from the interface's detail page.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2: Provider picker ──────────────────────────────────────────────────

function ProviderCard({ provider, selected, onClick }: {
  provider: typeof PROVIDERS[number]; selected: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all text-center cursor-pointer ${
        selected
          ? `${provider.activeBorder} ${provider.activeBg}`
          : `${provider.border} ${provider.bg} hover:brightness-110`
      }`}
    >
      {selected && (
        <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-kong-teal flex items-center justify-center">
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3l2 2 4-4" stroke="#0d1117" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <div className={`w-10 h-10 rounded-lg ${provider.activeBg} flex items-center justify-center flex-shrink-0 border ${provider.border}`}>
        <Sparkles size={18} className={provider.text} />
      </div>
      <div>
        <p className={`text-[13px] font-semibold ${selected ? provider.text : 'text-kong-text'}`}>{provider.label}</p>
        <p className="text-[10px] text-kong-text-muted mt-0.5">{provider.badge}</p>
      </div>
    </button>
  )
}

function LlmDiagram({ provider, model, controlPlane, routeType }: {
  provider: string; model: string; controlPlane: string; routeType: string
}) {
  const prov = PROVIDERS.find(p => p.id === provider) ?? PROVIDERS[0]
  const displayModel = model || 'model'
  const displayCP = controlPlane || 'ai-gateway-cp'

  return (
    <div className="h-full flex flex-col">
      <p className="text-[12px] font-semibold text-kong-text mb-1">How it works</p>
      <p className="text-[11px] text-kong-text-secondary mb-3 leading-relaxed">
        Kong AI Gateway intercepts requests and proxies them to the selected LLM provider using the <span className="font-mono text-kong-text">ai-proxy</span> plugin.
      </p>
      <div className="flex-1 relative rounded-lg overflow-hidden border border-kong-border" style={{ minHeight: 240 }}>
        <svg viewBox="0 0 520 270" className="w-full h-full" style={{ background: '#0a0e13' }}>
          <defs>
            <pattern id="llm-dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="1" fill="#ffffff" opacity="0.06" />
            </pattern>
            <marker id="llm-arr-gray" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M0,1 L9,5 L0,9 Z" fill="#6b7280" />
            </marker>
            <marker id="llm-arr-amber" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M0,1 L9,5 L0,9 Z" fill="#f59e0b" />
            </marker>
            <marker id="llm-arr-purple" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0,1 L8,4.5 L0,8 Z" fill="#7c3aed" />
            </marker>
          </defs>

          <rect width="520" height="270" fill="url(#llm-dots)" />

          {/* Control plane */}
          <rect x="180" y="10" width="160" height="44" rx="7" fill="#1a1230" stroke="#6d28d9" strokeWidth="1.2" />
          <text x="260" y="27" fontSize="7.5" fill="#a78bfa" textAnchor="middle" fontWeight="700" letterSpacing="0.3">KONG CONTROL PLANE</text>
          <text x="260" y="42" fontSize="10" fill="#c4b5fd" textAnchor="middle" fontWeight="600">{displayCP.length > 22 ? displayCP.slice(0, 21) + '…' : displayCP}</text>

          {/* Config arrow down */}
          <line x1="260" y1="54" x2="260" y2="98" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#llm-arr-purple)" />

          {/* Client */}
          <rect x="10" y="155" width="86" height="60" rx="7" fill="#0f1520" stroke="#1e2a3a" strokeWidth="1.2" />
          <text x="53" y="185" fontSize="10" fill="#e5e7eb" textAnchor="middle" dominantBaseline="middle" fontWeight="700">App /</text>
          <text x="53" y="199" fontSize="10" fill="#e5e7eb" textAnchor="middle" dominantBaseline="middle" fontWeight="700">Agent</text>

          {/* Request arrow */}
          <line x1="96" y1="176" x2="148" y2="176" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#llm-arr-gray)" />
          <line x1="148" y1="198" x2="96" y2="198" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#llm-arr-amber)" />

          {/* Kong AI GW box */}
          <rect x="150" y="100" width="220" height="165" rx="9" fill="#111827" stroke="#1e3a5f" strokeWidth="1.5" />
          <text x="166" y="120" fontSize="9" fill="#60a5fa" fontWeight="700">Kong AI Gateway Data Plane</text>

          {/* Route badge */}
          <rect x="165" y="130" width="90" height="38" rx="5" fill="rgba(245,158,11,0.06)" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.8" />
          <text x="210" y="149" fontSize="9" fill="#fcd34d" textAnchor="middle" dominantBaseline="middle" fontWeight="600">{routeType}</text>

          {/* ai-proxy plugin badge */}
          <rect x="265" y="130" width="90" height="38" rx="5" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" strokeWidth="1.5" />
          <text x="310" y="144" fontSize="9" fill="#fbbf24" textAnchor="middle" dominantBaseline="middle" fontWeight="700">ai-proxy</text>
          <text x="310" y="158" fontSize="8" fill="#fcd34d" textAnchor="middle" dominantBaseline="middle">{prov.label}</text>

          {/* auth / key hint */}
          <rect x="165" y="178" width="190" height="28" rx="5" fill="rgba(255,255,255,0.02)" stroke="#1e2a3a" strokeWidth="1" />
          <text x="260" y="196" fontSize="8" fill="#4b5563" textAnchor="middle" dominantBaseline="middle">API key → {`{vault://ai-credentials/${provider}}`}</text>

          {/* Request to provider */}
          <line x1="370" y1="176" x2="420" y2="176" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#llm-arr-gray)" />
          <line x1="420" y1="198" x2="370" y2="198" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#llm-arr-amber)" />

          {/* LLM Provider box */}
          <rect x="422" y="152" width="88" height="68" rx="7" fill="#1a1230" stroke="#f59e0b" strokeWidth="1.2" />
          <text x="466" y="172" fontSize="9" fill="#fcd34d" textAnchor="middle" fontWeight="700">{prov.label}</text>
          <text x="466" y="186" fontSize="8.5" fill="#f59e0b" textAnchor="middle">{displayModel.length > 12 ? displayModel.slice(0, 11) + '…' : displayModel}</text>
          <text x="466" y="208" fontSize="8" fill="#4b5563" textAnchor="middle">LLM Provider</text>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2.5 px-1">
        <div className="flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          <span className="text-[10px] text-kong-text-muted">Request</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          <span className="text-[10px] text-kong-text-muted">Response</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          <span className="text-[10px] text-kong-text-muted">Config</span>
        </div>
      </div>
    </div>
  )
}

// ─── Step 3 right panel ───────────────────────────────────────────────────────

function PortalPreview({ name, version, description, portalId, authStrategy, visibility }: {
  name: string; version: string; description: string
  portalId: string; authStrategy: string; visibility: 'public' | 'private'
}) {
  const portalLabel = PORTALS.find(p => p.id === portalId)?.label ?? portalId
  return (
    <div className="h-full flex flex-col">
      <p className="text-[12px] font-semibold text-kong-text mb-1">Portal preview</p>
      <p className="text-[11px] text-kong-text-secondary mb-4 leading-relaxed">
        How this API will appear to developers in <span className="text-kong-text">{portalLabel}</span>.
      </p>
      <div className="rounded-lg border border-kong-border bg-[#0a0e13] p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-amber-500/15 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-kong-text">{name || 'Untitled LLM API'}</p>
              <p className="text-[10px] text-kong-text-muted">{version || 'v1'}</p>
            </div>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${
            visibility === 'public' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
          }`}>
            {visibility === 'public' ? 'Public' : 'Private'}
          </span>
        </div>
        {description && (
          <p className="text-[11px] text-kong-text-secondary leading-relaxed line-clamp-3">{description}</p>
        )}
        <div className="flex items-center gap-3 pt-1 border-t border-kong-border">
          <div className="flex items-center gap-1.5">
            <Key size={10} className="text-kong-text-muted" />
            <span className="text-[10px] text-kong-text-muted">{authStrategy}</span>
          </div>
          {visibility === 'private' && (
            <div className="flex items-center gap-1.5">
              <Lock size={10} className="text-kong-text-muted" />
              <span className="text-[10px] text-kong-text-muted">Auth required</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-kong-border bg-white/[0.02] p-3">
        <p className="text-[10px] text-kong-text-muted leading-relaxed">Developers can browse the docs, generate API keys, and request access directly from the portal.</p>
      </div>
    </div>
  )
}

// ─── NativeSelect helper ──────────────────────────────────────────────────────

function NativeSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { id: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-32 flex-shrink-0 text-[12px] font-semibold text-kong-text">{label}</label>
      <div className="relative flex-1">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-1.5 pr-8 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
        >
          {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>
        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kong-text-muted pointer-events-none" />
      </div>
    </div>
  )
}

// ─── Build CatalogInterface ───────────────────────────────────────────────────

function buildInterface(s1: Step1State, gw: GatewayState, portal: PortalState): CatalogInterface {
  const id = `llm-created-${Date.now()}`
  const now = new Date().toISOString().split('T')[0]
  const svcName = (s1.name || 'llm-api').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-svc'
  const routePath = gw.routePath.trim() || '/ai/' + svcName.replace(/-svc$/, '')
  const portalLabel = PORTAL_LABELS[portal.portalId] ?? portal.portalId
  const portalLinked = s1.wantsPortal === 'yes'

  const gatewayLink: CatalogInterface['gatewayLink'] = s1.wantsGateway === 'yes' ? {
    gatewayProductType: 'ai',
    controlPlaneName: gw.controlPlane,
    gatewayInstanceName: gw.controlPlane,
    environment: gw.controlPlane.includes('sandbox') ? 'Development' : 'Production',
    objects: [
      { type: 'Service', name: svcName,                                              id: `svc-${id}` },
      { type: 'Route',   name: `POST ${routePath}`,                                  id: `rt-${id}` },
      { type: 'Plugin',  name: `ai-proxy · ${gw.provider} / ${gw.model}`,            id: `plg-${id}` },
    ],
    navigableTargetId: `gw-${id}`,
  } : undefined

  return {
    id,
    name: s1.name || 'Unnamed LLM API',
    type: 'LLM API',
    origin: s1.wantsGateway === 'yes' ? 'ai-gateway' : 'portal',
    description: s1.description || `${gw.provider} / ${gw.model} via Kong AI Gateway`,
    domain: 'AI & Automation',
    businessCapability: s1.businessCapability || 'AI Agent Integration',
    ownerTeam: 'Donkey Kong',
    lifecycleStatus: 'Proposed',
    environments: [gw.controlPlane.includes('sandbox') ? 'Development' : 'Production'],
    region: '',
    complianceTags: [],
    criticality: 'Standard',
    dataClassification: 'Internal',
    authPattern: portal.authStrategy !== 'disabled' ? portal.authStrategy : 'None',
    version: s1.version || 'v1',
    specType: 'Unknown',
    llmProvider: gw.provider,
    gatewayLink,
    associatedApps: {
      observability: { linked: false },
      portal: portalLinked ? {
        linked: true,
        summary: `Published to ${portalLabel}`,
        linkedObjectsCount: 1,
        publications: [{
          portalName: portalLabel,
          portalId: portal.portalId,
          audience: 'External',
          visibility: portal.visibility === 'public' ? 'Public' : 'Private',
          status: 'Published',
        }],
      } : { linked: false },
      meteringBilling: { linked: false },
      contextMesh: { linked: false },
    },
    dependencies: [],
    consumers: [],
    tags: [],
    updatedAt: now,
    createdAt: now,
  }
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  launchMode?: 'portal-first'
  initialPortalId?: string
}

export function NewLlmApiWizard({ onClose, launchMode, initialPortalId }: Props) {
  const { addInterface } = useMode()
  const isPortalFirst = launchMode === 'portal-first'

  const [step, setStep] = useState(1)
  const [s1, setS1] = useState<Step1State>({
    name: '', version: '', description: '', businessCapability: '',
    wantsGateway: isPortalFirst ? 'no' : null,
    wantsPortal: isPortalFirst ? 'yes' : null,
  })
  const [gw, setGw] = useState<GatewayState>({
    provider: 'openai', model: 'gpt-4o', routeType: 'llm/v1/chat', routePath: '', controlPlane: 'meridian-ai-prod',
  })
  const [portal, setPortal] = useState<PortalState>({
    portalId: initialPortalId ?? 'meridian-dev-hub',
    authStrategy: 'key-auth',
    visibility: 'public',
  })

  const setS = (patch: Partial<Step1State>) => setS1(prev => ({ ...prev, ...patch }))
  const setG = (patch: Partial<GatewayState>) => setGw(prev => ({ ...prev, ...patch }))
  const setP = (patch: Partial<PortalState>) => setPortal(prev => ({ ...prev, ...patch }))

  const step1Valid = s1.name.trim() !== '' && s1.wantsGateway !== null && s1.wantsPortal !== null

  const save = () => {
    addInterface(buildInterface(s1, gw, portal))
    onClose()
  }

  const handleNext = () => {
    if (step === 1) {
      if (s1.wantsGateway === 'yes') setStep(2)
      else if (s1.wantsPortal === 'yes') setStep(3)
      else { save(); return }
    } else if (step === 2) {
      if (s1.wantsPortal === 'yes') setStep(3)
      else { save(); return }
    } else {
      save(); return
    }
  }

  const goBack = () => {
    if (step === 3) setStep(s1.wantsGateway === 'yes' ? 2 : 1)
    else if (step === 2) setStep(1)
  }

  const preFill = () => {
    setS({ name: 'Document Summarization LLM API', version: 'v1', description: 'Summarizes internal documents including policy memos, regulatory filings, and audit findings. Powered by GPT-4o with enterprise guardrails.', businessCapability: 'AI Enablement', wantsGateway: 'yes', wantsPortal: 'yes' })
    setG({ provider: 'openai', model: 'gpt-4o', routeType: 'llm/v1/chat', routePath: '/ai/summarize', controlPlane: 'meridian-ai-prod' })
  }

  const totalSteps = [s1.wantsGateway === 'yes', s1.wantsPortal === 'yes'].filter(Boolean).length + 1
  const stepIndex = step === 1 ? 1 : step === 2 ? (s1.wantsGateway === 'yes' ? 2 : 2) : totalSteps
  const stepLabel = `Step ${stepIndex} of ${totalSteps}`

  const stepSubtitle = step === 1
    ? isPortalFirst
      ? 'Describe your LLM API and we\'ll publish it to the portal automatically.'
      : 'Tell us about your LLM API so we can tailor the setup to your needs.'
    : step === 2
    ? 'Choose the LLM provider and model Kong AI Gateway will proxy requests to.'
    : 'Choose where to publish and how developers will access this LLM API.'

  const isLastStep = (step === 1 && s1.wantsGateway !== 'yes' && s1.wantsPortal !== 'yes') ||
    (step === 2 && s1.wantsPortal !== 'yes') ||
    step === 3

  const nextLabel = isLastStep ? 'Create LLM API' : 'Next →'
  const nextEnabled = step === 1 ? step1Valid : true

  const selectedProvider = PROVIDERS.find(p => p.id === gw.provider) ?? PROVIDERS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0f1318] border border-kong-border rounded-xl shadow-2xl flex flex-col h-[680px] max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-kong-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-semibold text-kong-text">
                {isPortalFirst ? 'Publish LLM API to Portal' : 'New LLM API'}
              </h2>
              <span className="text-[10px] text-kong-text-muted border border-kong-border rounded px-1.5 py-0.5">{stepLabel}</span>
            </div>
            <p className="text-[12px] text-kong-text-secondary mt-1">{stepSubtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-kong-text-muted hover:text-kong-text hover:bg-white/[0.05] transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* ── Step 1: Identity + intent ── */}
          {step === 1 && (
            <>
              <div className="flex-1 overflow-y-auto px-6 pt-5 min-w-0">
                {/* Pre-fill banner */}
                {!isPortalFirst && (
                  <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-kong-teal/20 bg-kong-teal/5">
                    <div>
                      <p className="text-[12px] font-semibold text-kong-text">Want a quick start?</p>
                      <p className="text-[11px] text-kong-text-muted mt-0.5">Pre-fills with a sample Document Summarization API (OpenAI / GPT-4o).</p>
                    </div>
                    <button
                      type="button"
                      onClick={preFill}
                      className="flex-shrink-0 px-3 py-1.5 rounded-md bg-kong-teal/15 text-kong-teal text-[12px] font-semibold hover:bg-kong-teal/25 transition-colors whitespace-nowrap"
                    >
                      Pre-fill for me
                    </button>
                  </div>
                )}

                {/* API Identity */}
                <div className="space-y-3 py-5 border-b border-kong-border">
                  <div className="flex items-center gap-3">
                    <div className="w-24 flex-shrink-0">
                      <label className="text-[12px] font-semibold text-kong-text">Name</label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Document Summarization LLM API"
                      value={s1.name}
                      onChange={e => setS({ name: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 flex-shrink-0">
                      <label className="text-[12px] font-semibold text-kong-text">Version</label>
                    </div>
                    <input
                      type="text"
                      placeholder="v1"
                      value={s1.version}
                      onChange={e => setS({ version: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 flex-shrink-0 pt-1.5">
                      <label className="text-[12px] font-semibold text-kong-text">Description</label>
                    </div>
                    <textarea
                      placeholder="What does this LLM API do?"
                      value={s1.description}
                      onChange={e => setS({ description: e.target.value })}
                      rows={2}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors resize-none"
                    />
                  </div>
                </div>

                <Question
                  title="Do you want Kong AI Gateway to proxy this LLM?"
                  description="Kong AI Gateway sits in front of the LLM provider and handles auth, rate limiting, prompt guardrails, and observability. You'll pick the provider and model in the next step."
                  value={s1.wantsGateway}
                  onChange={v => setS({ wantsGateway: v })}
                />
                <Question
                  title="Do you want to publish this API to a Developer Portal?"
                  description="A portal lets teams discover and access your LLM API, read its documentation, and request credentials. Access control and visibility are configured in the publishing step."
                  value={s1.wantsPortal}
                  onChange={v => setS({ wantsPortal: v })}
                />
              </div>
              <div className="w-px bg-kong-border flex-shrink-0" />
              <div className="w-64 flex-shrink-0 p-5 overflow-y-auto">
                <SetupSummary state={s1} />
              </div>
            </>
          )}

          {/* ── Step 2: AI Gateway config ── */}
          {step === 2 && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-5 min-w-0 space-y-6">
                {/* Provider cards */}
                <div>
                  <p className="text-[12px] font-semibold text-kong-text mb-1">LLM Provider</p>
                  <p className="text-[11px] text-kong-text-muted mb-3">Select the provider Kong AI Gateway will route requests to.</p>
                  <div className="grid grid-cols-4 gap-3">
                    {PROVIDERS.map(p => (
                      <ProviderCard
                        key={p.id}
                        provider={p}
                        selected={gw.provider === p.id}
                        onClick={() => setG({ provider: p.id, model: p.models[0] })}
                      />
                    ))}
                  </div>
                </div>

                <div className="border-t border-kong-border" />

                {/* Model selection */}
                <div>
                  <p className="text-[12px] font-semibold text-kong-text mb-1">Model</p>
                  <p className="text-[11px] text-kong-text-muted mb-3">Supported models for <span className={`font-medium ${selectedProvider.text}`}>{selectedProvider.label}</span>.</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProvider.models.map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setG({ model: m })}
                        className={`px-3 py-1.5 rounded border text-[12px] font-mono font-medium transition-colors ${
                          gw.model === m
                            ? `${selectedProvider.activeBorder} ${selectedProvider.activeBg} ${selectedProvider.text}`
                            : 'border-kong-border text-kong-text-secondary hover:border-kong-border-subtle hover:text-kong-text bg-white/[0.02]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-kong-border" />

                {/* Route config */}
                <div className="space-y-3">
                  <p className="text-[12px] font-semibold text-kong-text mb-1">Gateway Configuration</p>

                  {/* Route type visual selector */}
                  <div className="space-y-2">
                    <label className="text-[12px] text-kong-text-secondary">Route type</label>
                    <div className="space-y-1.5">
                      {ROUTE_TYPES.map(rt => (
                        <button
                          key={rt.id}
                          type="button"
                          onClick={() => setG({ routeType: rt.id })}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded border text-left transition-colors ${
                            gw.routeType === rt.id
                              ? 'border-kong-teal/40 bg-kong-teal/5 text-kong-text'
                              : 'border-kong-border bg-white/[0.01] text-kong-text-secondary hover:bg-white/[0.03]'
                          }`}
                        >
                          <div>
                            <span className={`text-[12px] font-mono font-semibold ${gw.routeType === rt.id ? 'text-kong-teal' : ''}`}>{rt.id}</span>
                            <span className="text-[11px] text-kong-text-muted ml-3">{rt.desc}</span>
                          </div>
                          {gw.routeType === rt.id && (
                            <span className="w-2 h-2 rounded-full bg-kong-teal flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Route path + Control plane */}
                  <div className="flex items-center gap-3">
                    <label className="w-32 flex-shrink-0 text-[12px] font-semibold text-kong-text">Route path</label>
                    <input
                      type="text"
                      placeholder="/ai/summarize"
                      value={gw.routePath}
                      onChange={e => setG({ routePath: e.target.value })}
                      onBlur={e => {
                        if (!e.target.value.trim()) {
                          const slug = s1.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').replace(/-llm-api$/, '')
                          setG({ routePath: '/ai/' + (slug || 'llm') })
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted font-mono focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
                    />
                  </div>

                  <NativeSelect
                    label="Control Plane"
                    value={gw.controlPlane}
                    onChange={v => setG({ controlPlane: v })}
                    options={AI_CONTROL_PLANES.map(cp => ({ id: cp.id, label: `${cp.label} (${cp.env})` }))}
                  />
                </div>
              </div>
              <div className="w-px bg-kong-border flex-shrink-0" />
              <div className="w-[280px] flex-shrink-0 p-5 overflow-y-auto">
                <LlmDiagram
                  provider={gw.provider}
                  model={gw.model}
                  controlPlane={gw.controlPlane}
                  routeType={gw.routeType}
                />
              </div>
            </>
          )}

          {/* ── Step 3: Portal ── */}
          {step === 3 && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-5 min-w-0 space-y-5">
                <div>
                  <p className="text-[13px] font-semibold text-kong-text mb-1">Developer Portal</p>
                  <p className="text-[12px] text-kong-text-secondary mb-4">Choose where to publish and how developers will access this LLM API.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-[12px] font-semibold text-kong-text block mb-2">Portal</label>
                      <div className="space-y-1.5">
                        {PORTALS.map(p => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setP({ portalId: p.id })}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded border text-left transition-colors ${
                              portal.portalId === p.id
                                ? 'border-kong-teal/40 bg-kong-teal/5 text-kong-text'
                                : 'border-kong-border bg-white/[0.01] text-kong-text-secondary hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Globe size={13} className={portal.portalId === p.id ? 'text-kong-teal' : 'text-kong-text-muted'} />
                              <span className="text-[13px] font-medium">{p.label}</span>
                            </div>
                            {portal.portalId === p.id && (
                              <span className="w-2 h-2 rounded-full bg-kong-teal flex-shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[12px] font-semibold text-kong-text block mb-2">Authentication</label>
                        <div className="space-y-1.5">
                          {AUTH_STRATEGIES.map(a => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => setP({ authStrategy: a.id })}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-left transition-colors ${
                                portal.authStrategy === a.id
                                  ? 'border-kong-teal/40 bg-kong-teal/5 text-kong-text'
                                  : 'border-kong-border bg-white/[0.01] text-kong-text-secondary hover:bg-white/[0.03]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Key size={12} className={portal.authStrategy === a.id ? 'text-kong-teal' : 'text-kong-text-muted'} />
                                <span className="text-[12px] font-mono">{a.label}</span>
                              </div>
                              {portal.authStrategy === a.id && <span className="w-2 h-2 rounded-full bg-kong-teal" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[12px] font-semibold text-kong-text block mb-2">Visibility</label>
                        <div className="space-y-1.5">
                          {(['public', 'private'] as const).map(v => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => setP({ visibility: v })}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded border text-left capitalize transition-colors ${
                                portal.visibility === v
                                  ? 'border-kong-teal/40 bg-kong-teal/5 text-kong-text'
                                  : 'border-kong-border bg-white/[0.01] text-kong-text-secondary hover:bg-white/[0.03]'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {v === 'private' ? <Lock size={12} className={portal.visibility === v ? 'text-kong-teal' : 'text-kong-text-muted'} /> : <Globe size={12} className={portal.visibility === v ? 'text-kong-teal' : 'text-kong-text-muted'} />}
                                <span className="text-[12px]">{v}</span>
                              </div>
                              {portal.visibility === v && <span className="w-2 h-2 rounded-full bg-kong-teal" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-px bg-kong-border flex-shrink-0" />
              <div className="w-64 flex-shrink-0 p-5 overflow-y-auto">
                <PortalPreview
                  name={s1.name}
                  version={s1.version}
                  description={s1.description}
                  portalId={portal.portalId}
                  authStrategy={portal.authStrategy}
                  visibility={portal.visibility}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-kong-border flex-shrink-0">
          <button
            onClick={step === 1 ? onClose : goBack}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] text-kong-text-secondary hover:text-kong-text transition-colors rounded-md hover:bg-white/[0.04]"
          >
            {step === 1 ? 'Cancel' : <><span>←</span> Back</>}
          </button>
          <button
            onClick={handleNext}
            disabled={!nextEnabled}
            className={`px-5 py-2 text-[13px] font-semibold rounded-md transition-all ${
              !nextEnabled
                ? 'bg-kong-cta/30 text-[#0d1117]/50 cursor-not-allowed'
                : 'bg-kong-cta text-[#0d1117] hover:brightness-110'
            }`}
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

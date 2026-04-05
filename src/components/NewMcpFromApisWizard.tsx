import { useState, useRef, useEffect } from 'react'
import { X, Plus, Trash2, ChevronDown, BookOpen, Cpu, Waypoints, ArrowRight } from 'lucide-react'
import { useMode, useInterfaces } from '../contexts/ModeContext'
import type { CatalogInterface } from '../types'

// ─── Static options ────────────────────────────────────────────────────────────

const AI_CONTROL_PLANES = [
  { id: 'meridian-ai-prod',    label: 'meridian-ai-prod' },
  { id: 'meridian-ai-sandbox', label: 'meridian-ai-sandbox' },
]

const MCP_REGISTRIES = [
  { id: 'meridian-internal-registry', label: 'Meridian Internal MCP Registry' },
  { id: 'meridian-external-registry', label: 'Meridian External MCP Registry' },
]

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

// ─── Types ─────────────────────────────────────────────────────────────────────

type SourceType = 'catalog' | 'external'

interface EndpointSource {
  id: string
  type: SourceType
  // catalog
  interfaceId?: string
  endpointPath?: string
  // external
  method?: string
  url?: string
}

interface BuildTool {
  id: string
  name: string
  description: string
  sources: EndpointSource[]
}

function uid() { return Math.random().toString(36).slice(2, 9) }

function emptyTool(): BuildTool {
  return { id: uid(), name: '', description: '', sources: [{ id: uid(), type: 'catalog', interfaceId: '', endpointPath: '' }] }
}

// ─── Sample pre-fill data ──────────────────────────────────────────────────────

const SAMPLE_NAME = 'Customer 360 MCP Server'
const SAMPLE_DESC = 'Exposes unified customer data as MCP tools composed from core banking APIs. Enables AI agents to query account balances, transaction history, card status, and customer profile in a single interface.'

function buildSampleTools(restApis: CatalogInterface[]): BuildTool[] {
  const find = (id: string) => restApis.find(i => i.id === id)
  const api = (id: string, path: string): EndpointSource => ({
    id: uid(), type: 'catalog',
    interfaceId: find(id)?.id ?? restApis[0]?.id ?? '',
    endpointPath: path,
  })
  return [
    { id: uid(), name: 'get_account_balance',   description: 'Retrieve the current balance for a customer account.',          sources: [api('rest-001', '/api/v3/accounts/*/balance')] },
    { id: uid(), name: 'get_payment_history',   description: 'List recent payment transactions for an account.',              sources: [api('rest-002', '/api/v2/payments')] },
    { id: uid(), name: 'get_card_status',       description: 'Return the status and limits of a customer card.',              sources: [api('rest-003', '/api/v4/cards/*')] },
    { id: uid(), name: 'get_customer_profile',  description: 'Fetch full customer profile including KYC and contact info.',   sources: [api('rest-004', '/api/v5/customers/*')] },
  ]
}

// ─── Build CatalogInterface ────────────────────────────────────────────────────

function buildInterface(
  name: string,
  description: string,
  tools: BuildTool[],
  cpName: string,
  routePath: string,
  allInterfaces: CatalogInterface[],
  registryId?: string,
): CatalogInterface {
  const id = `cm-mcp-${Date.now()}`
  const now = new Date().toISOString().split('T')[0]
  const svcName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-svc'
  const resolvedPath = routePath.trim() || '/mcp/' + svcName.replace(/-svc$/, '')

  // Unique catalog interfaces referenced
  const usedInterfaceIds = new Set(
    tools.flatMap(t => t.sources.filter(s => s.type === 'catalog' && s.interfaceId).map(s => s.interfaceId!))
  )
  const dependencies: CatalogInterface['dependencies'] = []
  for (const ifaceId of usedInterfaceIds) {
    const src = allInterfaces.find(i => i.id === ifaceId)
    if (src) {
      const toolsForThis = tools.filter(t => t.sources.some(s => s.interfaceId === ifaceId))
      dependencies.push({
        interfaceId: src.id,
        interfaceName: src.name,
        type: src.type,
        relationship: 'composes-from',
        detail: toolsForThis.map(t => t.name).join(', '),
      })
    }
  }

  const specSnippet = JSON.stringify({
    name,
    version: '1.0.0',
    tools: tools.filter(t => t.name.trim()).map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: { type: 'object', properties: {} },
    })),
  }, null, 2)

  return {
    id,
    name,
    type: 'MCP',
    origin: 'context-mesh',
    description,
    domain: 'AI & Automation',
    businessCapability: 'AI Agent Integration',
    ownerTeam: 'Donkey Kong',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: '',
    complianceTags: [],
    criticality: 'Standard',
    dataClassification: 'Internal',
    authPattern: 'None',
    version: '1.0.0',
    specType: 'MCP',
    specSnippet,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: cpName,
      gatewayInstanceName: cpName,
      environment: 'Production',
      objects: [
        { type: 'Service', name: svcName, id: `svc-${id}` },
        { type: 'Route',   name: `POST ${resolvedPath}`, id: `rt-${id}` },
        { type: 'Plugin',  name: 'ai-mcp-proxy · conversion-listener', id: `plg-${id}` },
      ],
      navigableTargetId: `gw-${id}`,
    },
    associatedApps: {
      observability: { linked: false },
      portal:        { linked: false },
      meteringBilling: { linked: false },
      contextMesh: registryId ? {
        linked: true,
        registries: [{
          registryId,
          registryName: MCP_REGISTRIES.find(r => r.id === registryId)?.label ?? registryId,
          toolsExposed: tools.filter(t => t.name.trim()).length,
          agents: [],
        }],
        details: { toolsExposed: tools.filter(t => t.name.trim()).length },
      } : { linked: false },
    },
    dependencies,
    consumers: [],
    tags: [],
    updatedAt: now,
    createdAt: now,
  }
}

// ─── Shared sub-components ─────────────────────────────────────────────────────

function SourceTypeToggle({ value, onChange }: { value: SourceType; onChange: (v: SourceType) => void }) {
  return (
    <div className="flex rounded overflow-hidden border border-kong-border text-[11px] font-medium flex-shrink-0">
      {(['catalog', 'external'] as SourceType[]).map((t, i) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`px-2.5 py-1 transition-colors capitalize ${i > 0 ? 'border-l border-kong-border' : ''} ${
            value === t ? 'bg-kong-teal/15 text-kong-teal' : 'text-kong-text-muted hover:text-kong-text-secondary'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  )
}

function CatalogInterfaceSelect({ value, onChange, restApis }: {
  value: string; onChange: (v: string) => void; restApis: CatalogInterface[]
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const selected = restApis.find(i => i.id === value)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const filtered = restApis.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="relative flex-1 min-w-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded border border-kong-border bg-kong-surface text-[12px] text-left focus:outline-none hover:border-kong-border-subtle transition-colors"
      >
        <span className={selected ? 'text-kong-text truncate' : 'text-kong-text-muted'}>
          {selected?.name ?? 'Select API…'}
        </span>
        <ChevronDown size={11} className="text-kong-text-muted flex-shrink-0 ml-1" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[#0f1318] border border-kong-border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-kong-border">
            <input
              autoFocus
              type="text"
              placeholder="Search APIs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-kong-border bg-kong-surface text-[12px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50"
            />
          </div>
          <div className="max-h-44 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2.5 text-[11px] text-kong-text-muted">No results</p>
            )}
            {filtered.map(i => (
              <button
                key={i.id}
                type="button"
                onClick={() => { onChange(i.id); setOpen(false); setSearch('') }}
                className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${
                  value === i.id ? 'bg-kong-teal/10 text-kong-teal' : 'text-kong-text hover:bg-white/[0.04]'
                }`}
              >
                {i.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Endpoint source row ───────────────────────────────────────────────────────

function EndpointRow({ source, onChange, onRemove, restApis, canRemove }: {
  source: EndpointSource
  onChange: (patch: Partial<EndpointSource>) => void
  onRemove: () => void
  restApis: CatalogInterface[]
  canRemove: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <SourceTypeToggle value={source.type} onChange={type => onChange({ type, interfaceId: '', endpointPath: '', method: 'GET', url: '' })} />

      {source.type === 'catalog' ? (
        <>
          <CatalogInterfaceSelect value={source.interfaceId ?? ''} onChange={interfaceId => onChange({ interfaceId })} restApis={restApis} />
          <input
            type="text"
            placeholder="endpoint path (optional)"
            value={source.endpointPath ?? ''}
            onChange={e => onChange({ endpointPath: e.target.value })}
            className="w-44 flex-shrink-0 px-2.5 py-1.5 rounded border border-kong-border bg-kong-surface text-[12px] text-kong-text placeholder:text-kong-text-muted font-mono focus:outline-none focus:border-kong-teal/50"
          />
        </>
      ) : (
        <>
          <div className="relative flex-shrink-0">
            <select
              value={source.method ?? 'GET'}
              onChange={e => onChange({ method: e.target.value })}
              className="appearance-none pl-2.5 pr-6 py-1.5 rounded border border-kong-border bg-kong-surface text-[12px] text-kong-text focus:outline-none focus:border-kong-teal/50 font-mono"
            >
              {HTTP_METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
            <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-kong-text-muted pointer-events-none" />
          </div>
          <input
            type="text"
            placeholder="https://api.example.com/endpoint"
            value={source.url ?? ''}
            onChange={e => onChange({ url: e.target.value })}
            onBlur={e => { if (!e.target.value.trim()) onChange({ url: 'https://api.example.com/endpoint' }) }}
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded border border-kong-border bg-kong-surface text-[12px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50"
          />
        </>
      )}

      <button
        type="button"
        onClick={onRemove}
        disabled={!canRemove}
        className="p-1.5 rounded text-kong-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
      >
        <Trash2 size={11} />
      </button>
    </div>
  )
}

// ─── Tool card ─────────────────────────────────────────────────────────────────

function ToolCard({ tool, onChange, onRemove, restApis, canRemove }: {
  tool: BuildTool
  onChange: (patch: Partial<BuildTool>) => void
  onRemove: () => void
  restApis: CatalogInterface[]
  canRemove: boolean
}) {
  const addSource = () => onChange({
    sources: [...tool.sources, { id: uid(), type: 'catalog', interfaceId: '', endpointPath: '' }]
  })
  const updateSource = (i: number, patch: Partial<EndpointSource>) =>
    onChange({ sources: tool.sources.map((s, idx) => idx === i ? { ...s, ...patch } : s) })
  const removeSource = (i: number) =>
    onChange({ sources: tool.sources.filter((_, idx) => idx !== i) })

  return (
    <div className="bg-white/[0.02] rounded-lg border border-kong-border p-4 space-y-3">
      {/* Tool name + description + delete */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="tool_name"
          value={tool.name}
          onChange={e => onChange({ name: e.target.value })}
          onBlur={e => { if (!e.target.value.trim()) onChange({ name: 'tool_name' }) }}
          className="w-44 flex-shrink-0 px-2.5 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted font-mono focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
        />
        <input
          type="text"
          placeholder="Short description"
          value={tool.description}
          onChange={e => onChange({ description: e.target.value })}
          onBlur={e => { if (!e.target.value.trim()) onChange({ description: 'Short description' }) }}
          className="flex-1 px-2.5 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="p-1.5 rounded text-kong-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0 disabled:opacity-20 disabled:cursor-not-allowed"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Endpoint sources */}
      <div className="space-y-2 pl-1">
        <p className="text-[10px] font-semibold text-kong-text-muted uppercase tracking-wide">Maps to</p>
        {tool.sources.map((s, i) => (
          <EndpointRow
            key={s.id}
            source={s}
            onChange={patch => updateSource(i, patch)}
            onRemove={() => removeSource(i)}
            restApis={restApis}
            canRemove={tool.sources.length > 1}
          />
        ))}
        <button
          type="button"
          onClick={addSource}
          className="flex items-center gap-1 text-[11px] text-kong-text-muted hover:text-kong-teal transition-colors"
        >
          <Plus size={11} /> Add endpoint
        </button>
      </div>
    </div>
  )
}

// ─── Step 1 right panel ────────────────────────────────────────────────────────

function CompositionSummary({ tools, allInterfaces }: { tools: BuildTool[]; allInterfaces: CatalogInterface[] }) {
  const usedIds = new Set(tools.flatMap(t => t.sources.filter(s => s.type === 'catalog' && s.interfaceId).map(s => s.interfaceId!)))
  const usedApis = [...usedIds].map(id => allInterfaces.find(i => i.id === id)).filter(Boolean) as CatalogInterface[]
  const toolCount = tools.filter(t => t.name.trim()).length
  return (
    <div className="h-full flex flex-col">
      <p className="text-[12px] font-semibold text-kong-text mb-1">What gets built</p>
      <p className="text-[11px] text-kong-text-secondary mb-4 leading-relaxed">Kong AI Gateway converts your REST API endpoints into MCP tools and hosts the server.</p>
      <div className="space-y-3">
        {[
          { icon: BookOpen, label: 'Catalog entry', sub: 'MCP server registered in catalog', active: true, color: 'text-kong-teal' },
          { icon: Cpu, label: 'AI Gateway deployment', sub: 'ai-mcp-proxy · conversion-listener', active: true, color: 'text-amber-400' },
          { icon: Waypoints, label: 'Source APIs', sub: usedApis.length > 0 ? `${usedApis.length} API${usedApis.length !== 1 ? 's' : ''} selected` : 'Configure in step 2', active: usedApis.length > 0, color: 'text-blue-400' },
        ].map(({ icon: Icon, label, sub, active, color }) => (
          <div key={label} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${active ? 'border-kong-border bg-white/[0.03]' : 'border-kong-border-subtle opacity-40'}`}>
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
      {toolCount > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-kong-border">
          <p className="text-[11px] text-kong-text-secondary font-semibold mb-2">{toolCount} tool{toolCount !== 1 ? 's' : ''} defined</p>
          <div className="space-y-1">
            {tools.filter(t => t.name.trim()).map(t => (
              <p key={t.id} className="text-[10px] text-kong-text-muted font-mono truncate">{t.name}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 3 right panel ────────────────────────────────────────────────────────

function DeploySummary({ name, tools, cpName, routePath, allInterfaces, registryId }: {
  name: string; tools: BuildTool[]; cpName: string; routePath: string; allInterfaces: CatalogInterface[]; registryId?: string
}) {
  const usedIds = new Set(tools.flatMap(t => t.sources.filter(s => s.type === 'catalog' && s.interfaceId).map(s => s.interfaceId!)))
  const usedApis = [...usedIds].map(id => allInterfaces.find(i => i.id === id)).filter(Boolean) as CatalogInterface[]
  const validTools = tools.filter(t => t.name.trim())
  const svcName = (name || 'mcp-server').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-svc'
  const resolvedPath = routePath.trim() || '/mcp/' + svcName.replace(/-svc$/, '')

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <p className="text-[12px] font-semibold text-kong-text mb-3">Deploy summary</p>
        <div className="space-y-2">
          {[
            { label: 'Server name', value: name || '—' },
            { label: 'Control plane', value: cpName },
            { label: 'Endpoint', value: `POST ${resolvedPath}` },
            { label: 'Plugin', value: 'ai-mcp-proxy' },
            { label: 'Mode', value: 'conversion-listener' },
            { label: 'Tools', value: String(validTools.length) },
          ...(registryId ? [{ label: 'Registry', value: MCP_REGISTRIES.find(r => r.id === registryId)?.label ?? registryId }] : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-2">
              <span className="text-[11px] text-kong-text-muted flex-shrink-0">{label}</span>
              <span className="text-[11px] text-kong-text font-medium text-right truncate font-mono">{value}</span>
            </div>
          ))}
        </div>
      </div>
      {usedApis.length > 0 && (
        <div className="p-3 rounded-lg bg-white/[0.02] border border-kong-border">
          <p className="text-[11px] text-kong-text-secondary font-semibold mb-2">Source APIs</p>
          <div className="space-y-1.5">
            {usedApis.map(api => (
              <div key={api.id} className="flex items-center gap-1.5">
                <ArrowRight size={10} className="text-kong-text-muted flex-shrink-0" />
                <span className="text-[10px] text-kong-text-muted truncate">{api.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mt-auto p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
        <p className="text-[11px] text-amber-400/80 leading-relaxed">Kong AI Gateway will generate MCP tool handlers from your REST API endpoints and host the MCP server at the configured route.</p>
      </div>
    </div>
  )
}

// ─── Main wizard ───────────────────────────────────────────────────────────────

export function NewMcpFromApisWizard({ onClose }: { onClose: () => void }) {
  const { addInterface } = useMode()
  const allInterfaces = useInterfaces()
  const restApis = allInterfaces.filter(i => i.type === 'REST API')

  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tools, setTools] = useState<BuildTool[]>([emptyTool()])
  const [cpName, setCpName] = useState('meridian-ai-prod')
  const [routePath, setRoutePath] = useState('')
  const [registerInRegistry, setRegisterInRegistry] = useState(false)
  const [selectedRegistryId, setSelectedRegistryId] = useState(MCP_REGISTRIES[0].id)

  const step1Valid = name.trim() !== ''
  const step2Valid = tools.some(t => t.name.trim())

  const preFill = () => {
    setName(SAMPLE_NAME)
    setDescription(SAMPLE_DESC)
    setTools(buildSampleTools(restApis))
  }

  const updateTool = (i: number, patch: Partial<BuildTool>) =>
    setTools(prev => prev.map((t, idx) => idx === i ? { ...t, ...patch } : t))
  const addTool = () => setTools(prev => [...prev, emptyTool()])
  const removeTool = (i: number) => setTools(prev => prev.filter((_, idx) => idx !== i))

  const handleNext = () => {
    if (step === 1) setStep(2)
    else if (step === 2) setStep(3)
    else {
      addInterface(buildInterface(name.trim(), description.trim(), tools, cpName, routePath.trim(), allInterfaces, registerInRegistry ? selectedRegistryId : undefined))
      onClose()
    }
  }

  const goBack = () => setStep(s => s - 1)

  const totalSteps = 3
  const stepLabel = `Step ${step} of ${totalSteps}`
  const nextLabel = step === 3 ? 'Deploy' : 'Next →'
  const nextEnabled = step === 1 ? step1Valid : step === 2 ? step2Valid : true

  const stepSubtitle = step === 1
    ? 'Define the new MCP server that Kong will build and host for you.'
    : step === 2
    ? 'Define the tools this server exposes and map each to one or more API endpoints.'
    : 'Choose the AI Gateway control plane where this MCP server will be deployed and proxied.'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0f1318] border border-kong-border rounded-xl shadow-2xl flex flex-col h-[700px] max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-kong-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-semibold text-kong-text">Build MCP Server from APIs</h2>
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

          {/* ── Step 1: Identity ── */}
          {step === 1 && (
            <>
              <div className="flex-1 overflow-y-auto px-6 pt-5 min-w-0">
                {/* Pre-fill banner */}
                <div className="mb-5 flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-kong-teal/20 bg-kong-teal/5">
                  <div>
                    <p className="text-[12px] font-semibold text-kong-text">Want a quick start?</p>
                    <p className="text-[11px] text-kong-text-muted mt-0.5">Loads a sample Customer 360 server with four tools pre-mapped to banking APIs.</p>
                  </div>
                  <button
                    type="button"
                    onClick={preFill}
                    className="flex-shrink-0 px-3 py-1.5 rounded-md bg-kong-teal/15 text-kong-teal text-[12px] font-semibold hover:bg-kong-teal/25 transition-colors whitespace-nowrap"
                  >
                    Pre-fill for me
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <label className="w-28 flex-shrink-0 text-[12px] font-semibold text-kong-text">Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Customer 360 MCP Server"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onBlur={e => { if (!e.target.value.trim()) setName('Customer 360 MCP Server') }}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <label className="w-28 flex-shrink-0 text-[12px] font-semibold text-kong-text pt-1.5">Description</label>
                    <textarea
                      placeholder="What does this MCP server do?"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      onBlur={e => { if (!e.target.value.trim()) setDescription('Exposes unified customer data as MCP tools composed from core banking APIs.') }}
                      rows={3}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 resize-none"
                    />
                  </div>
                </div>
              </div>
              <div className="w-[260px] flex-shrink-0 border-l border-kong-border px-5 py-5 overflow-y-auto">
                <CompositionSummary tools={tools} allInterfaces={allInterfaces} />
              </div>
            </>
          )}

          {/* ── Step 2: Tools ── */}
          {step === 2 && (
            <div className="flex-1 overflow-y-auto px-6 pt-5 min-w-0 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[13px] font-semibold text-kong-text">Tools</p>
                <button
                  type="button"
                  onClick={addTool}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium border border-kong-border text-kong-text-secondary hover:text-kong-text hover:border-kong-border-subtle transition-colors"
                >
                  <Plus size={11} /> Add tool
                </button>
              </div>
              <p className="text-[11px] text-kong-text-secondary -mt-1 mb-3">
                Each tool becomes an MCP-callable function. Map it to one or more API endpoints — from your Catalog or an external URL.
              </p>
              {tools.map((tool, i) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onChange={patch => updateTool(i, patch)}
                  onRemove={() => removeTool(i)}
                  restApis={restApis}
                  canRemove={tools.length > 1}
                />
              ))}
            </div>
          )}

          {/* ── Step 3: Deploy ── */}
          {step === 3 && (
            <>
              <div className="flex-1 overflow-y-auto px-6 pt-5 min-w-0 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <label className="w-32 flex-shrink-0 text-[12px] font-semibold text-kong-text">Control Plane</label>
                    <div className="relative flex-1">
                      <select
                        value={cpName}
                        onChange={e => setCpName(e.target.value)}
                        className="w-full appearance-none px-3 py-1.5 pr-8 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
                      >
                        {AI_CONTROL_PLANES.map(cp => <option key={cp.id} value={cp.id}>{cp.label}</option>)}
                      </select>
                      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kong-text-muted pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="w-32 flex-shrink-0 text-[12px] font-semibold text-kong-text">Route path</label>
                    <input
                      type="text"
                      placeholder="/mcp/customer-360"
                      value={routePath}
                      onChange={e => setRoutePath(e.target.value)}
                      onBlur={e => {
                        if (!e.target.value.trim()) {
                          const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').replace(/-svc$/, '')
                          setRoutePath('/mcp/' + (slug || 'server'))
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 font-mono"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-kong-border bg-white/[0.02] p-3">
                  <p className="text-[11px] text-kong-text-muted leading-relaxed">
                    Kong AI Gateway will deploy an <span className="text-kong-text font-mono">ai-mcp-proxy</span> plugin in <span className="text-kong-text">conversion-listener</span> mode, generating MCP tool handlers from your mapped REST API endpoints. The MCP server will be accessible at the configured route path.
                  </p>
                </div>

                {/* Registry registration */}
                <div className="border-t border-kong-border pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[13px] font-semibold text-kong-text">Register in Context Mesh</p>
                      <p className="text-[11px] text-kong-text-muted mt-0.5">Make this MCP server discoverable to AI agents via a registry.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRegisterInRegistry(v => !v)}
                      className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${registerInRegistry ? 'bg-purple-500' : 'bg-white/[0.12]'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${registerInRegistry ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  {registerInRegistry && (
                    <div className="flex items-center gap-3">
                      <label className="w-32 flex-shrink-0 text-[12px] text-kong-text-secondary">Registry</label>
                      <div className="relative flex-1">
                        <select
                          value={selectedRegistryId}
                          onChange={e => setSelectedRegistryId(e.target.value)}
                          className="w-full appearance-none px-3 py-1.5 pr-8 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20"
                        >
                          {MCP_REGISTRIES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                        <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kong-text-muted pointer-events-none" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-[280px] flex-shrink-0 border-l border-kong-border px-5 py-5 overflow-y-auto">
                <DeploySummary name={name} tools={tools} cpName={cpName} routePath={routePath} allInterfaces={allInterfaces} registryId={registerInRegistry ? selectedRegistryId : undefined} />
              </div>
            </>
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

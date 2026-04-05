import { useState } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useMode } from '../contexts/ModeContext'
import type { CatalogInterface } from '../types'

type ProxyType = 'mcp' | 'llm'

const LLM_PROVIDERS = [
  { id: 'openai',    label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'mistral',   label: 'Mistral' },
  { id: 'google',    label: 'Google' },
]

const LLM_MODELS: Record<string, { id: string; label: string }[]> = {
  openai:    [{ id: 'gpt-4o', label: 'gpt-4o' }, { id: 'gpt-4o-mini', label: 'gpt-4o-mini' }, { id: 'gpt-4-turbo', label: 'gpt-4-turbo' }, { id: 'o3-mini', label: 'o3-mini' }],
  anthropic: [{ id: 'claude-opus-4', label: 'claude-opus-4' }, { id: 'claude-sonnet-4', label: 'claude-sonnet-4' }, { id: 'claude-3-5-haiku', label: 'claude-3-5-haiku' }],
  mistral:   [{ id: 'mistral-large-latest', label: 'mistral-large-latest' }, { id: 'mistral-small-latest', label: 'mistral-small-latest' }],
  google:    [{ id: 'gemini-2.0-flash', label: 'gemini-2.0-flash' }, { id: 'gemini-1.5-pro', label: 'gemini-1.5-pro' }],
}

const ROUTE_TYPES = [
  { id: 'llm/v1/chat',        label: 'llm/v1/chat' },
  { id: 'llm/v1/completions', label: 'llm/v1/completions' },
  { id: 'llm/v1/embeddings',  label: 'llm/v1/embeddings' },
]

const MCP_TRANSPORTS = [
  { id: 'HTTP/SSE',         label: 'HTTP/SSE' },
  { id: 'Streamable HTTP',  label: 'Streamable HTTP' },
]

// ─── Build functions ──────────────────────────────────────────────────────────

function buildMcpInterface(
  cpName: string,
  name: string,
  serverUrl: string,
  routePath: string,
  _transport: string,
): CatalogInterface {
  const id = `ai-gw-mcp-${Date.now()}`
  const now = new Date().toISOString().split('T')[0]
  const svcName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-svc'
  return {
    id,
    name,
    type: 'MCP',
    origin: 'ai-gateway',
    description: serverUrl,
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
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: cpName,
      gatewayInstanceName: cpName,
      environment: 'Production',
      objects: [
        { type: 'Service', name: svcName, id: `svc-${id}` },
        { type: 'Route', name: `POST ${routePath || '/mcp/' + svcName}`, id: `rt-${id}` },
        { type: 'Plugin', name: `ai-mcp-proxy · passthrough-listener`, id: `plg-${id}` },
      ],
      navigableTargetId: `gw-${id}`,
    },
    associatedApps: {
      observability: { linked: false },
      portal: { linked: false },
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

function buildLlmInterface(
  cpName: string,
  name: string,
  provider: string,
  model: string,
  routePath: string,
  _routeType: string,
): CatalogInterface {
  const id = `ai-gw-llm-${Date.now()}`
  const now = new Date().toISOString().split('T')[0]
  const svcName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-svc'
  const llmProvider = provider as CatalogInterface['llmProvider']
  return {
    id,
    name,
    type: 'LLM API',
    origin: 'ai-gateway',
    description: `${provider} / ${model} via Kong AI Gateway`,
    domain: 'AI & Automation',
    businessCapability: 'AI Agent Integration',
    ownerTeam: 'Donkey Kong',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: '',
    complianceTags: [],
    criticality: 'Standard',
    dataClassification: 'Internal',
    authPattern: 'API Key',
    version: 'v1',
    specType: 'Unknown',
    llmProvider,
    gatewayLink: {
      gatewayProductType: 'ai',
      controlPlaneName: cpName,
      gatewayInstanceName: cpName,
      environment: 'Production',
      objects: [
        { type: 'Service', name: svcName, id: `svc-${id}` },
        { type: 'Route', name: `POST ${routePath || '/ai/' + svcName}`, id: `rt-${id}` },
        { type: 'Plugin', name: `ai-proxy · ${provider} / ${model}`, id: `plg-${id}` },
      ],
      navigableTargetId: `gw-${id}`,
    },
    associatedApps: {
      observability: { linked: false },
      portal: { linked: false },
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

// ─── Shared sub-components ────────────────────────────────────────────────────

function NativeSelect({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-28 flex-shrink-0 text-[12px] text-kong-text-secondary">{label}</label>
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

function TextInput({ label, placeholder, value, onChange }: {
  label: string; placeholder: string; value: string; onChange: (v: string) => void
}) {
  const handleBlur = () => {
    if (value.trim() === '') {
      const fill = placeholder.startsWith('e.g. ') ? placeholder.slice(5) : placeholder
      onChange(fill)
    }
  }
  return (
    <div className="flex items-center gap-3">
      <label className="w-28 flex-shrink-0 text-[12px] text-kong-text-secondary">{label}</label>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={handleBlur}
        className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
      />
    </div>
  )
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export function NewAiProxyWizard({ cpNames, onClose }: { cpNames: string[]; onClose: () => void }) {
  const { addInterface } = useMode()

  const [proxyType, setProxyType] = useState<ProxyType>('mcp')
  const [cpName, setCpName] = useState(cpNames[0] ?? '')

  // MCP fields
  const [mcpName, setMcpName] = useState('')
  const [mcpUrl, setMcpUrl] = useState('')
  const [mcpRoute, setMcpRoute] = useState('')
  const [mcpTransport, setMcpTransport] = useState('HTTP/SSE')

  // LLM fields
  const [llmName, setLlmName] = useState('')
  const [llmProvider, setLlmProvider] = useState('openai')
  const [llmModel, setLlmModel] = useState('gpt-4o')
  const [llmRoute, setLlmRoute] = useState('')
  const [llmRouteType, setLlmRouteType] = useState('llm/v1/chat')

  const handleProviderChange = (p: string) => {
    setLlmProvider(p)
    setLlmModel(LLM_MODELS[p][0].id)
  }

  const mcpValid = mcpName.trim() !== '' && mcpUrl.trim() !== ''
  const llmValid = llmName.trim() !== ''
  const valid = proxyType === 'mcp' ? mcpValid : llmValid

  const save = () => {
    if (proxyType === 'mcp') {
      addInterface(buildMcpInterface(cpName, mcpName.trim(), mcpUrl.trim(), mcpRoute.trim(), mcpTransport))
    } else {
      addInterface(buildLlmInterface(cpName, llmName.trim(), llmProvider, llmModel, llmRoute.trim(), llmRouteType))
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0f1318] border border-kong-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-kong-border flex-shrink-0">
          <div>
            <h2 className="text-[15px] font-semibold text-kong-text">New AI Proxy</h2>
            <p className="text-[12px] text-kong-text-secondary mt-1">
              Configure a proxy on the AI Gateway. A catalog entry is created automatically.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-kong-text-muted hover:text-kong-text hover:bg-white/[0.05] transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Proxy type toggle */}
          <div className="flex items-center gap-3">
            <label className="w-28 flex-shrink-0 text-[12px] text-kong-text-secondary">Proxy type</label>
            <div className="flex rounded-md overflow-hidden border border-kong-border text-[12px] font-medium">
              <button
                type="button"
                onClick={() => setProxyType('mcp')}
                className={`px-3 py-1.5 transition-colors ${proxyType === 'mcp' ? 'bg-emerald-500/15 text-emerald-400' : 'text-kong-text-muted hover:text-kong-text-secondary'}`}
              >
                MCP proxy
              </button>
              <div className="w-px bg-kong-border" />
              <button
                type="button"
                onClick={() => setProxyType('llm')}
                className={`px-3 py-1.5 transition-colors ${proxyType === 'llm' ? 'bg-amber-500/15 text-amber-400' : 'text-kong-text-muted hover:text-kong-text-secondary'}`}
              >
                LLM proxy
              </button>
            </div>
          </div>

          {/* Control Plane */}
          <NativeSelect
            label="Control Plane"
            value={cpName}
            onChange={setCpName}
            options={cpNames.map(cp => ({ id: cp, label: cp }))}
          />

          <div className="border-t border-kong-border" />

          {/* MCP fields */}
          {proxyType === 'mcp' && (
            <div className="space-y-3">
              <TextInput label="Name" placeholder="e.g. Banking Operations MCP" value={mcpName} onChange={setMcpName} />
              <TextInput label="MCP server URL" placeholder="https://mcp.internal.example.com/server" value={mcpUrl} onChange={setMcpUrl} />
              <TextInput label="Route path" placeholder="/mcp/banking-ops" value={mcpRoute} onChange={setMcpRoute} />
              <NativeSelect label="Transport" value={mcpTransport} onChange={setMcpTransport} options={MCP_TRANSPORTS} />
              <div className="flex items-start gap-3 pt-1">
                <div className="w-28 flex-shrink-0" />
                <div className="flex-1 rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-2">
                  <p className="text-[11px] text-emerald-400/80 leading-relaxed">
                    Kong will proxy MCP traffic to your server using <span className="font-mono font-semibold">ai-mcp-proxy</span> in passthrough mode.
                    A catalog entry of type <span className="font-semibold">MCP</span> is created automatically.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* LLM fields */}
          {proxyType === 'llm' && (
            <div className="space-y-3">
              <TextInput label="Name" placeholder="e.g. Document Summarizer" value={llmName} onChange={setLlmName} />
              <NativeSelect label="Provider" value={llmProvider} onChange={handleProviderChange} options={LLM_PROVIDERS} />
              <NativeSelect label="Model" value={llmModel} onChange={setLlmModel} options={LLM_MODELS[llmProvider]} />
              <NativeSelect label="Route type" value={llmRouteType} onChange={setLlmRouteType} options={ROUTE_TYPES} />
              <TextInput label="Route path" placeholder="/ai/summarize" value={llmRoute} onChange={setLlmRoute} />
              <div className="flex items-start gap-3 pt-1">
                <div className="w-28 flex-shrink-0" />
                <div className="flex-1 rounded-lg bg-amber-500/5 border border-amber-500/15 px-3 py-2">
                  <p className="text-[11px] text-amber-400/80 leading-relaxed">
                    Kong routes requests to <span className="font-mono font-semibold">{llmProvider} / {llmModel}</span> via <span className="font-mono font-semibold">ai-proxy</span>.
                    A catalog entry of type <span className="font-semibold">LLM API</span> is created automatically.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-kong-border flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-[13px] text-kong-text-secondary hover:text-kong-text transition-colors">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!valid}
            className="px-4 py-2 text-[13px] font-semibold rounded-md bg-kong-cta text-[#0d1117] hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Proxy
          </button>
        </div>
      </div>
    </div>
  )
}

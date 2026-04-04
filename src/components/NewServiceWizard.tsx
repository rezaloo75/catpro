import { useState } from 'react'
import { X, Plus, Trash2, Server, ChevronDown } from 'lucide-react'
import { useMode } from '../contexts/ModeContext'
import type { CatalogInterface } from '../types'

interface RouteRow { name: string; path: string }

interface Props {
  cpNames: string[]
  onClose: () => void
}

function buildGenericInterface(cpName: string, serviceName: string, serviceUrl: string, routes: RouteRow[]): CatalogInterface {
  const id = `gw-svc-${Date.now()}`
  const now = new Date().toISOString().split('T')[0]
  const validRoutes = routes.filter(r => r.name || r.path)
  return {
    id,
    name: serviceName,
    type: 'Generic API',
    origin: 'api-gateway',
    description: serviceUrl,
    domain: 'General',
    businessCapability: '',
    ownerTeam: 'Donkey Kong',
    lifecycleStatus: 'Active',
    environments: ['Production'],
    region: '',
    complianceTags: [],
    criticality: 'Standard',
    dataClassification: 'Internal',
    authPattern: 'None',
    version: 'v1',
    specType: 'Unknown',
    gatewayLink: {
      gatewayProductType: 'api',
      controlPlaneName: cpName,
      gatewayInstanceName: cpName,
      environment: 'Production',
      objects: [
        { type: 'Service', name: serviceName, id: `svc-${id}` },
        ...validRoutes.map((r, i) => ({ type: 'Route', name: r.name || r.path, id: `rt-${id}-${i}` })),
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

export function NewServiceWizard({ cpNames, onClose }: Props) {
  const { addInterface } = useMode()

  const [cpName, setCpName] = useState(cpNames[0] ?? '')
  const [serviceName, setServiceName] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')
  const [routes, setRoutes] = useState<RouteRow[]>([{ name: '', path: '' }])

  const updateRoute = (i: number, patch: Partial<RouteRow>) =>
    setRoutes(prev => prev.map((r, idx) => idx === i ? { ...r, ...patch } : r))

  const addRoute = () => setRoutes(prev => [...prev, { name: '', path: '' }])

  const removeRoute = (i: number) =>
    setRoutes(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev)

  const valid = serviceName.trim() !== '' && serviceUrl.trim() !== ''

  const save = () => {
    addInterface(buildGenericInterface(cpName, serviceName.trim(), serviceUrl.trim(), routes))
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-[#0f1318] border border-kong-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-kong-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <Server size={15} className="text-blue-400" />
              <h2 className="text-[15px] font-semibold text-kong-text">New Service</h2>
            </div>
            <p className="text-[12px] text-kong-text-secondary mt-1">
              Add a service and its routes to a control plane.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-kong-text-muted hover:text-kong-text hover:bg-white/[0.05] transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="w-24 flex-shrink-0 text-[12px] text-kong-text-secondary">Control Plane</label>
              <div className="relative flex-1">
                <select
                  value={cpName}
                  onChange={e => setCpName(e.target.value)}
                  className="w-full appearance-none px-3 py-1.5 pr-8 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
                >
                  {cpNames.map(cp => <option key={cp} value={cp}>{cp}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kong-text-muted pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-24 flex-shrink-0 text-[12px] text-kong-text-secondary">Name</label>
              <input
                type="text"
                placeholder="e.g. payments-service"
                value={serviceName}
                onChange={e => setServiceName(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="w-24 flex-shrink-0 text-[12px] text-kong-text-secondary">Upstream URL</label>
              <input
                type="text"
                placeholder="e.g. https://payments.internal"
                value={serviceUrl}
                onChange={e => setServiceUrl(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
              />
            </div>
          </div>

          {/* Routes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-semibold text-kong-text">Routes</span>
              <button onClick={addRoute} className="flex items-center gap-1 text-[11px] text-kong-teal hover:underline">
                <Plus size={12} /> Add route
              </button>
            </div>
            <table className="w-full table-fixed text-[12px]">
              <colgroup>
                <col className="w-[45%]" />
                <col className="w-[45%]" />
                <col style={{ width: 28 }} />
              </colgroup>
              <thead>
                <tr className="border-b border-kong-border">
                  <th className="pb-1.5 text-left text-[10px] font-semibold text-kong-text-muted uppercase tracking-wide">Route name</th>
                  <th className="pb-1.5 text-left text-[10px] font-semibold text-kong-text-muted uppercase tracking-wide pl-2">Path</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {routes.map((r, i) => (
                  <tr key={i}>
                    <td className="py-1 pr-2">
                      <input
                        type="text"
                        placeholder="route-name"
                        value={r.name}
                        onChange={e => updateRoute(i, { name: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-kong-border bg-kong-surface text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
                      />
                    </td>
                    <td className="py-1 pl-2 pr-1">
                      <input
                        type="text"
                        placeholder="/path"
                        value={r.path}
                        onChange={e => updateRoute(i, { path: e.target.value })}
                        className="w-full px-2 py-1 rounded border border-kong-border bg-kong-surface text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
                      />
                    </td>
                    <td className="py-1 pl-1">
                      <button
                        onClick={() => removeRoute(i)}
                        disabled={routes.length === 1}
                        className="p-1 rounded text-kong-text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[10px] text-kong-text-muted mt-2">Routes are optional.</p>
          </div>
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
            Create Service
          </button>
        </div>
      </div>
    </div>
  )
}

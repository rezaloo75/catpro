import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Radio, Layers, Cpu, Shield, Activity, Clock, Server, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useInterfaces, useMode } from '../contexts/ModeContext'
import type { CatalogInterface, GatewayProductType } from '../types'
import { NewServiceWizard } from '../components/NewServiceWizard'

const CREATION_MODE_CPS: Record<string, { instance: string; environment: string; cpType: string }> = {
  'meridian-prod-hybrid': { instance: 'meridian-prod-hybrid', environment: 'Production', cpType: 'Hybrid' },
  'serverless-demo': { instance: 'serverless-demo', environment: 'Development', cpType: 'Serverless' },
}

function gwMeta(gwType: string) {
  const label = gwType === 'event' ? 'Event Gateway' : gwType === 'ai' ? 'AI Gateway' : 'API Gateway'
  const Icon = gwType === 'event' ? Layers : gwType === 'ai' ? Cpu : Radio
  const iconBg = gwType === 'event' ? 'bg-purple-500/15' : gwType === 'ai' ? 'bg-amber-500/15' : 'bg-blue-500/15'
  const iconText = gwType === 'event' ? 'text-purple-400' : gwType === 'ai' ? 'text-amber-400' : 'text-blue-400'
  const borderAccent = gwType === 'event' ? 'border-purple-500/30' : gwType === 'ai' ? 'border-amber-500/30' : 'border-blue-500/30'
  return { label, Icon, iconBg, iconText, borderAccent }
}

// Group interfaces by control plane for the landing page
function useControlPlaneGroups(gwType: string) {
  const interfaces = useInterfaces()
  const { mode } = useMode()
  const linked = interfaces.filter(
    i => i.gatewayLink && i.gatewayLink.gatewayProductType === gwType
  )
  const groups = new Map<string, { instance: string; environment: string; cpType?: string; interfaces: CatalogInterface[] }>()

  // In creation mode, seed the known CPs so they appear even with no linked interfaces
  if (mode === 'creation' && gwType === 'api') {
    for (const [cpName, meta] of Object.entries(CREATION_MODE_CPS)) {
      groups.set(cpName, { instance: meta.instance, environment: meta.environment, cpType: meta.cpType, interfaces: [] })
    }
  }

  for (const i of linked) {
    const gl = i.gatewayLink!
    const existing = groups.get(gl.controlPlaneName)
    if (existing) {
      existing.interfaces.push(i)
    } else {
      groups.set(gl.controlPlaneName, {
        instance: gl.gatewayInstanceName,
        environment: gl.environment,
        interfaces: [i],
      })
    }
  }
  return groups
}

// Landing page: show all control planes with their objects
function GatewayLanding({ gwType }: { gwType: string }) {
  const groups = useControlPlaneGroups(gwType)
  const { label, Icon, iconBg, iconText } = gwMeta(gwType)
  const { mode } = useMode()
  const [expandedCPs, setExpandedCPs] = useState<Set<string>>(() => new Set(groups.keys()))
  const [newServiceCP, setNewServiceCP] = useState<string | null>(null)
  const nav = useNavigate()

  const toggleCP = (cp: string) => {
    setExpandedCPs(prev => {
      const next = new Set(prev)
      if (next.has(cp)) next.delete(cp)
      else next.add(cp)
      return next
    })
  }

  const totalObjects = Array.from(groups.values()).reduce(
    (sum, g) => sum + g.interfaces.reduce((s, i) => s + (i.gatewayLink?.objects.length || 0), 0),
    0
  )

  const cpNames = Array.from(groups.keys())

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
            <Icon size={20} className={iconText} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-kong-text">{label}</h1>
            <p className="text-sm text-kong-text-secondary">
              {groups.size} control plane{groups.size !== 1 ? 's' : ''} · {totalObjects} object{totalObjects !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {mode === 'creation' && gwType === 'api' && (
          <button
            onClick={() => setNewServiceCP('__open__')}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-kong-cta text-[#0d1117] hover:brightness-110 transition"
          >
            + New Service
          </button>
        )}
      </div>

      <div className="space-y-4">
        {Array.from(groups.entries()).map(([cpName, group]) => {
          const expanded = expandedCPs.has(cpName)
          const objectCount = group.interfaces.reduce((s, i) => s + (i.gatewayLink?.objects.length || 0), 0)

          return (
            <div key={cpName} className="bg-kong-surface rounded-lg border border-kong-border overflow-hidden">
              {/* Control Plane header */}
              <div className="flex items-center justify-between px-5 py-4">
                <button
                  onClick={() => toggleCP(cpName)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div className={`w-8 h-8 rounded-md ${iconBg} flex items-center justify-center`}>
                    <Icon size={16} className={iconText} />
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] font-semibold text-kong-text">{cpName}</div>
                      {group.cpType && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {group.cpType}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-kong-text-muted">
                      {group.environment} · {objectCount} object{objectCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Healthy
                  </span>
                  {expanded ? <ChevronDown size={16} className="text-kong-text-muted" /> : <ChevronRight size={16} className="text-kong-text-muted" />}
                </div>
              </div>

              {/* Expanded body */}
              {expanded && (
                <div className="border-t border-kong-border px-5 pb-4 pt-3 space-y-4">
                  {group.interfaces.map(iface => {
                    const gl = iface.gatewayLink!
                    return (
                      <div key={iface.id}>
                        <div className="flex items-center justify-between mb-2">
                          <button
                            onClick={() => nav(`/interfaces/${iface.id}`)}
                            className="flex items-center gap-2 text-[12px] font-medium text-kong-teal hover:underline"
                          >
                            {iface.name}
                            <span className="text-kong-text-muted font-normal">· {iface.type} · {iface.domain}</span>
                          </button>
                          <button
                            onClick={() => nav(`/gateway/${gwType}/${gl.navigableTargetId}`)}
                            className="text-[11px] text-kong-text-muted hover:text-kong-text-secondary"
                          >
                            View details →
                          </button>
                        </div>
                        <div className="space-y-1">
                          {gl.objects.map(obj => (
                            <div key={obj.id} className="flex items-center justify-between px-3 py-2 bg-white/[0.02] rounded border border-kong-border-subtle">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-kong-text-secondary border border-kong-border-subtle">
                                  {obj.type}
                                </span>
                                <span className="text-[12px] font-medium text-kong-text">{obj.name}</span>
                              </div>
                              <span className="text-[10px] text-kong-text-muted font-mono">{obj.id}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                  {group.interfaces.length === 0 && (
                    <p className="text-[12px] text-kong-text-muted py-2">No services configured on this control plane yet.</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {newServiceCP && (
        <NewServiceWizard cpNames={cpNames} onClose={() => setNewServiceCP(null)} />
      )}
    </div>
  )
}

export function GatewayPage({ landingType }: { landingType?: GatewayProductType }) {
  const { type, id } = useParams()
  const nav = useNavigate()
  const allInterfaces = useInterfaces()

  const linkedInterface = id
    ? allInterfaces.find(i => i.gatewayLink?.navigableTargetId === id)
    : undefined

  const gwType = type || landingType || (linkedInterface?.gatewayLink?.gatewayProductType) || 'api'
  const { label, Icon, iconBg, iconText } = gwMeta(gwType)

  const gl = linkedInterface?.gatewayLink

  // Landing page: no specific id, show all control planes
  if (!id) {
    return <GatewayLanding gwType={gwType} />
  }

  return (
    <div>
      <button onClick={() => nav(-1)} className="flex items-center gap-1 text-[12px] text-kong-text-secondary hover:text-kong-text mb-4">
        <ArrowLeft size={14} /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={20} className={iconText} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-kong-text">{label}</h1>
          {gl && <p className="text-sm text-kong-text-secondary">{gl.controlPlaneName} · {gl.gatewayInstanceName}</p>}
          {!gl && <p className="text-sm text-kong-text-secondary">Kong {label} management view</p>}
        </div>
      </div>

      {gl && linkedInterface ? (
        <div className="space-y-6">
          <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
            <h2 className="text-sm font-semibold text-kong-text mb-4">Gateway Instance</h2>
            <div className="grid grid-cols-4 gap-6">
              <Stat label="Control Plane" value={gl.controlPlaneName} />
              <Stat label="Instance" value={gl.gatewayInstanceName} />
              <Stat label="Environment" value={gl.environment} />
              <Stat label="Status" value="Healthy" isGreen />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <MetricCard icon={Activity} label="Requests / min" value="12,847" trend="+3.2%" />
            <MetricCard icon={Clock} label="P99 Latency" value="42ms" trend="-1.1%" />
            <MetricCard icon={Shield} label="Error Rate" value="0.02%" trend="-0.01%" />
            <MetricCard icon={Server} label="Active Connections" value="1,203" trend="+12" />
          </div>

          <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
            <h2 className="text-sm font-semibold text-kong-text mb-4">
              {gwType === 'event' ? 'Event Gateway Objects' : gwType === 'ai' ? 'AI Gateway Objects' : 'Gateway Objects'}
            </h2>
            <div className="space-y-2">
              {gl.objects.map(obj => (
                <div key={obj.id} className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-lg border border-kong-border-subtle hover:border-kong-teal/20 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-kong-text-secondary border border-kong-border-subtle">
                      {obj.type}
                    </span>
                    <span className="text-[13px] font-medium text-kong-text">{obj.name}</span>
                  </div>
                  <span className="text-[11px] text-kong-text-muted font-mono">{obj.id}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
            <h2 className="text-sm font-semibold text-kong-text mb-3">Linked Catalog Interface</h2>
            <div
              onClick={() => nav(`/interfaces/${linkedInterface.id}`)}
              className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-lg border border-kong-border-subtle hover:border-kong-teal/20 cursor-pointer"
            >
              <div>
                <span className="text-[13px] font-medium text-kong-teal">{linkedInterface.name}</span>
                <span className="text-[11px] text-kong-text-muted ml-2">{linkedInterface.type} · {linkedInterface.domain}</span>
              </div>
              <span className="text-[11px] text-kong-text-muted">View in Catalog →</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-kong-surface rounded-lg border border-kong-border p-8 text-center">
          <Icon size={32} className="text-kong-text-muted mx-auto mb-3" />
          <h2 className="text-sm font-medium text-kong-text mb-1">{label}</h2>
          <p className="text-[12px] text-kong-text-secondary max-w-md mx-auto">
            Gateway object not found. Navigate from a linked interface to see gateway details.
          </p>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, isGreen }: { label: string; value: string; isGreen?: boolean }) {
  return (
    <div>
      <div className="text-[11px] text-kong-text-muted font-medium mb-0.5">{label}</div>
      {isGreen ? (
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-green-400">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {value}
        </span>
      ) : (
        <div className="text-[13px] font-medium text-kong-text">{value}</div>
      )}
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, trend }: { icon: React.ElementType; label: string; value: string; trend: string }) {
  return (
    <div className="bg-kong-surface rounded-lg border border-kong-border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-kong-text-secondary" />
        <span className="text-[11px] text-kong-text-muted">{label}</span>
      </div>
      <div className="text-lg font-semibold text-kong-text">{value}</div>
      <div className="text-[11px] text-kong-text-muted mt-0.5">{trend}</div>
    </div>
  )
}

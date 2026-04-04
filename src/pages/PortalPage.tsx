import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Globe, Users, BookOpen, ExternalLink, Key, BarChart3, BookMarked } from 'lucide-react'
import { useInterfaces, useMode } from '../contexts/ModeContext'
import { useMemo, useState } from 'react'
import type { CatalogInterface } from '../types'
import { NewRestApiWizard } from '../components/NewRestApiWizard'

const CREATION_MODE_PORTALS: { portalId: string; portalName: string; audience: string; visibility: string }[] = [
  { portalId: 'meridian-dev-hub', portalName: 'Meridian Developer Hub', audience: 'External', visibility: 'Public' },
  { portalId: 'internal-partner-portal', portalName: 'Internal Partner Portal', audience: 'Internal', visibility: 'Private' },
]

// Deterministic fake stats from interface id
function fakeStats(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = Math.imul(31, h) + id.charCodeAt(i) | 0
  const r = (min: number, max: number) => { h = Math.imul(h ^ (h >>> 16), 0x45d9f3b); return min + ((h >>> 0) % (max - min)) }
  return { subscribers: r(5, 120), pageViews: r(200, 8000), apiKeys: r(3, 60) }
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

// ===== Landing Page =====
function PortalLanding() {
  const nav = useNavigate()
  const allInterfaces = useInterfaces()
  const { mode } = useMode()
  const [wizard, setWizard] = useState<{ portalId: string } | null>(null)

  const portalMap = useMemo(() => {
    const map = new Map<string, { portalName: string; audience: string; visibility: string; interfaces: CatalogInterface[] }>()

    if (mode === 'creation') {
      for (const p of CREATION_MODE_PORTALS) {
        map.set(p.portalId, { portalName: p.portalName, audience: p.audience, visibility: p.visibility, interfaces: [] })
      }
    }

    for (const i of allInterfaces) {
      const pubs = i.associatedApps.portal.publications
      if (!pubs) continue
      for (const pub of pubs) {
        const existing = map.get(pub.portalId)
        if (existing) {
          existing.interfaces.push(i)
        } else {
          map.set(pub.portalId, { portalName: pub.portalName, audience: pub.audience, visibility: pub.visibility, interfaces: [i] })
        }
      }
    }
    return map
  }, [allInterfaces, mode])

  const totalPublished = allInterfaces.filter(i => i.associatedApps.portal.linked).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
            <Globe size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-kong-text">Developer Portals</h1>
            <p className="text-sm text-kong-text-secondary">Manage API documentation and developer access</p>
          </div>
        </div>
        {mode === 'creation' && (
          <button
            onClick={() => setWizard({ portalId: 'meridian-dev-hub' })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md bg-kong-cta text-[#0d1117] hover:brightness-110 transition"
          >
            + Publish
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <SummaryCard icon={Globe} label="Portals" value={String(portalMap.size)} iconClass="text-green-400" />
        <SummaryCard icon={BookOpen} label="Published Interfaces" value={String(totalPublished)} iconClass="text-kong-text-secondary" />
        <SummaryCard icon={Users} label="Total Subscribers" value="142" iconClass="text-kong-cta" />
      </div>

      {/* Portal containers → published interfaces */}
      <div className="space-y-4">
        {Array.from(portalMap.entries()).map(([portalId, portal]) => (
          <div key={portalId} className="bg-kong-surface rounded-lg border border-kong-border p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-green-500/15 flex items-center justify-center">
                  <Globe size={16} className="text-green-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-kong-text">{portal.portalName}</h2>
                  <p className="text-[11px] text-kong-text-muted">{portal.interfaces.length} interface{portal.interfaces.length !== 1 ? 's' : ''} published · {portal.audience} · {portal.visibility}</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-500/15 text-green-400">Active</span>
            </div>

            <div className="space-y-1.5">
              {portal.interfaces.map(i => (
                <div
                  key={i.id}
                  onClick={() => nav(`/portal/${i.id}`)}
                  className="flex items-center justify-between px-3 py-2.5 bg-white/[0.02] rounded border border-kong-border-subtle hover:border-kong-teal/20 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-kong-teal">{i.name}</span>
                    <span className="text-[10px] text-kong-text-muted">{i.type} · {i.domain}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {i.type === 'MCP' && <span className="text-[9px] text-kong-text-muted italic">documentation only — not an MCP registry</span>}
                    <Link
                      to={`/interfaces/${i.id}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1 text-[11px] text-kong-text-muted hover:text-kong-teal transition-colors"
                      title="View catalog entry"
                    >
                      <BookMarked size={12} />
                      Catalog
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {wizard && (
        <NewRestApiWizard
          launchMode="portal-first"
          initialPortalId={wizard.portalId}
          onClose={() => setWizard(null)}
        />
      )}
    </div>
  )
}

// ===== Interface Detail within Portal =====
function PortalInterfaceView({ iface }: { iface: CatalogInterface }) {
  const publications = iface.associatedApps.portal.publications || []
  const stats = fakeStats(iface.id)

  // Generate docs based on interface type
  const docs = useMemo(() => {
    const base: { name: string; status: string; views: number }[] = [
      { name: 'Getting Started Guide', status: 'Published', views: Math.round(stats.pageViews * 0.38) },
      { name: 'Authentication Guide', status: 'Published', views: Math.round(stats.pageViews * 0.19) },
    ]
    if (iface.type === 'MCP') {
      base.push(
        { name: 'Tool Reference', status: 'Published', views: Math.round(stats.pageViews * 0.31) },
        { name: 'Agent Integration Guide', status: 'Published', views: Math.round(stats.pageViews * 0.12) },
      )
    } else {
      base.push(
        { name: 'API Reference', status: 'Published', views: Math.round(stats.pageViews * 0.31) },
        { name: 'Rate Limits & Quotas', status: 'Draft', views: 0 },
      )
    }
    return base
  }, [iface, stats])

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard icon={Users} label="Subscribers" value={String(stats.subscribers)} iconClass="text-green-400" />
        <SummaryCard icon={BarChart3} label="Page Views (30d)" value={stats.pageViews.toLocaleString()} iconClass="text-kong-text-secondary" />
        <SummaryCard icon={Key} label="Active API Keys" value={String(stats.apiKeys)} iconClass="text-kong-cta" />
      </div>

      {/* Published to portals */}
      <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
        <h2 className="text-sm font-semibold text-kong-text mb-4">Published To</h2>
        <div className="space-y-2">
          {publications.map(pub => (
            <div key={pub.portalId} className="flex items-center justify-between px-4 py-3 bg-white/[0.02] rounded-lg border border-kong-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-md bg-green-500/15 flex items-center justify-center">
                  <Globe size={14} className="text-green-400" />
                </div>
                <div>
                  <div className="text-[13px] font-medium text-kong-text">{pub.portalName}</div>
                  <div className="text-[11px] text-kong-text-muted">{pub.audience} · {pub.visibility}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${pub.status === 'Published' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>{pub.status}</span>
                <button className="flex items-center gap-1 text-[12px] text-kong-teal hover:underline">
                  Open <ExternalLink size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
        {iface.type === 'MCP' && (
          <p className="text-[11px] text-kong-text-muted mt-3 italic">
            Portal provides developer documentation for this MCP server. For agent-consumable registries, see Context Mesh.
          </p>
        )}
      </div>

      {/* Documentation */}
      <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
        <h2 className="text-sm font-semibold text-kong-text mb-4">Documentation</h2>
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.name} className="flex items-center justify-between px-3 py-2.5 bg-white/[0.02] rounded-lg border border-kong-border-subtle">
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-kong-text-muted" />
                <span className="text-[12px] text-kong-text">{doc.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${doc.status === 'Published' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {doc.status}
                </span>
                {doc.views > 0 && <span className="text-[11px] text-kong-text-muted">{doc.views.toLocaleString()} views</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscribers (top consumers) */}
      <div className="bg-kong-surface rounded-lg border border-kong-border p-5">
        <h2 className="text-sm font-semibold text-kong-text mb-4">Top Subscribers</h2>
        <div className="space-y-2">
          {iface.consumers.slice(0, 5).map(consumer => (
            <div key={consumer} className="flex items-center justify-between px-3 py-2.5 bg-white/[0.02] rounded-lg border border-kong-border-subtle">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-kong-text-muted" />
                <span className="text-[12px] text-kong-text">{consumer}</span>
              </div>
              <div className="flex items-center gap-2">
                <Key size={11} className="text-kong-text-muted" />
                <span className="text-[11px] text-kong-text-muted">{Math.floor(Math.random() * 5) + 1} API key{Math.random() > 0.5 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ===== Main =====
export function PortalPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const allInterfaces = useInterfaces()
  const iface = id ? allInterfaces.find(i => i.id === id) : undefined

  if (!iface) {
    return <PortalLanding />
  }

  const publications = iface.associatedApps.portal.publications || []

  return (
    <div>
      <button onClick={() => nav('/developer-portal')} className="flex items-center gap-1 text-[12px] text-kong-text-secondary hover:text-kong-text mb-4">
        <ArrowLeft size={14} /> Back to Portals
      </button>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center">
            <Globe size={20} className="text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-kong-text">Developer Portal</h1>
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

      {publications.length > 0 ? (
        <PortalInterfaceView iface={iface} />
      ) : (
        <div className="bg-kong-surface rounded-lg border border-kong-border p-8 text-center">
          <Globe size={32} className="text-kong-text-muted mx-auto mb-3" />
          <h2 className="text-sm font-medium text-kong-text mb-1">Not Published</h2>
          <p className="text-[12px] text-kong-text-secondary max-w-md mx-auto">
            {iface.name} is not yet published to any Developer Portal.
          </p>
          <button className="mt-4 px-4 py-2 bg-kong-cta text-[#0d1117] text-[12px] font-semibold rounded-md hover:brightness-110 transition">
            Publish to Portal
          </button>
        </div>
      )}
    </div>
  )
}

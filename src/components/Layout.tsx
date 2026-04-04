import { type ReactNode, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BookOpen, Radio, Cpu, Eye, Globe, Receipt, Waypoints, Settings,
  ChevronRight, ChevronDown, Shield, User,
  LayoutGrid, Layers, FlaskConical
} from 'lucide-react'
import { useMode } from '../contexts/ModeContext'

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  children?: { to: string; label: string }[]
  alsoMatches?: string[]
}

const connectivityItems: NavItem[] = [
  { to: '/api-gateway', label: 'API Gateway', icon: Radio, alsoMatches: ['/gateway/api'] },
  { to: '/event-gateway', label: 'Event Gateway', icon: Layers, alsoMatches: ['/gateway/event'] },
  { to: '/ai-gateway', label: 'AI Gateway', icon: Cpu, alsoMatches: ['/gateway/ai'] },
]

const applicationItems: NavItem[] = [
  { to: '/developer-portal', label: 'Dev Portal', icon: Globe, alsoMatches: ['/portal'] },
  { to: '/metering-billing', label: 'Metering & Billing', icon: Receipt, alsoMatches: ['/metering'] },
  { to: '/observability', label: 'Observability', icon: Eye },
  { to: '/context-mesh', label: 'Context Mesh', icon: Waypoints },
  { to: '/settings', label: 'Identity', icon: Shield },
]

function KongLogo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2z" fill="#E87B35"/>
      <path d="M22.5 12.5c0 1.5-.8 2.8-2 3.5l2.5 5.5h-3l-2.2-4.8c-.3.05-.5.05-.8.05-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6v1.8z" fill="#fff" fillOpacity="0.9"/>
    </svg>
  )
}

function SidebarLink({ item }: { item: NavItem }) {
  const location = useLocation()
  const [expanded, setExpanded] = useState(
    item.children ? location.pathname.startsWith(item.to) : false
  )
  const hasChildren = item.children && item.children.length > 0
  const Icon = item.icon

  const path = location.pathname
  const isActive = path === item.to ||
    path.startsWith(item.to + '/') ||
    (item.alsoMatches?.some(m => path === m || path.startsWith(m + '/')) ?? false)

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className={`w-full flex items-center justify-between px-3 py-[6px] rounded text-[13px] transition-colors ${
            isActive
              ? 'text-kong-teal'
              : 'text-[#8a95a8] hover:text-[#c4cdd8]'
          }`}
        >
          <span className="flex items-center gap-2.5">
            <Icon size={15} strokeWidth={1.6} />
            {item.label}
          </span>
          <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>
        {expanded && (
          <div className="ml-[15px] border-l border-white/[0.08] pl-[11px] mt-0.5 mb-1">
            {item.children!.map(child => (
              <NavLink
                key={child.to}
                to={child.to}
                className={({ isActive: childActive }) =>
                  `block px-2.5 py-[5px] rounded text-[12px] transition-colors ${
                    childActive
                      ? 'bg-kong-teal/10 text-kong-teal font-medium'
                      : 'text-[#8a95a8] hover:text-[#c4cdd8]'
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <NavLink
      to={item.to}
      className={() =>
        `flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] transition-colors ${
          isActive
            ? 'text-kong-teal'
            : 'text-[#8a95a8] hover:text-[#c4cdd8]'
        }`
      }
    >
      <Icon size={15} strokeWidth={1.6} />
      {item.label}
    </NavLink>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const { mode, setMode } = useMode()
  return (
    <div className="flex h-screen overflow-hidden bg-kong-bg">
      {/* Sidebar */}
      <aside className="w-[200px] min-w-[200px] bg-kong-sidebar flex flex-col border-r border-white/[0.06]">
        {/* Org header */}
        <div className="px-3 py-3 flex items-center gap-2 border-b border-white/[0.06]">
          <KongLogo />
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <span className="text-[13px] text-white font-medium truncate">Meridian Corp.</span>
            <ChevronDown size={12} className="text-kong-text-muted flex-shrink-0" />
          </div>
        </div>

        {/* Catalog */}
        <div className="px-2 pt-3 pb-1">
          <NavLink
            to="/catalog"
            className={() => {
              const p = location.pathname
              const active = p === '/' || p === '/catalog' || p.startsWith('/catalog/') || p.startsWith('/interfaces/')
              return `flex items-center gap-2.5 px-3 py-[6px] rounded text-[13px] transition-colors ${
                active
                  ? 'text-kong-teal'
                  : 'text-[#8a95a8] hover:text-[#c4cdd8]'
              }`
            }}
          >
            <BookOpen size={15} strokeWidth={1.6} />
            Catalog
          </NavLink>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 overflow-y-auto px-2 pt-2">
          <div className="mb-3">
            <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-kong-text-muted">
              Connectivity
            </div>
            <div className="space-y-0.5">
              {connectivityItems
                .filter(item => mode === 'populated' || item.to !== '/event-gateway')
                .map(item => (
                  <SidebarLink key={item.to} item={item} />
                ))}
            </div>
          </div>
          <div>
            <div className="px-3 mb-1.5 text-[10px] font-semibold tracking-widest uppercase text-kong-text-muted">
              Applications
            </div>
            <div className="space-y-0.5">
              {applicationItems
                .filter(item => mode === 'populated' || !['/metering-billing', '/observability', '/settings'].includes(item.to))
                .map(item => (
                  <SidebarLink key={item.to} item={item} />
                ))}
            </div>
          </div>
        </nav>

        {/* Prototype mode toggle */}
        <div className="px-3 py-3 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 mb-2">
            <FlaskConical size={11} className="text-kong-text-muted" />
            <span className="text-[9px] font-semibold tracking-widest uppercase text-kong-text-muted">Prototype Mode</span>
          </div>
          <div className="flex rounded-md overflow-hidden border border-white/[0.08] text-[11px] font-medium">
            <button
              onClick={() => setMode('populated')}
              className={`flex-1 py-1.5 transition-colors ${
                mode === 'populated'
                  ? 'bg-kong-teal/20 text-kong-teal'
                  : 'text-kong-text-muted hover:text-[#8a95a8]'
              }`}
            >
              Populated
            </button>
            <div className="w-px bg-white/[0.08]" />
            <button
              onClick={() => setMode('creation')}
              className={`flex-1 py-1.5 transition-colors ${
                mode === 'creation'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-kong-text-muted hover:text-[#8a95a8]'
              }`}
            >
              Creation
            </button>
          </div>
        </div>

        {/* Bottom icons */}
        <div className="px-3 py-3 border-t border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-kong-text-muted hover:text-[#8a95a8] transition-colors">
              <Settings size={15} strokeWidth={1.6} />
            </button>
            <button className="text-kong-text-muted hover:text-[#8a95a8] transition-colors">
              <LayoutGrid size={15} strokeWidth={1.6} />
            </button>
          </div>
          <div className="w-6 h-6 rounded-full bg-kong-teal/20 flex items-center justify-center">
            <User size={12} className="text-kong-teal" />
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <div className="px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

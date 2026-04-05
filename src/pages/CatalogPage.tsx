import { useState, useRef, useEffect } from 'react'
import { Search, LayoutGrid, List, Radio, Layers, Sparkles, Waypoints, Puzzle, ChevronDown } from 'lucide-react'
import { useCatalogFilters } from '../hooks/useCatalogFilters'
import { SummaryTiles } from '../components/SummaryTiles'
import { InterfaceTable } from '../components/InterfaceTable'
import { InterfaceCard } from '../components/InterfaceCard'
import { NewRestApiWizard } from '../components/NewRestApiWizard'
import { NewMcpWizard } from '../components/NewMcpWizard'
import { NewLlmApiWizard } from '../components/NewLlmApiWizard'
import { useMode, useInterfaces } from '../contexts/ModeContext'

const interfaceTypes = [
  { type: 'REST API', icon: Radio, implemented: true },
  { type: 'Event API', icon: Layers, implemented: false },
  { type: 'LLM API', icon: Sparkles, implemented: true },
  { type: 'MCP Server', icon: Waypoints, implemented: true },
  { type: 'Generic API', icon: Puzzle, implemented: false },
]

function NewInterfaceButton() {
  const { mode, setMode } = useMode()
  const [open, setOpen] = useState(false)
  const [wizard, setWizard] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (type: string) => {
    setOpen(false)
    setWizard(type)
  }

  const handleButtonClick = () => {
    if (mode === 'populated') {
      setMode('creation')
    }
    setOpen(o => !o)
  }

  return (
    <>
      <div className="relative" ref={ref}>
        <div className="relative group/tooltip">
          <button
            onClick={handleButtonClick}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-md transition ${
              mode === 'creation'
                ? 'bg-kong-cta text-[#0d1117] hover:brightness-110'
                : 'bg-kong-cta/30 text-[#0d1117]/60 hover:bg-kong-cta/45'
            }`}
          >
            + New
            <ChevronDown size={14} />
          </button>
          {mode === 'populated' && (
            <div className="pointer-events-none absolute right-0 top-full mt-2 w-56 rounded-lg bg-[#1a1f27] border border-kong-border shadow-xl px-3 py-2.5 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-150 z-50">
              <p className="text-[12px] text-kong-text leading-snug">
                Click to switch to <span className="text-amber-400 font-semibold">Creation mode</span> and try the catalog creation flows.
              </p>
            </div>
          )}
        </div>
        {open && (
          <div className="absolute right-0 mt-1 w-52 bg-kong-surface border border-kong-border rounded-lg shadow-lg overflow-hidden z-50">
            <div className="px-3 py-2 border-b border-kong-border">
              <span className="text-[10px] font-semibold text-kong-text-muted uppercase tracking-wide">Create new interface</span>
            </div>
            {interfaceTypes.map(({ type, icon: Icon, implemented }) => (
              <div key={type} className="relative group/item">
                <button
                  onClick={() => implemented && handleSelect(type)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] transition-colors ${
                    implemented
                      ? 'text-kong-text hover:bg-white/[0.04] cursor-pointer'
                      : 'text-kong-text-muted cursor-not-allowed'
                  }`}
                >
                  <Icon size={14} strokeWidth={1.5} className={implemented ? 'text-kong-text-secondary' : 'text-kong-text-muted/50'} />
                  <span>{type}</span>
                </button>
                {!implemented && (
                  <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover/item:block z-50">
                    <div className="bg-[#1a1f27] border border-kong-border rounded px-2 py-1 shadow-lg whitespace-nowrap">
                      <span className="text-[10px] text-kong-text-muted">Not yet implemented in prototype</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {wizard === 'REST API' && <NewRestApiWizard onClose={() => setWizard(null)} />}
      {wizard === 'MCP Server' && <NewMcpWizard onClose={() => setWizard(null)} />}
      {wizard === 'LLM API' && <NewLlmApiWizard onClose={() => setWizard(null)} />}
    </>
  )
}

export function CatalogPage() {
  const sourceData = useInterfaces()
  const { filters, setFilters, filtered, stats, sortField, sortDir, toggleSort } = useCatalogFilters(sourceData)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-kong-text">Catalog</h1>
          <p className="text-sm text-kong-text-secondary mt-0.5">System of record for all interfaces across Meridian Bank</p>
        </div>
        <NewInterfaceButton />
      </div>

      <SummaryTiles
        stats={stats}
        filters={filters}
        setFilters={fn => setFilters(prev => fn(prev))}
      />

      {/* Search */}
      <div className="mt-4 flex items-center gap-3 w-full">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kong-text-muted" />
          <input
            type="text"
            placeholder="Search by name, tag, team, domain..."
            value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            className="w-full pl-9 pr-4 py-1.5 rounded-md border border-kong-border text-[13px] text-kong-text placeholder:text-kong-text-muted bg-kong-surface focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20"
          />
        </div>
        <div className="flex items-center bg-kong-surface rounded-md border border-kong-border flex-shrink-0">
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 ${viewMode === 'table' ? 'text-kong-teal' : 'text-kong-text-muted hover:text-kong-text-secondary'}`}
            title="Table view"
          >
            <List size={16} />
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 ${viewMode === 'cards' ? 'text-kong-teal' : 'text-kong-text-muted hover:text-kong-text-secondary'}`}
            title="Card view"
          >
            <LayoutGrid size={16} />
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="mt-4 mb-3 text-[12px] text-kong-text-muted">
        Showing {filtered.length} of {stats.total} interfaces
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3" style={{ height: 'calc(100vh - 280px)' }}>
          <img
            src="/kong-logomark.png"
            alt=""
            className="w-36 h-auto opacity-[0.06] select-none pointer-events-none"
            draggable={false}
          />
          <p className="text-[13px] text-kong-text-secondary">No interfaces found.</p>
        </div>
      ) : viewMode === 'table' ? (
        <InterfaceTable items={filtered} sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(iface => (
            <InterfaceCard key={iface.id} iface={iface} />
          ))}
        </div>
      )}

    </div>
  )
}

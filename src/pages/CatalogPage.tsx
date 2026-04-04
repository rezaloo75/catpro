import { useState, useRef, useEffect } from 'react'
import { Search, LayoutGrid, List, Radio, Layers, Sparkles, Waypoints, Puzzle, ChevronDown } from 'lucide-react'
import { useCatalogFilters } from '../hooks/useCatalogFilters'
import { SummaryTiles } from '../components/SummaryTiles'
import { InterfaceTable } from '../components/InterfaceTable'
import { InterfaceCard } from '../components/InterfaceCard'
import { NewRestApiWizard } from '../components/NewRestApiWizard'
import { useMode, useInterfaces } from '../contexts/ModeContext'

const interfaceTypes = [
  { type: 'REST API', icon: Radio },
  { type: 'Event API', icon: Layers },
  { type: 'LLM API', icon: Sparkles },
  { type: 'MCP Server', icon: Waypoints },
  { type: 'Generic API', icon: Puzzle },
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
            {interfaceTypes.map(({ type, icon: Icon }) => (
              <button
                key={type}
                onClick={() => handleSelect(type)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-kong-text hover:bg-white/[0.04] transition-colors"
              >
                <Icon size={14} strokeWidth={1.5} className="text-kong-text-secondary" />
                <span>{type}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {wizard === 'REST API' && <NewRestApiWizard onClose={() => setWizard(null)} />}
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
      {viewMode === 'table' ? (
        <InterfaceTable items={filtered} sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(iface => (
            <InterfaceCard key={iface.id} iface={iface} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
              <svg width="180" height="220" viewBox="0 0 180 220" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* ── ground shadow ── */}
                <ellipse cx="90" cy="212" rx="52" ry="7" fill="#000" opacity="0.08"/>

                {/* ── legs (behind body) ── */}
                <ellipse cx="57" cy="188" rx="26" ry="15" fill="#1c1c1c" transform="rotate(-25 57 188)"/>
                <ellipse cx="123" cy="188" rx="26" ry="15" fill="#1c1c1c" transform="rotate(25 123 188)"/>
                {/* feet */}
                <ellipse cx="42" cy="200" rx="20" ry="11" fill="#151515"/>
                <ellipse cx="138" cy="200" rx="20" ry="11" fill="#151515"/>
                {/* toe bumps left */}
                <circle cx="33" cy="196" r="5" fill="#111"/>
                <circle cx="40" cy="193" r="5" fill="#111"/>
                <circle cx="48" cy="192" r="5" fill="#111"/>
                {/* toe bumps right */}
                <circle cx="147" cy="196" r="5" fill="#111"/>
                <circle cx="140" cy="193" r="5" fill="#111"/>
                <circle cx="132" cy="192" r="5" fill="#111"/>

                {/* ── body ── */}
                <ellipse cx="90" cy="168" rx="38" ry="44" fill="#212121"/>
                {/* belly highlight */}
                <ellipse cx="90" cy="174" rx="24" ry="28" fill="#383838"/>

                {/* ── left arm raised to face ── */}
                <path d="M 62,152 Q 46,132 52,105 Q 55,92 62,88" stroke="#1c1c1c" strokeWidth="22" strokeLinecap="round" fill="none"/>
                {/* left hand */}
                <ellipse cx="62" cy="84" rx="14" ry="13" fill="#181818"/>
                {/* left index finger up */}
                <ellipse cx="57" cy="72" rx="6" ry="11" fill="#141414"/>
                <ellipse cx="57" cy="63" rx="5" ry="6" fill="#111"/>

                {/* ── right arm raised to face ── */}
                <path d="M 118,152 Q 134,132 128,105 Q 125,92 118,88" stroke="#1c1c1c" strokeWidth="22" strokeLinecap="round" fill="none"/>
                {/* right hand */}
                <ellipse cx="118" cy="84" rx="14" ry="13" fill="#181818"/>
                {/* right index finger up */}
                <ellipse cx="123" cy="72" rx="6" ry="11" fill="#141414"/>
                <ellipse cx="123" cy="63" rx="5" ry="6" fill="#111"/>

                {/* ── ears (behind head) ── */}
                <circle cx="40" cy="80" r="19" fill="#181818"/>
                <circle cx="40" cy="80" r="11" fill="#2e2e2e"/>
                <circle cx="140" cy="80" r="19" fill="#181818"/>
                <circle cx="140" cy="80" r="11" fill="#2e2e2e"/>

                {/* ── head ── */}
                <ellipse cx="90" cy="72" rx="50" ry="54" fill="#1a1a1a"/>

                {/* ── face plate ── */}
                <ellipse cx="90" cy="85" rx="36" ry="40" fill="#3a3a3a"/>

                {/* ── brow ridge ── */}
                <ellipse cx="90" cy="65" rx="34" ry="14" fill="#242424"/>

                {/* ── sad inner brows ── */}
                <path d="M 72,62 Q 80,56 88,60" stroke="#111" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
                <path d="M 108,62 Q 100,56 92,60" stroke="#111" strokeWidth="3.5" strokeLinecap="round" fill="none"/>

                {/* ── eye whites ── */}
                <ellipse cx="76" cy="76" rx="13" ry="12" fill="#ede9e2"/>
                <ellipse cx="104" cy="76" rx="13" ry="12" fill="#ede9e2"/>

                {/* ── pupils ── */}
                <circle cx="76" cy="78" r="7" fill="#111"/>
                <circle cx="104" cy="78" r="7" fill="#111"/>
                {/* eye shine */}
                <circle cx="73" cy="75" r="2.5" fill="#fff" opacity="0.75"/>
                <circle cx="101" cy="75" r="2.5" fill="#fff" opacity="0.75"/>

                {/* ── tears ── */}
                {/* left tear drop */}
                <path d="M 69,87 Q 66,96 69,104 Q 72,110 75,104 Q 78,96 75,87 Z" fill="#93c5fd" opacity="0.70"/>
                {/* right tear drop */}
                <path d="M 111,87 Q 114,96 111,104 Q 108,110 105,104 Q 102,96 105,87 Z" fill="#93c5fd" opacity="0.70"/>

                {/* ── nose ── */}
                <ellipse cx="83" cy="96" rx="6" ry="5" fill="#111" opacity="0.85"/>
                <ellipse cx="97" cy="96" rx="6" ry="5" fill="#111" opacity="0.85"/>
                <path d="M 83,96 Q 90,100 97,96" stroke="#111" strokeWidth="1.5" fill="none" opacity="0.7"/>

                {/* ── sad mouth ── */}
                <path d="M 78,110 Q 90,105 102,110" stroke="#111" strokeWidth="3" strokeLinecap="round" fill="none"/>
              </svg>
              <p className="text-[13px] text-kong-text-secondary">The catalog is empty — No bananas! :-)</p>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

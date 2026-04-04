import { ChevronDown, X } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { InterfaceType } from '../types'
import type { FilterState } from '../hooks/useCatalogFilters'

const interfaceTypes: InterfaceType[] = ['REST API', 'Event API', 'LLM API', 'MCP', 'Generic API']
function Dropdown({ label, children, hasActive }: { label: string; children: React.ReactNode; hasActive: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] border transition-colors ${
          hasActive
            ? 'bg-kong-teal/10 border-kong-teal/30 text-kong-teal font-medium'
            : 'bg-kong-surface border-kong-border text-kong-text-secondary hover:border-kong-text-secondary'
        }`}
      >
        {label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-kong-surface-raised rounded-lg shadow-xl border border-kong-border py-1 z-40 min-w-[200px]">
          {children}
        </div>
      )}
    </div>
  )
}

function CheckItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-kong-text hover:bg-white/[0.04] cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="rounded border-kong-border bg-kong-surface text-kong-teal focus:ring-kong-teal w-3.5 h-3.5" />
      {label}
    </label>
  )
}

interface FilterBarProps {
  filters: FilterState
  setFilters: (fn: (prev: FilterState) => FilterState) => void
  allDomains: string[]
  allTeams: string[]
}

export function FilterBar({ filters, setFilters, allDomains, allTeams }: FilterBarProps) {
  const toggleType = (t: InterfaceType) =>
    setFilters(f => ({
      ...f,
      types: f.types.includes(t) ? f.types.filter(x => x !== t) : [...f.types, t],
    }))

  const toggleDomain = (d: string) =>
    setFilters(f => ({
      ...f,
      domains: f.domains.includes(d) ? f.domains.filter(x => x !== d) : [...f.domains, d],
    }))

  const toggleTeam = (t: string) =>
    setFilters(f => ({
      ...f,
      teams: f.teams.includes(t) ? f.teams.filter(x => x !== t) : [...f.teams, t],
    }))

  const activeCount = [
    filters.types.length > 0,
    filters.domains.length > 0,
    filters.teams.length > 0,
    filters.gatewayLinked !== 'all',
  ].filter(Boolean).length

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dropdown label="Interface Type" hasActive={filters.types.length > 0}>
        {interfaceTypes.map(t => (
          <CheckItem key={t} label={t} checked={filters.types.includes(t)} onChange={() => toggleType(t)} />
        ))}
      </Dropdown>

      <Dropdown label="Domain" hasActive={filters.domains.length > 0}>
        <div className="max-h-48 overflow-y-auto">
          {allDomains.map(d => (
            <CheckItem key={d} label={d} checked={filters.domains.includes(d)} onChange={() => toggleDomain(d)} />
          ))}
        </div>
      </Dropdown>

      <Dropdown label="Team" hasActive={filters.teams.length > 0}>
        <div className="max-h-48 overflow-y-auto">
          {allTeams.map(t => (
            <CheckItem key={t} label={t} checked={filters.teams.includes(t)} onChange={() => toggleTeam(t)} />
          ))}
        </div>
      </Dropdown>

      <Dropdown label="Gateway" hasActive={filters.gatewayLinked !== 'all'}>
        {(['all', 'linked', 'unlinked'] as const).map(v => (
          <label key={v} className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-kong-text hover:bg-white/[0.04] cursor-pointer">
            <input
              type="radio"
              name="gateway"
              checked={filters.gatewayLinked === v}
              onChange={() => setFilters(f => ({ ...f, gatewayLinked: v }))}
              className="w-3.5 h-3.5 text-kong-teal focus:ring-kong-teal bg-kong-surface border-kong-border"
            />
            {v === 'all' ? 'All' : v === 'linked' ? 'Linked' : 'Not Linked'}
          </label>
        ))}
      </Dropdown>

      {activeCount > 0 && (
        <button
          onClick={() => setFilters(() => ({
            search: filters.search,
            types: [],
            domains: [],
            teams: [],
            gatewayLinked: 'all',
            hasObservability: null,
            hasPortal: null,
            hasMetering: null,
            hasContextMesh: null,
          }))}
          className="flex items-center gap-1 px-2 py-1.5 text-[12px] text-kong-text-secondary hover:text-kong-text"
        >
          <X size={12} />
          Clear filters ({activeCount})
        </button>
      )}
    </div>
  )
}

import { useState, useMemo } from 'react'
import { interfaces } from '../data/interfaces'
import type { InterfaceType, CatalogInterface } from '../types'

export interface FilterState {
  search: string
  types: InterfaceType[]
  domains: string[]
  teams: string[]
  gatewayLinked: 'all' | 'linked' | 'unlinked'
  hasObservability: boolean | null
  hasPortal: boolean | null
  hasMetering: boolean | null
  hasContextMesh: boolean | null
}

export type SortField = 'name' | 'type' | 'domain' | 'ownerTeam' | 'gateway' | 'specType' | 'criticality' | 'updatedAt'
export type SortDir = 'asc' | 'desc'

const defaultFilters: FilterState = {
  search: '',
  types: [],
  domains: [],
  teams: [],
  gatewayLinked: 'all',
  hasObservability: null,
  hasPortal: null,
  hasMetering: null,
  hasContextMesh: null,
}

function compareInterfaces(a: CatalogInterface, b: CatalogInterface, field: SortField, dir: SortDir): number {
  let cmp = 0
  switch (field) {
    case 'name':
      cmp = a.name.localeCompare(b.name)
      break
    case 'type':
      cmp = a.type.localeCompare(b.type)
      break
    case 'domain':
      cmp = a.domain.localeCompare(b.domain)
      break
    case 'ownerTeam':
      cmp = a.ownerTeam.localeCompare(b.ownerTeam)
      break
    case 'gateway':
      cmp = (a.gatewayLink ? 1 : 0) - (b.gatewayLink ? 1 : 0)
      break
    case 'specType':
      cmp = a.specType.localeCompare(b.specType)
      break
    case 'criticality': {
      const order = { 'Mission Critical': 0, 'Business Critical': 1, 'Standard': 2 }
      cmp = order[a.criticality] - order[b.criticality]
      break
    }
    case 'updatedAt':
      cmp = a.updatedAt.localeCompare(b.updatedAt)
      break
  }
  return dir === 'asc' ? cmp : -cmp
}

export function useCatalogFilters(sourceData: CatalogInterface[] = interfaces) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const allDomains = useMemo(() => [...new Set(sourceData.map(i => i.domain))].sort(), [sourceData])
  const allTeams = useMemo(() => [...new Set(sourceData.map(i => i.ownerTeam))].sort(), [sourceData])

  const filtered = useMemo(() => {
    const result = sourceData.filter(iface => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const searchable = [
          iface.name, iface.description, iface.domain, iface.ownerTeam,
          ...iface.tags, ...iface.complianceTags, iface.criticality,
          iface.dataClassification,
        ].join(' ').toLowerCase()
        if (!searchable.includes(q)) return false
      }
      if (filters.types.length && !filters.types.includes(iface.type)) return false
      if (filters.domains.length && !filters.domains.includes(iface.domain)) return false
      if (filters.teams.length && !filters.teams.includes(iface.ownerTeam)) return false
      if (filters.gatewayLinked === 'linked' && !iface.gatewayLink) return false
      if (filters.gatewayLinked === 'unlinked' && iface.gatewayLink) return false
      if (filters.hasObservability === true && !iface.associatedApps.observability.linked) return false
      if (filters.hasPortal === true && !iface.associatedApps.portal.linked) return false
      if (filters.hasMetering === true && !iface.associatedApps.meteringBilling.linked) return false
      if (filters.hasContextMesh === true && !iface.associatedApps.contextMesh.linked) return false
      return true
    })
    return result.sort((a, b) => compareInterfaces(a, b, sortField, sortDir))
  }, [filters, sortField, sortDir, sourceData])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const stats = useMemo(() => {
    const all = sourceData
    return {
      total: all.length,
      rest: all.filter(i => i.type === 'REST API').length,
      event: all.filter(i => i.type === 'Event API').length,
      llm: all.filter(i => i.type === 'LLM API').length,
      mcp: all.filter(i => i.type === 'MCP').length,
      generic: all.filter(i => i.type === 'Generic API').length,
      gatewayLinked: all.filter(i => !!i.gatewayLink).length,
      portalPublished: all.filter(i => i.associatedApps.portal.linked).length,
      monetized: all.filter(i => i.associatedApps.meteringBilling.linked).length,
      observable: all.filter(i => i.associatedApps.observability.linked).length,
      inContextMesh: all.filter(i => i.associatedApps.contextMesh.linked).length,
    }
  }, [sourceData])

  return { filters, setFilters, filtered, stats, allDomains, allTeams, sortField, sortDir, toggleSort }
}

export type UseCatalogFilters = ReturnType<typeof useCatalogFilters>

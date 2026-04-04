import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { interfaces } from '../data/interfaces'
import type { CatalogInterface, InterfaceType } from '../types'

interface GraphNode {
  id: string
  name: string
  type: InterfaceType | 'External' | 'Consumer'
  isCenter?: boolean
  isCatalog: boolean // exists in catalog
  x: number
  y: number
}

interface GraphEdge {
  from: string
  to: string
  label?: string
}

const typeColor: Record<string, string> = {
  'REST API': '#3b82f6',
  'Event API': '#a855f7',
  'LLM API': '#d946ef',
  'MCP': '#10b981',
  'Generic API': '#6b7280',
  'External': '#f97316',
  'Consumer': '#64748b',
}

const NODE_W = 160
const NODE_H = 44
const COL_GAP = 220
const ROW_GAP = 56

export function DependencyMap({ iface }: { iface: CatalogInterface }) {
  const nav = useNavigate()

  const { nodes, edges, width, height } = useMemo(() => {
    const nodesMap = new Map<string, GraphNode>()
    const edgesList: GraphEdge[] = []

    // Upstream: interfaces this one depends on
    const upstreams: { id?: string; name: string; type: string; detail?: string }[] = []
    for (const dep of iface.dependencies) {
      if (dep.relationship === 'upstream' || dep.relationship === 'composes-from') {
        upstreams.push({ id: dep.interfaceId, name: dep.interfaceName, type: dep.type, detail: dep.detail })
      }
    }

    // Downstream: interfaces that depend on this one
    const downstreams: { id: string; name: string; type: InterfaceType }[] = []
    for (const other of interfaces) {
      if (other.id === iface.id) continue
      for (const dep of other.dependencies) {
        if (dep.interfaceId === iface.id && (dep.relationship === 'upstream' || dep.relationship === 'composes-from')) {
          downstreams.push({ id: other.id, name: other.name, type: other.type })
        }
      }
    }

    // Also find interfaces that list this one as downstream
    for (const dep of iface.dependencies) {
      if (dep.relationship === 'downstream' && dep.interfaceId) {
        const target = interfaces.find(i => i.id === dep.interfaceId)
        if (target) {
          downstreams.push({ id: target.id, name: target.name, type: target.type })
        }
      }
    }

    // Deduplicate downstreams
    const downstreamIds = new Set<string>()
    const uniqueDownstreams = downstreams.filter(d => {
      if (downstreamIds.has(d.id)) return false
      downstreamIds.add(d.id)
      return true
    })

    // Layout
    const leftCount = upstreams.length
    const rightCount = uniqueDownstreams.length
    const maxSide = Math.max(leftCount, rightCount, 1)
    const totalHeight = Math.max(maxSide * ROW_GAP + 40, 160)
    const totalWidth = COL_GAP * 2 + NODE_W + 80

    const centerX = totalWidth / 2
    const centerY = totalHeight / 2

    // Center node
    nodesMap.set(iface.id, {
      id: iface.id,
      name: iface.name,
      type: iface.type,
      isCenter: true,
      isCatalog: true,
      x: centerX,
      y: centerY,
    })

    // Upstream nodes (left)
    const leftStartY = centerY - ((leftCount - 1) * ROW_GAP) / 2
    upstreams.forEach((up, i) => {
      const nodeId = up.id || `ext-${up.name}`
      const isCatalog = !!up.id && !!interfaces.find(x => x.id === up.id)
      nodesMap.set(nodeId, {
        id: nodeId,
        name: up.name,
        type: up.type as InterfaceType | 'External',
        isCatalog,
        x: centerX - COL_GAP,
        y: leftStartY + i * ROW_GAP,
      })
      edgesList.push({ from: nodeId, to: iface.id, label: up.detail })
    })

    // Downstream nodes (right)
    const rightStartY = centerY - ((rightCount - 1) * ROW_GAP) / 2
    uniqueDownstreams.forEach((dn, i) => {
      if (!nodesMap.has(dn.id)) {
        nodesMap.set(dn.id, {
          id: dn.id,
          name: dn.name,
          type: dn.type,
          isCatalog: true,
          x: centerX + COL_GAP,
          y: rightStartY + i * ROW_GAP,
        })
      }
      edgesList.push({ from: iface.id, to: dn.id })
    })

    return {
      nodes: Array.from(nodesMap.values()),
      edges: edgesList,
      width: totalWidth,
      height: totalHeight,
    }
  }, [iface])

  if (nodes.length <= 1) {
    return null
  }

  const handleClick = (node: GraphNode) => {
    if (node.isCatalog && !node.isCenter) {
      nav(`/interfaces/${node.id}`)
    }
  }

  return (
    <div className="overflow-hidden">
      <div className="px-5 py-2.5 flex items-center justify-between">
        <h3 className="text-[12px] font-semibold text-kong-text-secondary uppercase tracking-wide">Dependency Map</h3>
        <div className="flex items-center gap-4 text-[10px] text-kong-text-muted">
          <span>← Upstream</span>
          <span>Downstream →</span>
        </div>
      </div>
      <div className="overflow-x-auto px-4 pb-4">
        <svg width={width} height={height} className="block mx-auto">
          {/* Edges */}
          {edges.map((edge, i) => {
            const from = nodes.find(n => n.id === edge.from)
            const to = nodes.find(n => n.id === edge.to)
            if (!from || !to) return null

            const x1 = from.x + NODE_W / 2
            const y1 = from.y
            const x2 = to.x - NODE_W / 2
            const y2 = to.y
            const cx1 = x1 + (x2 - x1) * 0.4
            const cx2 = x2 - (x2 - x1) * 0.4

            return (
              <g key={i}>
                <path
                  d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="#1e2d3d"
                  strokeWidth="1.5"
                />
                {/* Arrow */}
                <circle cx={x2 - 2} cy={y2} r="3" fill="#1e2d3d" />
              </g>
            )
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const color = typeColor[node.type] || typeColor.External
            const isClickable = node.isCatalog && !node.isCenter

            return (
              <g
                key={node.id}
                onClick={() => handleClick(node)}
                className={isClickable ? 'cursor-pointer' : ''}
              >
                <rect
                  x={node.x - NODE_W / 2}
                  y={node.y - NODE_H / 2}
                  width={NODE_W}
                  height={NODE_H}
                  rx={8}
                  fill={node.isCenter ? '#131920' : '#0d1117'}
                  stroke={node.isCenter ? color : '#1e2d3d'}
                  strokeWidth={node.isCenter ? 2 : 1}
                />
                {/* Type indicator bar */}
                <rect
                  x={node.x - NODE_W / 2}
                  y={node.y - NODE_H / 2}
                  width={4}
                  height={NODE_H}
                  rx={2}
                  fill={color}
                />
                {/* Name */}
                <text
                  x={node.x - NODE_W / 2 + 14}
                  y={node.y - 4}
                  fill={isClickable ? '#00ffd0' : '#e2e8f0'}
                  fontSize="11"
                  fontWeight={node.isCenter ? '600' : '500'}
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {node.name.length > 22 ? node.name.slice(0, 21) + '…' : node.name}
                </text>
                {/* Type label */}
                <text
                  x={node.x - NODE_W / 2 + 14}
                  y={node.y + 11}
                  fill={color}
                  fontSize="9"
                  fontFamily="Inter, system-ui, sans-serif"
                >
                  {String(node.type)}
                </text>
                {/* Hover highlight for clickable */}
                {isClickable && (
                  <rect
                    x={node.x - NODE_W / 2}
                    y={node.y - NODE_H / 2}
                    width={NODE_W}
                    height={NODE_H}
                    rx={8}
                    fill="transparent"
                    className="hover:fill-white/[0.03]"
                  />
                )}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

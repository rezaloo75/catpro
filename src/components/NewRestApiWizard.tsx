import { useState, useRef } from 'react'
import yaml from 'js-yaml'
import { X, Upload, FileText, CheckCircle2, ChevronRight, ChevronLeft, ChevronDown, Shield, Globe, BookOpen, Layers, Info, Lock, DollarSign, Key } from 'lucide-react'
import { useMode } from '../contexts/ModeContext'
import type { CatalogInterface } from '../types'

const SAMPLE_SPEC_FILENAME = 'random-brewery.yaml'
const SAMPLE_SPEC_CONTENT = `openapi: 3.0.3
info:
  title: Open Brewery DB - Brewery API (Subset)
  version: 1.1.0
  description: |
    OpenAPI specification for key Open Brewery DB endpoints. Open Brewery DB is a free dataset and API with public information on breweries, cideries, brewpubs, and bottleshops.

servers:
  - url: https://api.openbrewerydb.org
    description: Open Brewery DB production API

tags:
  - name: Breweries
    description: Brewery-related endpoints

paths:
  /v1/breweries/random:
    get:
      tags: [Breweries]
      summary: Get random breweries
      operationId: getRandomBreweries
      parameters:
        - name: size
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 50
            default: 1
      responses:
        '200':
          description: Random brewery or breweries

  /v1/breweries:
    get:
      tags: [Breweries]
      summary: List breweries
      operationId: listBreweries
      parameters:
        - name: page
          in: query
          required: false
          schema:
            type: integer
            default: 1
        - name: per_page
          in: query
          required: false
          schema:
            type: integer
            default: 20
        - name: by_city
          in: query
          required: false
          schema:
            type: string
        - name: by_name
          in: query
          required: false
          schema:
            type: string
      responses:
        '200':
          description: List of breweries

components:
  schemas:
    Brewery:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        brewery_type:
          type: string
        city:
          type: string
        state_province:
          type: string
        country:
          type: string
        website_url:
          type: string
          format: uri
          nullable: true
      required:
        - id
        - name
        - brewery_type
        - city
        - state_province
        - country
`

type YesNoMaybe = 'yes' | 'no' | null

interface Step1State {
  apiName: string
  apiVersion: string
  apiDescription: string
  businessCapability: string
  hasSpec: YesNoMaybe
  specFile: File | null
  specContent: string
  wantsGateway: YesNoMaybe
  wantsPortal: YesNoMaybe
}

interface RouteRow { name: string; path: string }

interface GatewayState {
  serviceName: string
  serviceUrl: string
  routes: RouteRow[]
}

// ─── Shared ───────────────────────────────────────────────────────────────────

function ChoiceButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded text-[12px] font-medium border transition-colors ${
        selected
          ? 'bg-kong-teal/15 text-kong-teal border-kong-teal/40'
          : 'bg-transparent text-kong-text-muted border-kong-border hover:text-kong-text-secondary hover:border-kong-border-subtle'
      }`}
    >
      {label}
    </button>
  )
}

interface ParsedSpec {
  apiName?: string
  apiVersion?: string
  apiDescription?: string
  serviceUrl?: string
  serviceName?: string
  routes?: RouteRow[]
  rawContent?: string
  businessCapability?: string
}

function parseSpec(text: string, filename: string): ParsedSpec {
  try {
    const doc: Record<string, unknown> = filename.endsWith('.json')
      ? JSON.parse(text)
      : yaml.load(text) as Record<string, unknown>

    const result: ParsedSpec = {}

    const info = doc.info as { title?: string; version?: string; description?: string } | undefined

    // API identity
    if (info?.title) result.apiName = info.title
    if (info?.version) result.apiVersion = String(info.version)
    if (info?.description) result.apiDescription = info.description

    // Service URL — first server URL
    const servers = doc.servers as { url?: string }[] | undefined
    if (servers?.[0]?.url) {
      result.serviceUrl = servers[0].url
    }

    // Service name — slugified title
    if (info?.title) {
      result.serviceName = info.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    }

    // Routes — one row per path in the spec
    const paths = doc.paths as Record<string, unknown> | undefined
    if (paths) {
      const pathKeys = Object.keys(paths)
      if (pathKeys.length > 0) {
        result.routes = pathKeys.map(p => ({
          path: p,
          name: p.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/(^-|-$)/g, '') || 'route',
        }))
      }
    }

    result.rawContent = text

    // Business capability — prefer x-business-capability extension, then first tag, then title
    const ext = (doc['x-business-capability'] ?? doc['x-businessCapability']) as string | undefined
    if (ext) {
      result.businessCapability = ext
    } else {
      const tags = doc.tags as { name: string }[] | undefined
      if (tags?.[0]?.name) {
        result.businessCapability = tags[0].name
      } else if (info?.title) {
        result.businessCapability = info.title
      }
    }

    return result
  } catch {
    return {}
  }
}

function SpecUploadArea({ file, onChange, onParsed }: {
  file: File | null
  onChange: (f: File | null) => void
  onParsed: (parsed: ParsedSpec) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (f: File) => {
    onChange(f)
    const reader = new FileReader()
    reader.onload = e => onParsed(parseSpec(e.target?.result as string, f.name))
    reader.readAsText(f)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]; if (f) handleFile(f)
  }

  const loadSample = () => {
    const f = new File([SAMPLE_SPEC_CONTENT], SAMPLE_SPEC_FILENAME, { type: 'text/yaml' })
    onChange(f)
    onParsed(parseSpec(SAMPLE_SPEC_CONTENT, SAMPLE_SPEC_FILENAME))
  }

  return (
    <div className="mt-3 space-y-2">
      <input ref={inputRef} type="file" accept=".json,.yaml,.yml" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      {file ? (
        <div className="flex items-center justify-between px-3 py-2 rounded border border-kong-teal/30 bg-kong-teal/5">
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-kong-teal flex-shrink-0" />
            <span className="text-[12px] text-kong-text truncate max-w-[260px]">{file.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={13} className="text-kong-teal" />
            <button onClick={() => onChange(null)} className="text-[11px] text-kong-text-muted hover:text-kong-text transition-colors">Remove</button>
          </div>
        </div>
      ) : (
        <>
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-1 py-4 rounded border-2 border-dashed cursor-pointer transition-colors ${dragging ? 'border-kong-teal/60 bg-kong-teal/5' : 'border-kong-border hover:border-kong-border-subtle hover:bg-white/[0.02]'}`}
          >
            <Upload size={14} className="text-kong-text-muted" />
            <span className="text-[12px] text-kong-text-secondary">Drop your spec here, or <span className="text-kong-teal">browse</span></span>
            <span className="text-[10px] text-kong-text-muted">.yaml · .yml · .json</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-kong-text-muted">or</span>
            <button
              type="button"
              onClick={loadSample}
              className="text-[11px] text-kong-teal hover:underline transition-colors"
            >
              use sample spec
            </button>
            <span className="text-[11px] text-kong-text-muted">— Open Brewery DB API</span>
          </div>
        </>
      )}
    </div>
  )
}

function Question({ title, description, value, onChange, children }: {
  title: string; description: string; value: YesNoMaybe
  onChange: (v: YesNoMaybe) => void; children?: React.ReactNode
}) {
  return (
    <div className="py-5 border-b border-kong-border last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-kong-text">{title}</p>
          <p className="text-[12px] text-kong-text-secondary mt-0.5 leading-relaxed">{description}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 pt-0.5">
          <ChoiceButton label="Yes" selected={value === 'yes'} onClick={() => onChange(value === 'yes' ? null : 'yes')} />
          <ChoiceButton label="No" selected={value === 'no'} onClick={() => onChange(value === 'no' ? null : 'no')} />
        </div>
      </div>
      {children}
    </div>
  )
}

// ─── Step 1 right panel ───────────────────────────────────────────────────────

function SetupSummary({ state }: { state: Step1State }) {
  const items: { icon: React.ElementType; label: string; sub: string; active: boolean; color: string }[] = [
    { icon: BookOpen, label: 'Catalog entry', sub: state.hasSpec === 'yes' ? 'With uploaded spec' : 'Documented manually', active: true, color: 'text-kong-teal' },
    { icon: Shield, label: 'Gateway service & route', sub: state.wantsGateway === 'yes' ? 'Will be configured next' : state.wantsGateway === 'no' ? 'Not included' : 'Pending your answer', active: state.wantsGateway === 'yes', color: 'text-blue-400' },
    { icon: Globe, label: 'Developer Portal publication', sub: state.wantsPortal === 'yes' ? 'Will be configured next' : state.wantsPortal === 'no' ? 'Not included' : 'Pending your answer', active: state.wantsPortal === 'yes', color: 'text-green-400' },
  ]
  const answered = [state.hasSpec, state.wantsGateway, state.wantsPortal].filter(v => v !== null).length
  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[12px] font-semibold text-kong-text">What gets created</span>
        <span className="text-[10px] text-kong-text-muted">{answered}/3 answered</span>
      </div>
      <p className="text-[11px] text-kong-text-secondary mb-4 leading-relaxed">Based on your answers, here's what will be set up for this API.</p>
      <div className="space-y-3">
        {items.map(({ icon: Icon, label, sub, active, color }) => (
          <div key={label} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${active ? 'border-kong-border bg-white/[0.03]' : 'border-kong-border-subtle bg-transparent opacity-50'}`}>
            <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${active ? 'bg-white/[0.06]' : 'bg-white/[0.03]'}`}>
              <Icon size={13} className={active ? color : 'text-kong-text-muted'} />
            </div>
            <div>
              <p className={`text-[12px] font-medium ${active ? 'text-kong-text' : 'text-kong-text-muted'}`}>{label}</p>
              <p className="text-[10px] text-kong-text-muted mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto pt-6">
        <div className="flex items-start gap-2 p-3 rounded-lg bg-white/[0.02] border border-kong-border">
          <Layers size={12} className="text-kong-text-secondary flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-kong-text-secondary leading-relaxed">Gateway and Portal connections can always be added later from the interface's detail page.</p>
        </div>
      </div>
    </div>
  )
}

// ─── Step 2 diagram ───────────────────────────────────────────────────────────

function GatewayDiagram({ active, serviceName, routes, controlPlane }: {
  active: 'service' | 'route' | null
  serviceName: string
  routes: RouteRow[]
  controlPlane: string
}) {
  const routeActive = active === 'route'
  const serviceActive = active === 'service'
  const serviceColor = serviceActive ? '#2dd4bf' : '#3b82f6'
  const serviceOpacity = serviceActive ? 1 : 0.45
  const serviceLabel = serviceName || 'Service'

  // Route layout — up to 3 displayed, center always lands at y=217
  const MAX_DISPLAY = 3
  const displayRoutes = routes.slice(0, MAX_DISPLAY)
  const hasMore = routes.length > MAX_DISPLAY
  const n = displayRoutes.length
  const GAP = 6
  const TOTAL_H = 120          // same as service box height — keeps center at 217
  const dotReserve = hasMore ? 16 : 0
  const routeH = Math.floor((TOTAL_H - dotReserve - (n - 1) * GAP) / n)
  const ROUTE_Y_START = 157
  const routeBoxY = (i: number) => ROUTE_Y_START + i * (routeH + GAP)
  const routeBoxCY = (i: number) => routeBoxY(i) + routeH / 2

  // Connector constants
  const BUS_X = 247   // right edge of route zone (167 + 80)
  const PIPE_X1 = 253
  const PIPE_X2 = 271
  const SERVICE_CY = 217

  return (
    <div className="w-full h-full flex flex-col">
      <p className="text-[12px] font-semibold text-kong-text mb-1">How it works</p>
      <p className="text-[11px] text-kong-text-secondary mb-3 leading-relaxed">
        Kong Gateway receives client requests and proxies them to your backend via a Route and Service.
      </p>
      <div className="flex-1 relative rounded-lg overflow-hidden border border-kong-border" style={{ minHeight: 330 }}>
        <svg
          viewBox="0 0 520 330"
          className="w-full h-full"
          style={{ background: '#0a0e13' }}
        >
          <defs>
            <pattern id="gw-dots" width="16" height="16" patternUnits="userSpaceOnUse">
              <circle cx="8" cy="8" r="1" fill="#ffffff" opacity="0.06" />
            </pattern>
            <marker id="arr-gray" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M0,1 L9,5 L0,9 Z" fill="#6b7280" />
            </marker>
            <marker id="arr-blue" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
              <path d="M0,1 L9,5 L0,9 Z" fill="#3b82f6" />
            </marker>
            <marker id="arr-purple" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
              <path d="M0,1 L8,4.5 L0,8 Z" fill="#7c3aed" />
            </marker>
            <path id="req-path" d="M 94,205 L 152,205 Q 152,217 167,217 L 249,217 L 271,217 L 277,217 L 359,217 Q 366,217 366,205 L 424,205" fill="none" />
            <path id="res-path" d="M 424,231 L 366,231 Q 366,217 359,217 L 277,217 L 271,217 L 249,217 L 167,217 Q 152,217 152,231 L 94,231" fill="none" />
          </defs>

          {/* Dotted background */}
          <rect width="520" height="330" fill="url(#gw-dots)" />

          {/* ── Kong Control Plane box ── */}
          <rect x="160" y="8" width="200" height="52" rx="7" fill="#1a1230" stroke="#6d28d9" strokeWidth="1.2" />
          <text x="260" y="26" fontSize="8.5" fill="#a78bfa" textAnchor="middle" fontWeight="700" letterSpacing="0.3">KONG CONTROL PLANE</text>
          <text x="260" y="43" fontSize="11" fill="#c4b5fd" textAnchor="middle" fontWeight="600">{controlPlane}</text>

          {/* ── Config flow: Control Plane → Data Plane ── */}
          <line x1="260" y1="60" x2="260" y2="115" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr-purple)" />

          {/* ── Client box ── */}
          <rect x="8" y="183" width="86" height="70" rx="7" fill="#0f1520" stroke="#1e2a3a" strokeWidth="1.2" />
          <text x="51" y="218" fontSize="11" fill="#e5e7eb" textAnchor="middle" dominantBaseline="middle" fontWeight="700">Client</text>

          {/* ── Arrow zone: Client ↔ Gateway ── */}
          <line x1="94" y1="205" x2="152" y2="205" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr-gray)" />
          <line x1="152" y1="231" x2="94" y2="231" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr-blue)" />

          {/* ── Kong API Gateway Data Plane box ── */}
          <rect x="154" y="117" width="212" height="200" rx="9" fill="#111827" stroke="#1e3a5f" strokeWidth="1.5" />
          <text x="170" y="140" fontSize="9.5" fill="#60a5fa" fontWeight="700">Kong API Gateway Data Plane</text>

          {/* ── Route boxes (stacked) ── */}
          {displayRoutes.map((route, i) => {
            const ry = routeBoxY(i)
            const rcy = routeBoxCY(i)
            const color = routeActive ? '#2dd4bf' : '#3b82f6'
            const opacity = routeActive ? 1 : 0.45
            const label = route.name || 'Route'
            return (
              <g key={i}>
                <rect
                  x="167" y={ry} width="80" height={routeH} rx="6"
                  fill={routeActive ? 'rgba(45,212,191,0.07)' : 'rgba(59,130,246,0.04)'}
                  stroke={color} strokeWidth="1.8" strokeDasharray="6 3"
                  opacity={opacity}
                  style={{ transition: 'all 0.2s' }}
                />
                <text
                  x="207" y={rcy}
                  fontSize={routeH >= 50 ? 13 : routeH >= 34 ? 11 : 9}
                  fill={routeActive ? '#2dd4bf' : '#93c5fd'}
                  textAnchor="middle" dominantBaseline="middle"
                  fontWeight="600" opacity={opacity}
                >
                  {label.length > 9 ? label.slice(0, 8) + '…' : label}
                </text>
              </g>
            )
          })}

          {/* ── "..." overflow indicator ── */}
          {hasMore && (
            <text
              x="207" y={routeBoxY(n - 1) + routeH + 10}
              fontSize="10" fill="#6b7280" textAnchor="middle" fontWeight="600"
            >
              +{routes.length - MAX_DISPLAY} more
            </text>
          )}

          {/* ── Connector: routes → service ── */}
          {n === 1 ? (
            // Single route: simple horizontal plug connector
            <>
              <rect x={BUS_X} y={SERVICE_CY - 5} width="6" height="10" rx="1.5" fill="#1e293b" stroke="#374151" strokeWidth="1.2" />
              <line x1={PIPE_X1} y1={SERVICE_CY} x2={PIPE_X2} y2={SERVICE_CY} stroke="#374151" strokeWidth="2" />
              <rect x={PIPE_X2} y={SERVICE_CY - 5} width="6" height="10" rx="1.5" fill="#1e293b" stroke="#374151" strokeWidth="1.2" />
            </>
          ) : (
            // Multiple routes: vertical bus bar + horizontal pipe to service
            <>
              <line x1={BUS_X} y1={routeBoxCY(0)} x2={BUS_X} y2={routeBoxCY(n - 1)} stroke="#374151" strokeWidth="2" />
              {displayRoutes.map((_, i) => (
                <circle key={i} cx={BUS_X} cy={routeBoxCY(i)} r="3" fill="#374151" stroke="#4b5563" strokeWidth="1" />
              ))}
              <line x1={BUS_X} y1={SERVICE_CY} x2={PIPE_X1} y2={SERVICE_CY} stroke="#374151" strokeWidth="2" />
              <line x1={PIPE_X1} y1={SERVICE_CY} x2={PIPE_X2} y2={SERVICE_CY} stroke="#374151" strokeWidth="2" />
              <rect x={PIPE_X2} y={SERVICE_CY - 5} width="6" height="10" rx="1.5" fill="#1e293b" stroke="#374151" strokeWidth="1.2" />
            </>
          )}

          {/* ── Service dashed box ── */}
          <rect
            x="277" y="157" width="82" height="120" rx="7"
            fill={serviceActive ? 'rgba(45,212,191,0.07)' : 'rgba(59,130,246,0.04)'}
            stroke={serviceColor} strokeWidth="1.8" strokeDasharray="6 3"
            opacity={serviceOpacity}
            style={{ transition: 'all 0.2s' }}
          />
          <text x="318" y="217" fontSize="14" fill={serviceActive ? '#2dd4bf' : '#93c5fd'} textAnchor="middle" dominantBaseline="middle" fontWeight="600" opacity={serviceOpacity}>
            {serviceLabel.length > 9 ? serviceLabel.slice(0, 8) + '…' : serviceLabel}
          </text>

          {/* ── Guide line through service ── */}
          <line x1="277" y1="217" x2="359" y2="217" stroke="#374151" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

          {/* ── Arrow zone: Gateway ↔ Backend ── */}
          <line x1="366" y1="205" x2="424" y2="205" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr-gray)" />
          <line x1="424" y1="231" x2="366" y2="231" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" markerEnd="url(#arr-blue)" />

          {/* ── Backend box ── */}
          <rect x="426" y="183" width="86" height="70" rx="7" fill="#0f1520" stroke="#1e2a3a" strokeWidth="1.2" />
          <text x="469" y="218" fontSize="11" fill="#e5e7eb" textAnchor="middle" dominantBaseline="middle" fontWeight="700">Backend API</text>

          {/* ── Animated dots ── */}
          <circle r="4" fill="#9ca3af">
            <animateMotion dur="4s" repeatCount="indefinite" calcMode="linear"
              keyPoints="0;1;1" keyTimes="0;0.5;1">
              <mpath href="#req-path" />
            </animateMotion>
            <animate attributeName="opacity" dur="4s" repeatCount="indefinite"
              calcMode="discrete" values="1;0" keyTimes="0;0.5" />
          </circle>
          <circle r="4" fill="#3b82f6">
            <animateMotion dur="4s" repeatCount="indefinite" calcMode="linear"
              keyPoints="0;0;1" keyTimes="0;0.5;1">
              <mpath href="#res-path" />
            </animateMotion>
            <animate attributeName="opacity" dur="4s" repeatCount="indefinite"
              calcMode="discrete" values="0;1" keyTimes="0;0.5" />
          </circle>
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-2.5 px-1">
        <div className="flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          <span className="text-[10px] text-kong-text-muted">Request</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          <span className="text-[10px] text-kong-text-muted">Response</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          <span className="text-[10px] text-kong-text-muted">Configuration flow</span>
        </div>
      </div>

    </div>
  )
}

// ─── Step 2 form ──────────────────────────────────────────────────────────────

const CONTROL_PLANES = [
  { id: 'serverless-demo', label: 'serverless-demo' },
  { id: 'meridian-prod-hybrid', label: 'meridian-prod-hybrid' },
]

function ControlPlaneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value
  const setSelected = onChange
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useState(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })

  return (
    <div className="flex items-center gap-3" ref={ref}>
      <div className="w-24 flex-shrink-0">
        <span className="text-[12px] font-semibold text-kong-text">Control Plane</span>
      </div>
      <div className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors hover:border-kong-border-subtle"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <span>{selected}</span>
        </div>
        <ChevronDown size={13} className={`text-kong-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-[#0f1318] border border-kong-border rounded-lg shadow-xl overflow-hidden z-20">
          {CONTROL_PLANES.map(cp => (
            <button
              key={cp.id}
              type="button"
              onClick={() => { setSelected(cp.id); setOpen(false) }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-[13px] transition-colors ${
                selected === cp.id
                  ? 'bg-kong-teal/10 text-kong-teal'
                  : 'text-kong-text hover:bg-white/[0.04]'
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected === cp.id ? 'bg-kong-teal' : 'bg-green-400'}`} />
              {cp.label}
            </button>
          ))}
          <div className="border-t border-kong-border px-3 py-2.5">
            <p className="text-[11px] text-kong-text-muted leading-relaxed">
              To add more control planes, use <span className="text-kong-teal">API Gateway</span> in Konnect.
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

function FormField({ label, hint, placeholder, value, onChange, onFocus, onBlur }: {
  label: string; hint?: string
  placeholder: string; value: string
  onChange: (v: string) => void
  onFocus?: () => void; onBlur?: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 w-24 flex-shrink-0">
        <label className="text-[12px] font-semibold text-kong-text">{label}</label>
        {hint && (
          <div className="relative group">
            <Info size={11} className="text-kong-text-muted cursor-help" />
            <div className="absolute left-0 bottom-full mb-1 w-48 bg-[#1e2530] border border-kong-border rounded p-2 text-[10px] text-kong-text-secondary leading-relaxed hidden group-hover:block z-10 shadow-lg">
              {hint}
            </div>
          </div>
        )}
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
      />
    </div>
  )
}

function SectionHeader({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <h3 className="text-[13px] font-bold text-kong-text">{label}</h3>
      {hint && (
        <div className="relative group">
          <Info size={12} className="text-kong-text-muted cursor-help" />
          <div className="absolute left-0 bottom-full mb-1 w-52 bg-[#1e2530] border border-kong-border rounded p-2 text-[10px] text-kong-text-secondary leading-relaxed hidden group-hover:block z-10 shadow-lg">
            {hint}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Step 3: Portal publish ───────────────────────────────────────────────────

interface PortalState {
  portalId: string
  authStrategy: string
  visibility: 'public' | 'private'
}

const PORTALS = [
  { id: 'meridian-dev-hub', label: 'Meridian Developer Hub' },
  { id: 'internal-partner-portal', label: 'Internal Partner Portal' },
]

const AUTH_STRATEGIES = [
  { id: 'key-auth', label: 'key-auth' },
  { id: 'disabled', label: 'Disabled' },
]

function SimpleSelect({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { id: string; label: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.id === value)

  useState(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  })

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text focus:outline-none hover:border-kong-border-subtle transition-colors"
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={13} className={`text-kong-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-[#0f1318] border border-kong-border rounded-lg shadow-xl overflow-hidden z-20">
          {options.map(opt => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false) }}
              className={`w-full text-left px-3 py-2.5 text-[13px] transition-colors ${
                value === opt.id ? 'bg-kong-teal/10 text-kong-teal' : 'text-kong-text hover:bg-white/[0.04]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PortalPreview({ apiName, apiVersion, apiDescription, portalId, authStrategy, visibility }: {
  apiName: string; apiVersion: string; apiDescription: string
  portalId: string; authStrategy: string; visibility: 'public' | 'private'
}) {
  const portalLabel = PORTALS.find(p => p.id === portalId)?.label ?? portalId
  const displayName = apiName || 'Untitled API'
  const displayVersion = apiVersion || 'v1'
  return (
    <div className="h-full flex flex-col">
      <p className="text-[12px] font-semibold text-kong-text mb-1">Portal preview</p>
      <p className="text-[11px] text-kong-text-secondary mb-4 leading-relaxed">
        How this API will appear to developers in <span className="text-kong-text">{portalLabel}</span>.
      </p>
      <div className="rounded-lg border border-kong-border bg-[#0a0e13] p-4 flex flex-col gap-3">
        {/* Mock portal card */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-kong-teal/15 flex items-center justify-center flex-shrink-0">
              <Globe size={14} className="text-kong-teal" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-kong-text">{displayName}</p>
              <p className="text-[10px] text-kong-text-muted">{displayVersion}</p>
            </div>
          </div>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0 ${
            visibility === 'public' ? 'bg-green-500/15 text-green-400' : 'bg-amber-500/15 text-amber-400'
          }`}>
            {visibility === 'public' ? 'Public' : 'Private'}
          </span>
        </div>
        {apiDescription && (
          <p className="text-[11px] text-kong-text-secondary leading-relaxed line-clamp-3">{apiDescription}</p>
        )}
        <div className="flex items-center gap-3 pt-1 border-t border-kong-border">
          <div className="flex items-center gap-1.5">
            <Key size={10} className="text-kong-text-muted" />
            <span className="text-[10px] text-kong-text-muted">{authStrategy}</span>
          </div>
          {visibility === 'private' && (
            <div className="flex items-center gap-1.5">
              <Lock size={10} className="text-kong-text-muted" />
              <span className="text-[10px] text-kong-text-muted">Auth required</span>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-kong-border bg-white/[0.02] p-3">
        <p className="text-[10px] text-kong-text-muted leading-relaxed">Developers will be able to browse the documentation, generate API keys, and request access directly from the portal.</p>
      </div>
    </div>
  )
}

// ─── Build CatalogInterface from wizard state ─────────────────────────────────

const PORTAL_LABELS: Record<string, string> = {
  'meridian-dev-hub': 'Meridian Developer Hub',
  'internal-partner-portal': 'Internal Partner Portal',
}

function buildInterface(
  s1: Step1State,
  gw: GatewayState,
  controlPlane: string,
  portal: PortalState,
): CatalogInterface {
  const id = `created-${Date.now()}`
  const now = new Date().toISOString().split('T')[0]

  const gatewayLink: CatalogInterface['gatewayLink'] = s1.wantsGateway === 'yes' ? {
    gatewayProductType: 'api',
    controlPlaneName: controlPlane,
    gatewayInstanceName: controlPlane,
    environment: 'Development',
    objects: [
      { type: 'Service', name: gw.serviceName || 'new-service', id: `svc-${id}` },
      ...gw.routes.map((r, i) => ({
        type: 'Route',
        name: r.path || r.name || `route-${i}`,
        id: `rt-${id}-${i}`,
      })),
    ],
    navigableTargetId: `gw-${id}`,
  } : undefined

  const portalLinked = s1.wantsPortal === 'yes'
  const portalLabel = PORTAL_LABELS[portal.portalId] ?? portal.portalId

  return {
    id,
    name: s1.apiName || 'Unnamed API',
    type: 'REST API',
    origin: s1.wantsGateway === 'yes' ? 'api-gateway' : 'portal',
    description: s1.apiDescription || '',
    domain: 'General',
    businessCapability: s1.businessCapability || '',
    ownerTeam: 'Donkey Kong',
    lifecycleStatus: 'Proposed',
    environments: ['Development'],
    region: '',
    complianceTags: [],
    criticality: 'Standard',
    dataClassification: 'Internal',
    authPattern: portal.authStrategy !== 'disabled' ? portal.authStrategy : 'None',
    version: s1.apiVersion || 'v1',
    specType: s1.specFile ? 'OpenAPI' : 'Unknown',
    specSnippet: s1.specContent || undefined,
    gatewayLink,
    associatedApps: {
      observability: { linked: false },
      portal: portalLinked ? {
        linked: true,
        summary: `Published to ${portalLabel}`,
        linkedObjectsCount: 1,
        publications: [{
          portalName: portalLabel,
          portalId: portal.portalId,
          audience: 'External',
          visibility: portal.visibility === 'public' ? 'Public' : 'Private',
          status: 'Published',
        }],
      } : { linked: false },
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

// ─── Main Wizard ──────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
  launchMode?: 'portal-first'
  initialPortalId?: string
}

export function NewRestApiWizard({ onClose, launchMode, initialPortalId }: Props) {
  const { addInterface } = useMode()
  const isPortalFirst = launchMode === 'portal-first'
  const [step, setStep] = useState(1)
  const [s1, setS1] = useState<Step1State>({
    apiName: '', apiVersion: '', apiDescription: '', businessCapability: '',
    hasSpec: null, specFile: null, specContent: '',
    wantsGateway: isPortalFirst ? 'no' : null,
    wantsPortal: isPortalFirst ? 'yes' : null,
  })
  const [gw, setGw] = useState<GatewayState>({ serviceName: '', serviceUrl: '', routes: [{ name: '', path: '' }] })
  const [activeField, setActiveField] = useState<'service' | 'route' | null>(null)
  const [controlPlane, setControlPlane] = useState('serverless-demo')
  const [portal, setPortal] = useState<PortalState>({
    portalId: initialPortalId ?? 'meridian-dev-hub',
    authStrategy: 'key-auth',
    visibility: 'public',
  })

  const setS = (patch: Partial<Step1State>) => setS1(prev => ({ ...prev, ...patch }))
  const setG = (patch: Partial<GatewayState>) => setGw(prev => ({ ...prev, ...patch }))
  const setP = (patch: Partial<PortalState>) => setPortal(prev => ({ ...prev, ...patch }))

  const step1Valid = s1.apiName.trim() !== '' && s1.hasSpec !== null && s1.wantsGateway !== null && s1.wantsPortal !== null

  const goBack = () => {
    if (step === 3) setStep(s1.wantsGateway === 'yes' ? 2 : 1)
    else if (step === 2) setStep(1)
  }

  const save = () => {
    addInterface(buildInterface(s1, gw, controlPlane, portal))
    onClose()
  }

  const handleNext = () => {
    if (step === 1) {
      if (s1.wantsGateway === 'yes') setStep(2)
      else if (s1.wantsPortal === 'yes') setStep(3)
      else { save(); return }
    } else if (step === 2) {
      if (s1.wantsPortal === 'yes') setStep(3)
      else { save(); return }
    } else {
      save(); return
    }
  }

  const totalSteps = [s1.wantsGateway === 'yes', s1.wantsPortal === 'yes'].filter(Boolean).length + 1
  const stepIndex = step === 1 ? 1 : step === 2 ? (s1.wantsGateway === 'yes' ? 2 : 2) : totalSteps
  const stepLabel = `Step ${stepIndex} of ${totalSteps}`

  const stepSubtitle = step === 1
    ? isPortalFirst
      ? 'Describe your API — we\'ll publish it to the portal and create a catalog entry automatically.'
      : 'Tell us about your API so we can tailor the setup to your needs.'
    : step === 2
    ? 'Define a gateway service and route so Kong can receive and proxy traffic to your API.'
    : 'Choose where to publish and how developers will access your API.'

  const isLastStep = (step === 1 && s1.wantsGateway !== 'yes' && s1.wantsPortal !== 'yes') ||
    (step === 2 && s1.wantsPortal !== 'yes') ||
    step === 3

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-[#0f1318] border border-kong-border rounded-xl shadow-2xl flex flex-col h-[680px] max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-kong-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[15px] font-semibold text-kong-text">{isPortalFirst ? 'Publish API to Portal' : 'New REST API'}</h2>
              <span className="text-[10px] text-kong-text-muted border border-kong-border rounded px-1.5 py-0.5">{stepLabel}</span>
            </div>
            <p className="text-[12px] text-kong-text-secondary mt-1">{stepSubtitle}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded text-kong-text-muted hover:text-kong-text hover:bg-white/[0.05] transition-colors mt-0.5">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">

          {/* ── Step 1 ── */}
          {step === 1 && (
            <>
              <div className="flex-1 overflow-y-auto px-6 pt-5 min-w-0">
                {/* Quick-start banner */}
                <div className="mb-4 flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-kong-teal/20 bg-kong-teal/5">
                  <div>
                    <p className="text-[12px] font-semibold text-kong-text">{isPortalFirst ? 'Want a quick start?' : 'New here? Let us pre-fill everything for you.'}</p>
                    <p className="text-[11px] text-kong-text-muted mt-0.5">{isPortalFirst ? 'Loads a sample spec and pre-fills all fields so you can publish right away.' : 'Loads a sample spec and sets all options to yes so you can explore the full flow.'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const f = new File([SAMPLE_SPEC_CONTENT], SAMPLE_SPEC_FILENAME, { type: 'text/yaml' })
                      const p = parseSpec(SAMPLE_SPEC_CONTENT, SAMPLE_SPEC_FILENAME)
                      setS({
                        hasSpec: 'yes',
                        specFile: f,
                        specContent: SAMPLE_SPEC_CONTENT,
                        wantsGateway: isPortalFirst ? 'no' : 'yes',
                        wantsPortal: 'yes',
                        apiName: p.apiName ?? s1.apiName,
                        apiVersion: p.apiVersion ?? s1.apiVersion,
                        apiDescription: p.apiDescription ?? s1.apiDescription,
                        businessCapability: p.businessCapability ?? s1.businessCapability,
                      })
                      setGw(prev => ({
                        serviceName: p.serviceName ?? prev.serviceName,
                        serviceUrl: p.serviceUrl ?? prev.serviceUrl,
                        routes: p.routes ?? prev.routes,
                      }))
                    }}
                    className="flex-shrink-0 px-3 py-1.5 rounded-md bg-kong-teal/15 text-kong-teal text-[12px] font-semibold hover:bg-kong-teal/25 transition-colors whitespace-nowrap"
                  >
                    Pre-fill for me
                  </button>
                </div>

                <Question
                  title="Do you have an OpenAPI spec?"
                  description="A YAML or JSON file describing your API's endpoints and responses. We'll use it to pre-populate the fields below automatically."
                  value={s1.hasSpec}
                  onChange={v => setS({ hasSpec: v, specFile: v !== 'yes' ? null : s1.specFile })}
                >
                  {s1.hasSpec === 'yes' && (
                    <SpecUploadArea
                      file={s1.specFile}
                      onChange={f => {
                        setS({ specFile: f })
                        if (!f) {
                          setS({ apiName: '', apiVersion: '', apiDescription: '', specContent: '' })
                          setGw({ serviceName: '', serviceUrl: '', routes: [{ name: '', path: '' }] })
                        }
                      }}
                      onParsed={p => {
                        setS({
                          apiName: p.apiName ?? s1.apiName,
                          apiVersion: p.apiVersion ?? s1.apiVersion,
                          apiDescription: p.apiDescription ?? s1.apiDescription,
                          specContent: p.rawContent ?? '',
                          businessCapability: p.businessCapability ?? s1.businessCapability,
                        })
                        setGw(prev => ({
                          serviceName: p.serviceName ?? prev.serviceName,
                          serviceUrl: p.serviceUrl ?? prev.serviceUrl,
                          routes: p.routes ?? prev.routes,
                        }))
                      }}
                    />
                  )}
                </Question>

                {/* API Identity */}
                <div className="space-y-3 py-5 border-b border-kong-border">
                  <div className="flex items-center gap-3">
                    <div className="w-24 flex-shrink-0">
                      <label className="text-[12px] font-semibold text-kong-text">Name</label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. Payments API"
                      value={s1.apiName}
                      onChange={e => setS({ apiName: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 flex-shrink-0">
                      <label className="text-[12px] font-semibold text-kong-text">Version</label>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. v1"
                      value={s1.apiVersion}
                      onChange={e => setS({ apiVersion: e.target.value })}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                    />
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-24 flex-shrink-0 pt-1.5">
                      <label className="text-[12px] font-semibold text-kong-text">Description</label>
                    </div>
                    <textarea
                      placeholder="Brief description of what this API does"
                      value={s1.apiDescription}
                      onChange={e => setS({ apiDescription: e.target.value })}
                      rows={2}
                      className="flex-1 px-3 py-1.5 rounded border border-kong-border bg-kong-surface text-[13px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors resize-none"
                    />
                  </div>
                </div>
                <Question
                  title="Do you want Kong Gateway to manage this API's traffic?"
                  description="Kong Gateway sits in front of your API and handles authentication, rate limiting, and security policies. You'll connect it to an existing gateway instance or set up a new one."
                  value={s1.wantsGateway}
                  onChange={v => setS({ wantsGateway: v })}
                />
                <Question
                  title="Do you want to publish this API to a Developer Portal?"
                  description="A portal lets other teams or external developers discover your API, read its docs, and request access. We'll walk you through publishing it and setting up access control."
                  value={s1.wantsPortal}
                  onChange={v => setS({ wantsPortal: v })}
                />
              </div>
              <div className="w-px bg-kong-border flex-shrink-0" />
              <div className="w-64 flex-shrink-0 p-5 overflow-y-auto">
                <SetupSummary state={s1} />
              </div>
            </>
          )}

          {/* ── Step 2: Gateway config ── */}
          {step === 2 && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-4 min-w-0 space-y-3">
                {/* Service */}
                <div>
                  <SectionHeader
                    label="Service"
                    hint="A Service is a Kong object that represents your upstream API. It stores the target URL Kong should proxy requests to."
                  />
                  <div className="space-y-3">
                    <FormField
                      label="Name"
                      placeholder="e.g. payments-api-service"
                      value={gw.serviceName}
                      onChange={v => setG({ serviceName: v })}
                      onFocus={() => setActiveField('service')}
                      onBlur={() => setActiveField(null)}
                    />
                    <FormField
                      label="URL"
                      hint="The full URL of your upstream service. Kong will forward matching requests to this address."
                      placeholder="e.g. https://api.internal.meridianbank.com"
                      value={gw.serviceUrl}
                      onChange={v => setG({ serviceUrl: v })}
                      onFocus={() => setActiveField('service')}
                      onBlur={() => setActiveField(null)}
                    />
                  </div>
                </div>

                <div className="border-t border-kong-border" />

                {/* Routes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <SectionHeader
                      label="Routes"
                      hint="A Route defines the rules that match incoming requests — such as the path — and links them to this Service."
                    />
                    <button
                      type="button"
                      onClick={() => setGw(prev => ({ ...prev, routes: [...prev.routes, { name: '', path: '' }] }))}
                      className="flex items-center gap-1 text-[11px] text-kong-teal hover:text-kong-teal/80 transition-colors"
                    >
                      <span className="text-[16px] leading-none">+</span> Add route
                    </button>
                  </div>
                  <table className="w-full table-fixed text-[12px]">
                    <colgroup>
                      <col className="w-1/2" />
                      <col className="w-1/2" />
                      <col style={{ width: 28 }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b border-kong-border">
                        <th className="text-left text-[10px] font-semibold text-kong-text-muted pb-1.5">Name</th>
                        <th className="text-left text-[10px] font-semibold text-kong-text-muted pb-1.5 pl-2">Path</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {gw.routes.map((route, i) => (
                        <tr key={i} className="border-b border-kong-border/50 last:border-0">
                          <td className="py-1.5 pr-2">
                            <input
                              type="text"
                              placeholder="e.g. payments-route"
                              value={route.name}
                              onChange={e => setGw(prev => {
                                const routes = [...prev.routes]
                                routes[i] = { ...routes[i], name: e.target.value }
                                return { ...prev, routes }
                              })}
                              onFocus={() => setActiveField('route')}
                              onBlur={() => setActiveField(null)}
                              className="w-full px-2 py-1 rounded border border-kong-border bg-kong-surface text-[12px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                            />
                          </td>
                          <td className="py-1.5 pl-2">
                            <input
                              type="text"
                              placeholder="e.g. /payments/v1"
                              value={route.path}
                              onChange={e => setGw(prev => {
                                const routes = [...prev.routes]
                                routes[i] = { ...routes[i], path: e.target.value }
                                return { ...prev, routes }
                              })}
                              onFocus={() => setActiveField('route')}
                              onBlur={() => setActiveField(null)}
                              className="w-full px-2 py-1 rounded border border-kong-border bg-kong-surface text-[12px] text-kong-text placeholder:text-kong-text-muted focus:outline-none focus:border-kong-teal/50 focus:ring-1 focus:ring-kong-teal/20 transition-colors"
                            />
                          </td>
                          <td className="py-1.5 pl-2 text-center">
                            {gw.routes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setGw(prev => ({ ...prev, routes: prev.routes.filter((_, j) => j !== i) }))}
                                className="text-kong-text-muted hover:text-red-400 transition-colors"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-kong-border" />

                {/* Control Plane */}
                <ControlPlaneSelect value={controlPlane} onChange={setControlPlane} />
              </div>

              <div className="w-px bg-kong-border flex-shrink-0" />

              {/* Right: diagram */}
              <div className="w-[420px] flex-shrink-0 p-5 overflow-y-auto flex flex-col">
                <GatewayDiagram
                  active={activeField}
                  serviceName={gw.serviceName}
                  routes={gw.routes}
                  controlPlane={controlPlane}
                />
              </div>
            </>
          )}

          {/* ── Step 3: Portal publish ── */}
          {step === 3 && (
            <>
              <div className="flex-1 overflow-y-auto px-6 py-5 min-w-0 space-y-5">
                {/* Pricing notice */}
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-violet-500/10 border border-violet-500/25">
                  <DollarSign size={13} className="text-violet-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[12px] text-violet-300 leading-relaxed">
                    <span className="font-semibold">Pricing:</span> Each published API incurs its own charge. Contact your account team for detailed pricing.
                  </p>
                </div>

                {/* Portal */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <label className="text-[13px] font-semibold text-kong-text">Portal</label>
                  </div>
                  <SimpleSelect value={portal.portalId} onChange={v => setP({ portalId: v })} options={PORTALS} />
                </div>

                {/* Auth strategy */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <label className="text-[13px] font-semibold text-kong-text">Authentication strategy</label>
                  </div>
                  <SimpleSelect value={portal.authStrategy} onChange={v => setP({ authStrategy: v })} options={AUTH_STRATEGIES} />
                </div>

                {/* Visibility */}
                <div>
                  <p className="text-[13px] font-semibold text-kong-text mb-3">API visibility</p>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Public */}
                    <button
                      type="button"
                      onClick={() => setP({ visibility: 'public' })}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors text-center ${
                        portal.visibility === 'public'
                          ? 'border-kong-teal bg-kong-teal/5'
                          : 'border-kong-border bg-transparent hover:border-kong-border-subtle'
                      }`}
                    >
                      <span className={`absolute top-3 left-3 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        portal.visibility === 'public' ? 'border-kong-teal' : 'border-kong-border'
                      }`}>
                        {portal.visibility === 'public' && <span className="w-1.5 h-1.5 rounded-full bg-kong-teal" />}
                      </span>
                      <Globe size={22} className={portal.visibility === 'public' ? 'text-kong-teal' : 'text-kong-text-muted'} />
                      <p className={`text-[13px] font-semibold ${portal.visibility === 'public' ? 'text-kong-teal' : 'text-kong-text'}`}>Public</p>
                      <p className="text-[11px] text-kong-text-secondary leading-relaxed">Anyone on the internet with the link can view this API.</p>
                    </button>

                    {/* Private */}
                    <button
                      type="button"
                      onClick={() => setP({ visibility: 'private' })}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors text-center ${
                        portal.visibility === 'private'
                          ? 'border-kong-teal bg-kong-teal/5'
                          : 'border-kong-border bg-transparent hover:border-kong-border-subtle'
                      }`}
                    >
                      <span className={`absolute top-3 left-3 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                        portal.visibility === 'private' ? 'border-kong-teal' : 'border-kong-border'
                      }`}>
                        {portal.visibility === 'private' && <span className="w-1.5 h-1.5 rounded-full bg-kong-teal" />}
                      </span>
                      <Lock size={22} className={portal.visibility === 'private' ? 'text-kong-teal' : 'text-kong-text-muted'} />
                      <p className={`text-[13px] font-semibold ${portal.visibility === 'private' ? 'text-kong-teal' : 'text-kong-text'}`}>Private</p>
                      <p className="text-[11px] text-kong-text-secondary leading-relaxed">Only authenticated dev portal users can view this API.</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-px bg-kong-border flex-shrink-0" />

              {/* Right: portal preview */}
              <div className="w-[300px] flex-shrink-0 p-5 overflow-y-auto">
                <PortalPreview
                  apiName={s1.apiName}
                  apiVersion={s1.apiVersion}
                  apiDescription={s1.apiDescription}
                  portalId={portal.portalId}
                  authStrategy={portal.authStrategy}
                  visibility={portal.visibility}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-kong-border flex-shrink-0">
          <div>
            {step > 1 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 text-[13px] text-kong-text-secondary hover:text-kong-text transition-colors"
              >
                <ChevronLeft size={14} /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-[13px] text-kong-text-secondary hover:text-kong-text transition-colors">Cancel</button>
            <button
              onClick={handleNext}
              disabled={step === 1 && !step1Valid}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-[13px] font-semibold transition-all ${
                !(step === 1 && !step1Valid)
                  ? 'bg-kong-cta text-[#0d1117] hover:brightness-110'
                  : 'bg-kong-border text-kong-text-muted cursor-not-allowed'
              }`}
            >
              {isLastStep ? (step === 3 ? 'Publish' : 'Save') : 'Next'}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

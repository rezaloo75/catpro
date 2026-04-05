import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import yaml from 'highlight.js/lib/languages/yaml'
import 'highlight.js/styles/github-dark-dimmed.css'
import type { CatalogInterface, GatewayLink } from '../types'

hljs.registerLanguage('yaml', yaml)

function generateKongctlYaml(iface: CatalogInterface, gl: GatewayLink): string {
  const services = gl.objects.filter(o => o.type === 'Service' || o.type === 'AI Service')
  const routes = gl.objects.filter(o => o.type === 'Route' || o.type === 'AI Route')
  const plugins = gl.objects.filter(o => o.type === 'Plugin' || o.type === 'AI Plugin')
  const topics = gl.objects.filter(o => o.type === 'Topic')
  const consumerGroups = gl.objects.filter(o => o.type === 'Consumer Group')
  // modelConnections removed — AI gateway now uses Service/Route/Plugin format

  const tags = iface.tags.slice(0, 3)
  const tagsStr = `[${tags.join(', ')}]`
  const host = iface.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')

  const lines: string[] = ['_format_version: "3.0"', '']

  if (gl.gatewayProductType === 'event') {
    // Event gateway config
    lines.push('event_gateways:')
    lines.push(`  - name: ${gl.gatewayInstanceName}`)
    lines.push(`    cluster: ${gl.controlPlaneName}`)
    lines.push(`    tags: ${tagsStr}`)
    if (topics.length > 0) {
      lines.push('    topics:')
      for (const topic of topics) {
        lines.push(`      - name: ${topic.name}`)
        lines.push(`        partitions: 12`)
        lines.push(`        retention_ms: 604800000`)
        lines.push(`        replication_factor: 3`)
        lines.push(`        tags: ${tagsStr}`)
      }
    }
    if (consumerGroups.length > 0) {
      lines.push('    consumer_groups:')
      for (const cg of consumerGroups) {
        lines.push(`      - name: ${cg.name}`)
        lines.push(`        auto_offset_reset: earliest`)
        lines.push(`        session_timeout_ms: 30000`)
      }
    }
  } else if (gl.gatewayProductType === 'ai') {
    // AI gateway config — Service / Route / Plugin format
    lines.push('services:')
    for (const svc of services) {
      lines.push(`  - name: ${svc.name}`)
      lines.push(`    host: ai-upstream.internal`)
      lines.push(`    port: 443`)
      lines.push(`    protocol: https`)
      lines.push(`    connect_timeout: 30000`)
      lines.push(`    read_timeout: 120000`)
      lines.push(`    write_timeout: 30000`)
      lines.push(`    retries: 2`)
      lines.push(`    tags: ${tagsStr}`)
      if (plugins.length > 0) {
        lines.push('    plugins:')
        for (const plg of plugins) {
          // Plugin name encodes config: "ai-proxy · openai / gpt-4o" or "ai-mcp-proxy · passthrough-listener"
          const [baseName, detail] = plg.name.split(' · ')
          lines.push(`      - name: ${baseName}`)
          lines.push(`        enabled: true`)
          lines.push(`        config:`)
          if (baseName === 'ai-proxy' && detail) {
            const [provider, model] = detail.split(' / ')
            lines.push(`          route_type: llm/v1/chat`)
            lines.push(`          auth:`)
            lines.push(`            header_name: Authorization`)
            lines.push(`            header_value: '{vault://ai-credentials/${provider}}'`)
            lines.push(`          model:`)
            lines.push(`            provider: ${provider}`)
            lines.push(`            name: ${model}`)
          } else if (baseName === 'ai-mcp-proxy' && detail) {
            if (detail === 'passthrough-listener') {
              lines.push(`          listener_mode: passthrough`)
              lines.push(`          upstream: '{upstream-mcp-server-url}'`)
            } else if (detail === 'conversion-listener') {
              lines.push(`          listener_mode: conversion`)
            } else {
              lines.push(`          listener_mode: ${detail}`)
            }
          } else {
            lines.push(`          enabled: true`)
          }
          lines.push(`        tags: ${tagsStr}`)
        }
      }
      if (routes.length > 0) {
        lines.push('    routes:')
        for (const rt of routes) {
          // Route names include HTTP method prefix: "POST /ai/summarize" → strip it
          const routePath = rt.name.replace(/^(GET|POST|PUT|PATCH|DELETE)\s+/, '')
          const routeName = routePath.replace(/^\//, '').replace(/[/*\s]/g, '-').replace(/-+/g, '-')
          lines.push(`      - name: ${routeName}`)
          lines.push(`        methods: [POST]`)
          lines.push(`        paths: ['${routePath}']`)
          lines.push(`        protocols: [https]`)
          lines.push(`        strip_path: false`)
          lines.push(`        tags: ${tagsStr}`)
        }
      }
    }
  } else {
    // API gateway config (REST / Generic)
    lines.push('services:')
    for (const svc of services) {
      lines.push(`  - name: ${svc.name}`)
      lines.push(`    host: ${host}.internal.meridianbank.com`)
      lines.push(`    port: 443`)
      lines.push(`    path: /${svc.name.replace(/-svc$/, '').replace(/-/g, '/')}`)
      lines.push(`    protocol: https`)
      lines.push(`    connect_timeout: 10000`)
      lines.push(`    read_timeout: 30000`)
      lines.push(`    write_timeout: 10000`)
      lines.push(`    retries: 3`)
      lines.push(`    tags: ${tagsStr}`)

      const svcPlugins = plugins.length > 0 ? plugins : []
      if (svcPlugins.length > 0) {
        lines.push('    plugins:')
        for (const plg of svcPlugins) {
          lines.push(`      - name: ${plg.name}`)
          lines.push(`        enabled: true`)
          lines.push('        config:')
          if (plg.name === 'rate-limiting') {
            lines.push(`          minute: 1000`)
            lines.push(`          hour: 50000`)
            lines.push(`          policy: redis`)
            lines.push(`          redis_host: '{vault://infra/redis-host}'`)
          } else if (plg.name === 'oauth2' || plg.name === 'fapi-compliance') {
            lines.push(`          scopes: [read, write]`)
            lines.push(`          mandatory_scope: true`)
            lines.push(`          token_expiration: 3600`)
          } else if (plg.name === 'request-transformer' || plg.name === 'request-transformer-advanced') {
            lines.push('          add:')
            lines.push(`            headers: ['X-Kong-Upstream: true']`)
          } else if (plg.name === 'pii-masking') {
            lines.push(`          mask_fields: [ssn, dateOfBirth, accountNumber]`)
            lines.push(`          mask_character: "*"`)
          } else {
            lines.push(`          enabled: true`)
          }
          lines.push(`        tags: ${tagsStr}`)
        }
      }

      const svcRoutes = routes.length > 0 ? routes : []
      if (svcRoutes.length > 0) {
        lines.push('    routes:')
        for (const rt of svcRoutes) {
          lines.push(`      - name: ${rt.name.replace(/^\//, '').replace(/[/*]/g, '-').replace(/-+/g, '-')}-route`)
          lines.push(`        methods: [GET, POST, PUT, DELETE]`)
          lines.push(`        paths: [${rt.name}]`)
          lines.push(`        protocols: [https]`)
          lines.push(`        strip_path: true`)
          lines.push(`        preserve_host: false`)
          lines.push(`        regex_priority: 0`)
          lines.push(`        tags: ${tagsStr}`)
        }
      }
    }
  }

  return lines.join('\n')
}

interface KongctlConfigViewerProps {
  iface: CatalogInterface
  gatewayLink: GatewayLink
}

export function KongctlConfigViewer({ iface, gatewayLink }: KongctlConfigViewerProps) {
  const codeRef = useRef<HTMLElement>(null)
  const kongctlYaml = generateKongctlYaml(iface, gatewayLink)

  useEffect(() => {
    if (codeRef.current) {
      codeRef.current.removeAttribute('data-highlighted')
      hljs.highlightElement(codeRef.current)
    }
  }, [kongctlYaml])

  return (
    <div className="bg-kong-surface rounded-lg border border-kong-border overflow-hidden">
      <div className="px-4 py-3 border-b border-kong-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-kong-text">Gateway Configuration</h3>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-kong-teal/10 text-kong-teal border border-kong-teal/20">
            kongctl
          </span>
          <span className="text-[11px] text-kong-text-muted">Kong declarative config</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-2.5 py-1 text-[11px] font-medium text-kong-text-secondary bg-white/[0.04] border border-kong-border rounded hover:border-kong-text-secondary transition-colors">
            Copy
          </button>
          <button className="px-2.5 py-1 text-[11px] font-medium text-kong-text-secondary bg-white/[0.04] border border-kong-border rounded hover:border-kong-text-secondary transition-colors">
            Export
          </button>
        </div>
      </div>
      <pre className="p-0 m-0 overflow-x-auto max-h-96 overflow-y-auto">
        <code
          ref={codeRef}
          className="hljs language-yaml !bg-[#0a0e14] !text-[11px] !leading-relaxed block px-4 py-4"
        >
          {kongctlYaml}
        </code>
      </pre>
    </div>
  )
}

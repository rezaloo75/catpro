import { useEffect, useRef } from 'react'
import hljs from 'highlight.js/lib/core'
import yaml from 'highlight.js/lib/languages/yaml'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import 'highlight.js/styles/github-dark-dimmed.css'
import { SpecBadge } from './Pills'
import type { SpecType } from '../types'

hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('json', json)
hljs.registerLanguage('markdown', markdown)

function detectLang(specType: SpecType, snippet: string): string {
  if (specType === 'MCP' || snippet.trimStart().startsWith('{')) return 'json'
  if (specType === 'OpenAPI' || specType === 'AsyncAPI') return 'yaml'
  return 'markdown'
}

interface SpecViewerProps {
  specType: SpecType
  specSnippet?: string
}

export function SpecViewer({ specType, specSnippet }: SpecViewerProps) {
  const codeRef = useRef<HTMLElement>(null)
  const isGeneric = specType === 'Unknown'

  useEffect(() => {
    if (codeRef.current && specSnippet) {
      codeRef.current.removeAttribute('data-highlighted')
      hljs.highlightElement(codeRef.current)
    }
  }, [specSnippet])

  const specLabel =
    specType === 'OpenAPI' ? 'OpenAPI 3.0' :
    specType === 'AsyncAPI' ? 'AsyncAPI 2.6' :
    specType === 'MCP' ? 'Model Context Protocol' :
    'No Formal Specification'

  return (
    <div className="bg-kong-surface rounded-lg border border-kong-border overflow-hidden">
      <div className="px-4 py-3 border-b border-kong-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-kong-text">Specification</h3>
          <SpecBadge specType={specType} />
          <span className="text-[11px] text-kong-text-muted">{specLabel}</span>
        </div>
        {!isGeneric && specSnippet && (
          <div className="flex items-center gap-2">
            <button className="px-2.5 py-1 text-[11px] font-medium text-kong-text-secondary bg-white/[0.04] border border-kong-border rounded hover:border-kong-text-secondary transition-colors">
              Download
            </button>
            <button className="px-2.5 py-1 text-[11px] font-medium text-kong-text-secondary bg-white/[0.04] border border-kong-border rounded hover:border-kong-text-secondary transition-colors">
              View Raw
            </button>
          </div>
        )}
      </div>

      {isGeneric && (
        <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/10 flex items-center gap-3">
          <span className="text-[11px] text-amber-400 font-medium">Inferred metadata</span>
          <span className="text-[10px] text-amber-400/70">
            Confidence: {specSnippet?.includes('High') ? 'High' : specSnippet?.includes('Medium') ? 'Medium' : 'Low'}
          </span>
          <button className="text-[11px] font-medium text-amber-400 underline hover:text-amber-300 ml-auto">
            Suggest Classification
          </button>
        </div>
      )}

      {specSnippet ? (
        <pre className="p-0 m-0 overflow-x-auto max-h-72 overflow-y-auto">
          <code
            ref={codeRef}
            className={`hljs language-${detectLang(specType, specSnippet)} !bg-[#0a0e14] !text-[11px] !leading-relaxed block px-4 py-4`}
          >
            {specSnippet}
          </code>
        </pre>
      ) : (
        <div className="px-4 py-8 text-center text-[12px] text-kong-text-muted">
          No specification available for this interface.
        </div>
      )}
    </div>
  )
}

import type { LLMProvider } from '../types'

const providerMeta: Record<LLMProvider, { label: string; bg: string; textColor: string }> = {
  openai: { label: 'OpenAI', bg: 'bg-[#10a37f]', textColor: 'text-white' },
  anthropic: { label: 'Anthropic', bg: 'bg-[#d4a27f]', textColor: 'text-[#1a1108]' },
  mistral: { label: 'Mistral', bg: 'bg-[#f54e00]', textColor: 'text-white' },
  google: { label: 'Gemini', bg: 'bg-[#4285f4]', textColor: 'text-white' },
  meta: { label: 'Llama', bg: 'bg-[#0668E1]', textColor: 'text-white' },
  cohere: { label: 'Cohere', bg: 'bg-[#39594d]', textColor: 'text-white' },
}

function OpenAILogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M22.28 9.37a5.99 5.99 0 00-.52-4.93 6.07 6.07 0 00-6.55-2.91A5.99 5.99 0 0010.69.01a6.07 6.07 0 00-5.8 4.22 5.99 5.99 0 00-4 2.91 6.07 6.07 0 00.75 7.12 5.99 5.99 0 00.52 4.93 6.07 6.07 0 006.55 2.91 5.99 5.99 0 004.52 1.52 6.07 6.07 0 005.8-4.22 5.99 5.99 0 004-2.91 6.07 6.07 0 00-.75-7.12zM13.21 22.14a4.5 4.5 0 01-2.89-1.05l.14-.08 4.8-2.77a.78.78 0 00.39-.68v-6.77l2.03 1.17a.07.07 0 01.04.05v5.6a4.52 4.52 0 01-4.51 4.53zM3.57 18.09a4.5 4.5 0 01-.54-3.03l.14.09 4.8 2.77a.78.78 0 00.78 0l5.86-3.38v2.34a.07.07 0 01-.03.06l-4.85 2.8a4.52 4.52 0 01-6.16-1.65zM2.2 7.87a4.5 4.5 0 012.36-1.98v5.71a.78.78 0 00.39.68l5.86 3.38-2.03 1.17a.07.07 0 01-.07 0l-4.85-2.8A4.52 4.52 0 012.2 7.87zm17.39 4.05l-5.86-3.38 2.03-1.17a.07.07 0 01.07 0l4.85 2.8a4.52 4.52 0 01-.7 8.14v-5.71a.78.78 0 00-.39-.68zm2.02-3.05l-.14-.09-4.8-2.77a.78.78 0 00-.78 0l-5.86 3.38V7.05a.07.07 0 01.03-.06l4.85-2.8a4.52 4.52 0 016.7 4.68zM9.37 13.43l-2.03-1.17a.07.07 0 01-.04-.06v-5.6a4.52 4.52 0 017.4-3.48l-.14.08-4.8 2.77a.78.78 0 00-.39.68v6.78zm1.1-2.38l2.61-1.51 2.61 1.51v3.01l-2.61 1.51-2.61-1.51v-3.01z" fill="currentColor"/>
    </svg>
  )
}

function AnthropicLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13.83 3h3.02L22 21h-3.02l-5.15-18zm-6.68 0H4.13L10.19 21h3.02L7.15 3zM9.3 13.5h5.4l1.23 3.6h-7.86l1.23-3.6z" fill="currentColor" />
    </svg>
  )
}

function MistralLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="2" width="5" height="5" fill="currentColor"/>
      <rect x="17" y="2" width="5" height="5" fill="currentColor"/>
      <rect x="2" y="9.5" width="5" height="5" fill="currentColor"/>
      <rect x="9.5" y="9.5" width="5" height="5" fill="currentColor"/>
      <rect x="17" y="9.5" width="5" height="5" fill="currentColor"/>
      <rect x="2" y="17" width="5" height="5" fill="currentColor"/>
      <rect x="17" y="17" width="5" height="5" fill="currentColor"/>
    </svg>
  )
}

function GeminiLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C12 7.52 7.52 12 2 12c5.52 0 10 4.48 10 10 0-5.52 4.48-10 10-10-5.52 0-10-4.48-10-10z" fill="currentColor"/>
    </svg>
  )
}

function LlamaLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3C8 3 6 6 6 9c0 2 .5 3 1 4v5a1 1 0 001 1h1v-3c0-1 1-2 3-2s3 1 3 2v3h1a1 1 0 001-1v-5c.5-1 1-2 1-4 0-3-2-6-6-6z" fill="currentColor"/>
      <circle cx="10" cy="8" r="1" fill="currentColor" opacity="0.4"/>
      <circle cx="14" cy="8" r="1" fill="currentColor" opacity="0.4"/>
    </svg>
  )
}

function CohereLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 4a8 8 0 00-5.3 14c1.4-1.7 3.3-2.5 5.3-2.5s3.9.8 5.3 2.5A8 8 0 0012 4z" fill="currentColor"/>
      <circle cx="12" cy="10" r="3" fill="currentColor" opacity="0.5"/>
    </svg>
  )
}

function ProviderIcon({ provider, size }: { provider: LLMProvider; size: number }) {
  switch (provider) {
    case 'openai': return <OpenAILogo size={size} />
    case 'anthropic': return <AnthropicLogo size={size} />
    case 'mistral': return <MistralLogo size={size} />
    case 'google': return <GeminiLogo size={size} />
    case 'meta': return <LlamaLogo size={size} />
    case 'cohere': return <CohereLogo size={size} />
  }
}

export function LLMProviderBadge({ provider, size = 'sm' }: { provider: LLMProvider; size?: 'sm' | 'md' }) {
  const meta = providerMeta[provider]
  const iconSize = size === 'sm' ? 11 : 14
  const px = size === 'sm' ? 'px-1.5 py-0.5 gap-1' : 'px-2 py-1 gap-1.5'
  const text = size === 'sm' ? 'text-[10px]' : 'text-[11px]'

  return (
    <span className={`inline-flex items-center rounded-md font-semibold ${px} ${text} ${meta.bg} ${meta.textColor}`}>
      <ProviderIcon provider={provider} size={iconSize} />
      {meta.label}
    </span>
  )
}

export function LLMProviderIcon({ provider, size = 16 }: { provider: LLMProvider; size?: number }) {
  const meta = providerMeta[provider]
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md ${meta.bg} ${meta.textColor}`}
      style={{ width: size + 6, height: size + 6 }}
      title={meta.label}
    >
      <ProviderIcon provider={provider} size={size} />
    </span>
  )
}

import { type ReactNode, useState } from 'react'

export function Tooltip({ children, content }: { children: ReactNode; content: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 text-[11px] text-kong-text bg-kong-surface-raised rounded shadow-lg border border-kong-border whitespace-nowrap max-w-xs">
          {content}
        </span>
      )}
    </span>
  )
}

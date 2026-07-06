import { useEffect, useRef, useState } from 'react'
import type { Stats } from '../types'

export type ExportFormat = 'txt' | 'html' | 'md' | 'copy'

interface Props {
  title: string
  onTitle: (t: string) => void
  stats: Stats
  onHome: () => void
  onClear: () => void
  onSample: () => void
  onExport: (format: ExportFormat) => void
  onOpenSettings: () => void
  dark: boolean
  onToggleTheme: () => void
}

export default function Topbar({ title, onTitle, stats, onHome, onClear, onSample, onExport, onOpenSettings, dark, onToggleTheme }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const pick = (format: ExportFormat) => {
    onExport(format)
    setMenuOpen(false)
    if (format === 'copy') {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-100 bg-white px-4">
      {/* Home / brand */}
      <button
        onClick={onHome}
        title="Back to my documents"
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-ink-50"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-violetish-500 text-white shadow-sm">
          <svg width="18" height="18" viewBox="0 0 32 32">
            <path d="M9 21.5 L16 8 L23 21.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.6 16.5 H20.4" stroke="#c7d2fe" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-[15px] font-700 tracking-tight text-ink-900" style={{ fontWeight: 700 }}>
          StratWrite
        </span>
      </button>

      <div className="mx-1 h-6 w-px bg-ink-100" />

      {/* Document title */}
      <input
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="Untitled document"
        className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-[14px] font-500 text-ink-700 outline-none placeholder:text-ink-300 hover:bg-ink-50 focus:bg-ink-50"
      />

      {/* Saved indicator */}
      <span className="hidden items-center gap-1 text-[12px] text-ink-400 md:flex">
        <svg width="14" height="14" viewBox="0 0 24 24" className="text-brand-500">
          <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Saved
      </span>

      {/* Live word count */}
      <div className="hidden items-center gap-1.5 text-[12.5px] text-ink-400 sm:flex">
        <span className="font-600 text-ink-600">{stats.words}</span> words
      </div>

      <div className="mx-1 h-6 w-px bg-ink-100" />

      <button
        onClick={onSample}
        className="rounded-lg px-2.5 py-1.5 text-[13px] font-600 text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-700"
      >
        Try sample
      </button>
      <button
        onClick={onClear}
        className="rounded-lg px-2.5 py-1.5 text-[13px] font-600 text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-700"
      >
        Clear
      </button>

      <button
        onClick={onToggleTheme}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Light mode' : 'Dark mode'}
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
      >
        <ThemeIcon dark={dark} />
      </button>

      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink-800"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7.7 1.6 1.6 0 01-3.2 0 1.6 1.6 0 00-2.7-.7l-.1.1A2 2 0 114 16.9l.1-.1a1.6 1.6 0 00-.7-2.7 1.6 1.6 0 010-3.2 1.6 1.6 0 00.7-2.7L4 8.1A2 2 0 116.9 5.3l.1.1a1.6 1.6 0 001.8.3 1.6 1.6 0 001-1.5 1.6 1.6 0 013.2 0 1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1A2 2 0 1120 8.1l-.1.1a1.6 1.6 0 00-.3 1.8 1.6 1.6 0 001.5 1 1.6 1.6 0 010 3.2 1.6 1.6 0 00-1.5 1z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Download / export menu */}
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-expanded={menuOpen}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-violetish-500 px-3 py-1.5 text-[13px] font-600 text-white shadow-sm transition-all hover:from-brand-700 hover:to-violetish-600"
        >
          <svg width="15" height="15" viewBox="0 0 24 24">
            <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {copied ? 'Copied!' : 'Download'}
        </button>
        {menuOpen && (
          <div className="animate-pop absolute right-0 top-10 z-30 w-52 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-pop">
            <MenuItem label="Plain text" hint=".txt" onClick={() => pick('txt')} />
            <MenuItem label="HTML document" hint=".html" onClick={() => pick('html')} />
            <MenuItem label="Markdown" hint=".md" onClick={() => pick('md')} />
            <div className="my-1 h-px bg-ink-100" />
            <MenuItem label="Copy text to clipboard" onClick={() => pick('copy')} />
          </div>
        )}
      </div>
    </header>
  )
}

export function ThemeIcon({ dark }: { dark: boolean }) {
  return dark ? (
    // Sun (click to go light)
    <svg width="18" height="18" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ) : (
    // Moon (click to go dark)
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function MenuItem({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[13.5px] text-ink-700 transition-colors hover:bg-ink-50"
    >
      <span>{label}</span>
      {hint && <span className="text-[12px] text-ink-400">{hint}</span>}
    </button>
  )
}

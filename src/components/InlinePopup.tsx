import { useState } from 'react'
import type { Suggestion } from '../types'
import { CATEGORY_META } from '../types'
import { explanationFor } from '../lib/explanations'

interface Props {
  suggestion: Suggestion
  rect: DOMRect
  onApply: (replacement: string) => void
  onDismiss: () => void
  onAddToDictionary: (word: string) => void
  onClose: () => void
}

const HEADERS: Record<string, string> = {
  correctness: 'Fix a mistake',
  clarity: 'Make it clearer',
  engagement: 'Make it stronger',
  delivery: 'Refine your delivery',
}

const WIDTH = 288

export default function InlinePopup({ suggestion, rect, onApply, onDismiss, onAddToDictionary, onClose }: Props) {
  const [showLearn, setShowLearn] = useState(false)
  const meta = CATEGORY_META[suggestion.category]
  const isSpelling = suggestion.rule === 'Spelling'
  const hasFix = suggestion.replacements.length > 0
  const explanation = explanationFor(suggestion.rule)
  const header = isSpelling ? 'Correct your spelling' : HEADERS[suggestion.category]

  // Position: below the word, clamped to the viewport.
  let left = Math.min(rect.left, window.innerWidth - WIDTH - 14)
  left = Math.max(14, left)
  const estHeight = 200
  let top = rect.bottom + 8
  if (top + estHeight > window.innerHeight) top = Math.max(12, rect.top - estHeight - 4)

  return (
    <div
      className="animate-pop fixed z-50 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-pop"
      style={{ left, top, width: WIDTH }}
    >
      {/* Category accent bar — distinct StratWrite touch */}
      <div className="h-1 w-full" style={{ background: meta.color }} />

      <div className="p-3.5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
          <span className="text-[11px] font-700 uppercase tracking-wide" style={{ color: meta.color }}>
            {header}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-auto grid h-6 w-6 place-items-center rounded-md text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
          >
            <svg width="14" height="14" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Original → suggestion */}
        {hasFix ? (
          <div className="mt-2.5">
            {suggestion.replacements.map((rep, i) => (
              <button
                key={i}
                onClick={() => onApply(rep)}
                className="group flex w-full items-center gap-2 rounded-xl border border-ink-100 px-3 py-2 text-left transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="text-[19px] font-700 text-brand-700" style={{ fontWeight: 700 }}>
                  {rep === '' ? 'Remove' : rep}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" className="ml-auto text-ink-300 transition-colors group-hover:text-brand-500">
                  <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-[13px] leading-snug text-ink-600">{suggestion.message}</p>
        )}

        {/* Actions */}
        <div className="mt-3 space-y-0.5 border-t border-ink-50 pt-2">
          {isSpelling && (
            <ActionRow onClick={() => onAddToDictionary(suggestion.original)} icon={<AddIcon />}>
              Add to dictionary
            </ActionRow>
          )}
          <ActionRow onClick={onDismiss} icon={<DismissIcon />}>
            Dismiss
          </ActionRow>
          {explanation && (
            <ActionRow onClick={() => setShowLearn((s) => !s)} icon={<InfoIcon />}>
              {showLearn ? 'Hide explanation' : 'Learn more'}
            </ActionRow>
          )}
        </div>

        {showLearn && explanation && (
          <p className="mt-2 rounded-lg bg-ink-50 p-2.5 text-[12px] leading-relaxed text-ink-600">{explanation}</p>
        )}
      </div>

      {/* StratWrite-branded footer (our brand, not a competitor's) */}
      <div className="flex items-center gap-1.5 border-t border-ink-100 bg-ink-50/60 px-3.5 py-2">
        <span className="grid h-4 w-4 place-items-center rounded bg-brand-600">
          <svg width="10" height="10" viewBox="0 0 32 32">
            <path d="M9 21.5 L16 8 L23 21.5" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11.6 16.5 H20.4" stroke="#c7d2fe" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          </svg>
        </span>
        <span className="text-[11px] font-600 text-ink-400">Checked by StratWrite</span>
      </div>
    </div>
  )
}

function ActionRow({ onClick, icon, children }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] font-500 text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-800"
    >
      <span className="text-ink-400">{icon}</span>
      {children}
    </button>
  )
}

function AddIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path d="M5 7h9M5 12h9M5 17h5M17 13v6M14 16h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function DismissIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 12h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}
function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 11v5M12 8v.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

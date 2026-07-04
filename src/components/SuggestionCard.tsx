import { useState } from 'react'
import type { Suggestion } from '../types'
import { CATEGORY_META } from '../types'
import { explanationFor } from '../lib/explanations'

interface Props {
  suggestion: Suggestion
  active: boolean
  index: number
  total: number
  onActivate: () => void
  onApply: (replacement: string) => void
  onDismiss: () => void
  onAddToDictionary: (word: string) => void
  onPrev: () => void
  onNext: () => void
}

export default function SuggestionCard({
  suggestion,
  active,
  index,
  total,
  onActivate,
  onApply,
  onDismiss,
  onAddToDictionary,
  onPrev,
  onNext,
}: Props) {
  const [showLearn, setShowLearn] = useState(false)
  const meta = CATEGORY_META[suggestion.category]
  const hasFix = suggestion.replacements.length > 0
  const isSpelling = suggestion.rule === 'Spelling'
  const explanation = explanationFor(suggestion.rule)

  return (
    <div
      onClick={onActivate}
      className={`animate-pop cursor-pointer rounded-xl border bg-white p-3.5 shadow-card transition-all ${
        active ? 'border-ink-300 shadow-pop ring-1 ring-ink-200' : 'border-ink-100 hover:border-ink-200'
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: meta.color }} />
        <span className="text-[11px] font-600 uppercase tracking-wide" style={{ color: meta.color }}>
          {meta.label}
        </span>
        <span className="text-[11px] text-ink-300">·</span>
        <span className="text-[11px] font-500 text-ink-500">{suggestion.rule}</span>
        {active && (
          <span className="ml-auto text-[11px] font-500 text-ink-400">
            {index} of {total}
          </span>
        )}
      </div>

      <p className="mt-2 text-[13.5px] leading-snug text-ink-700">{suggestion.message}</p>

      {hasFix && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[13px]">
          <span className="rounded-md bg-ink-50 px-1.5 py-0.5 text-ink-400 line-through decoration-ink-300">
            {suggestion.original || '␣'}
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" className="text-ink-300">
            <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {active && (
        <>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {suggestion.replacements.map((rep, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  onApply(rep)
                }}
                className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-[13px] font-600 text-white shadow-sm transition-colors hover:bg-brand-700"
              >
                {rep === '' ? 'Remove' : rep}
              </button>
            ))}
          </div>

          {/* Actions row */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-ink-50 pt-2.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDismiss()
              }}
              className="text-[12.5px] font-600 text-ink-500 transition-colors hover:text-ink-700"
            >
              Dismiss
            </button>
            {isSpelling && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToDictionary(suggestion.original)
                }}
                className="text-[12.5px] font-600 text-ink-500 transition-colors hover:text-ink-700"
              >
                Add to dictionary
              </button>
            )}
            {explanation && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowLearn((s) => !s)
                }}
                className="text-[12.5px] font-600 text-brand-600 transition-colors hover:text-brand-700"
              >
                {showLearn ? 'Hide' : 'Learn more'}
              </button>
            )}

            {/* Prev / next navigation */}
            <div className="ml-auto flex items-center gap-1">
              <NavBtn
                label="Previous suggestion"
                disabled={index <= 1}
                onClick={(e) => {
                  e.stopPropagation()
                  onPrev()
                }}
                dir="prev"
              />
              <NavBtn
                label="Next suggestion"
                disabled={index >= total}
                onClick={(e) => {
                  e.stopPropagation()
                  onNext()
                }}
                dir="next"
              />
            </div>
          </div>

          {showLearn && explanation && (
            <p className="mt-2.5 rounded-lg bg-ink-50 p-2.5 text-[12.5px] leading-relaxed text-ink-600">
              {explanation}
            </p>
          )}
        </>
      )}

      {!active && hasFix && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onApply(suggestion.replacements[0])
          }}
          className="mt-1 text-[13px] font-600 text-brand-600 hover:text-brand-700"
        >
          {suggestion.replacements[0] === '' ? 'Remove' : `Accept “${suggestion.replacements[0]}”`}
        </button>
      )}
    </div>
  )
}

function NavBtn({
  label,
  disabled,
  onClick,
  dir,
}: {
  label: string
  disabled: boolean
  onClick: (e: React.MouseEvent) => void
  dir: 'prev' | 'next'
}) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded-md text-ink-500 transition-colors enabled:hover:bg-ink-100 disabled:cursor-not-allowed disabled:text-ink-200"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" className={dir === 'prev' ? '' : 'rotate-180'}>
        <path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { CheckResult, Category, Suggestion } from '../types'
import { CATEGORY_META } from '../types'
import type { ToneResult } from '../lib/tone'
import ScoreRing from './ScoreRing'
import SuggestionCard from './SuggestionCard'
import GoalsPanel, { type Goals } from './GoalsPanel'
import ToneTab from './ToneTab'
import AIPanel from './AIPanel'

type Tab = 'suggestions' | 'tone' | 'goals' | 'assistant'
type Filter = Category | 'all'

interface Props {
  result: CheckResult
  visible: Suggestion[]
  activeId: string | null
  goals: Goals
  tone: ToneResult
  showTone?: boolean
  onGoals: (g: Goals) => void
  onActivate: (id: string | null) => void
  onApply: (s: Suggestion, replacement: string) => void
  onDismiss: (s: Suggestion) => void
  onAddToDictionary: (word: string) => void
}

export default function Sidebar({
  result,
  visible,
  activeId,
  goals,
  tone,
  showTone = true,
  onGoals,
  onActivate,
  onApply,
  onDismiss,
  onAddToDictionary,
}: Props) {
  const [rawTab, setTab] = useState<Tab>('suggestions')
  const tab: Tab = rawTab === 'tone' && !showTone ? 'suggestions' : rawTab
  const [filter, setFilter] = useState<Filter>('all')

  const total = visible.length
  const shown = filter === 'all' ? visible : visible.filter((s) => s.category === filter)

  // After an accept/dismiss, re-activate the suggestion that slides into the
  // same position, so the user can keep fixing without re-clicking.
  const pendingIndex = useRef<number | null>(null)
  const shownKey = shown.map((s) => s.id).join(',')
  useEffect(() => {
    if (pendingIndex.current === null) return
    const i = pendingIndex.current
    pendingIndex.current = null
    if (shown.length === 0) {
      onActivate(null)
    } else {
      onActivate(shown[Math.min(i, shown.length - 1)].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKey])

  const applyAndAdvance = (s: Suggestion, rep: string) => {
    pendingIndex.current = shown.findIndex((x) => x.id === s.id)
    onApply(s, rep)
  }
  const dismissAndAdvance = (s: Suggestion) => {
    pendingIndex.current = shown.findIndex((x) => x.id === s.id)
    onDismiss(s)
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: 'suggestions', label: 'Review', badge: total },
    ...(showTone ? [{ id: 'tone' as Tab, label: 'Tone' }] : []),
    { id: 'goals', label: 'Goals' },
    { id: 'assistant', label: 'AI' },
  ]

  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-l border-ink-100 bg-ink-50/40 lg:w-[360px] xl:w-[384px]">
      {/* Score header */}
      <div className="border-b border-ink-100 bg-white px-4 py-4">
        <div className="flex items-center gap-4">
          <ScoreRing score={result.score} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-600 text-ink-800">
                {total === 0 ? 'Looks great!' : `${total} suggestion${total === 1 ? '' : 's'}`}
              </span>
              {showTone && (
                <button
                  onClick={() => setTab('tone')}
                  title="View tone details"
                  className="ml-auto inline-flex items-center gap-1 rounded-full bg-ink-50 px-2 py-0.5 text-[11.5px] font-600 text-ink-600 transition-colors hover:bg-ink-100"
                >
                  <span>{tone.tones[0].emoji}</span>
                  <span>{tone.tones[0].label}</span>
                </button>
              )}
            </div>
            <div className="mt-2 space-y-1.5">
              {result.categoryScores.map((cs) => (
                <button
                  key={cs.category}
                  onClick={() => {
                    setTab('suggestions')
                    setFilter(filter === cs.category ? 'all' : cs.category)
                  }}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: CATEGORY_META[cs.category].color }}
                  />
                  <span className="text-[12px] text-ink-600">{cs.label}</span>
                  <span className="ml-auto text-[12px] font-600 text-ink-800">{cs.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-ink-100 bg-white px-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex-1 px-3 py-2.5 text-[13px] font-600 transition-colors ${
              tab === t.id ? 'text-brand-700' : 'text-ink-400 hover:text-ink-600'
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {t.label}
              {t.badge ? (
                <span className="rounded-full bg-ink-100 px-1.5 text-[11px] text-ink-600">{t.badge}</span>
              ) : null}
            </span>
            {tab === t.id && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600" />}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'suggestions' && (
          <div className="p-4">
            {/* Filter chips */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              <Chip active={filter === 'all'} onClick={() => setFilter('all')} label="All" count={total} />
              {result.categoryScores
                .filter((cs) => cs.count > 0)
                .map((cs) => (
                  <Chip
                    key={cs.category}
                    active={filter === cs.category}
                    onClick={() => setFilter(filter === cs.category ? 'all' : cs.category)}
                    label={cs.label}
                    count={cs.count}
                    color={CATEGORY_META[cs.category].color}
                  />
                ))}
            </div>

            {shown.length === 0 ? (
              <div className="mt-10 flex flex-col items-center text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-2xl">✓</div>
                <p className="mt-3 text-[14px] font-600 text-ink-700">Nothing to fix here</p>
                <p className="mt-1 text-[12.5px] text-ink-400">
                  {total === 0 ? 'Your text is clean. Keep writing!' : 'No suggestions in this category.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {shown.map((s, i) => (
                  <SuggestionCard
                    key={s.id}
                    suggestion={s}
                    active={s.id === activeId}
                    index={i + 1}
                    total={shown.length}
                    onActivate={() => onActivate(s.id === activeId ? null : s.id)}
                    onApply={(rep) => applyAndAdvance(s, rep)}
                    onDismiss={() => dismissAndAdvance(s)}
                    onAddToDictionary={onAddToDictionary}
                    onPrev={() => onActivate(shown[i - 1]?.id ?? null)}
                    onNext={() => onActivate(shown[i + 1]?.id ?? null)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'tone' && <ToneTab tone={tone} goals={goals} />}
        {tab === 'goals' && <GoalsPanel goals={goals} onChange={onGoals} stats={result.stats} />}
        {tab === 'assistant' && <AIPanel />}
      </div>
    </aside>
  )
}

function Chip({
  active,
  onClick,
  label,
  count,
  color,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-500 transition-colors ${
        active ? 'border-ink-300 bg-white text-ink-800 shadow-sm' : 'border-transparent bg-ink-100/70 text-ink-500 hover:bg-ink-100'
      }`}
    >
      {color && <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />}
      {label}
      <span className="text-ink-400">{count}</span>
    </button>
  )
}

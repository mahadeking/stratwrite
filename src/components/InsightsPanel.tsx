import { useMemo } from 'react'
import type { Stats } from '../types'
import { computeInsights } from '../lib/insights'

interface Props {
  stats: Stats
  text: string
}

function fmtTime(sec: number) {
  if (sec <= 0) return '0s'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? `${m}m ${s}s` : `${s}s`
}

function easeColor(ease: number) {
  if (ease >= 70) return '#12a150'
  if (ease >= 50) return '#d9820b'
  return '#e5484d'
}

function gradeHint(g: number) {
  if (g <= 6) return 'Easy for most readers'
  if (g <= 9) return 'Plain English — general audience'
  if (g <= 12) return 'High-school level'
  if (g <= 15) return 'College level'
  return 'Graduate level — quite complex'
}

function Tile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white px-3 py-2.5">
      <div className="text-lg font-700 text-ink-900" style={{ fontWeight: 700 }}>
        {value}
      </div>
      <div className="text-[11px] font-500 uppercase tracking-wide text-ink-400">{label}</div>
    </div>
  )
}

export default function InsightsPanel({ stats, text }: Props) {
  const ins = useMemo(() => computeInsights(text), [text])

  if (stats.words === 0) {
    return (
      <div className="mt-10 flex flex-col items-center p-4 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-2xl">📊</div>
        <p className="mt-3 text-[14px] font-600 text-ink-700">No insights yet</p>
        <p className="mt-1 text-[12.5px] text-ink-400">Start writing to see your document’s stats.</p>
      </div>
    )
  }

  const ease = stats.fleschReadingEase
  const diversityPct = Math.round(ins.lexicalDiversity * 100)
  const maxOverused = ins.overused[0]?.count ?? 1

  return (
    <div className="space-y-6 p-4">
      {/* Time to read / speak */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-brand-50 to-violetish-400/15 px-3 py-3">
          <div className="text-[11px] font-600 uppercase tracking-wide text-brand-700">Read time</div>
          <div className="mt-0.5 text-xl font-700 text-ink-900" style={{ fontWeight: 700 }}>
            {fmtTime(stats.readingTimeSec)}
          </div>
        </div>
        <div className="rounded-xl border border-ink-100 bg-white px-3 py-3">
          <div className="text-[11px] font-600 uppercase tracking-wide text-ink-400">Speak time</div>
          <div className="mt-0.5 text-xl font-700 text-ink-900" style={{ fontWeight: 700 }}>
            {fmtTime(stats.speakingTimeSec)}
          </div>
        </div>
      </div>

      {/* Core counts */}
      <div>
        <h3 className="mb-2 text-sm font-700 text-ink-900" style={{ fontWeight: 700 }}>
          Overview
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Tile value={stats.words} label="Words" />
          <Tile value={ins.uniqueWords} label="Unique words" />
          <Tile value={stats.sentences} label="Sentences" />
          <Tile value={stats.paragraphs} label="Paragraphs" />
          <Tile value={stats.avgWordsPerSentence} label="Avg / sentence" />
          <Tile value={ins.avgWordLength.toFixed(1)} label="Avg word length" />
        </div>
      </div>

      {/* Readability */}
      <div>
        <h3 className="mb-2 text-sm font-700 text-ink-900" style={{ fontWeight: 700 }}>
          Readability
        </h3>
        <div className="rounded-lg border border-ink-100 bg-white px-3 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] font-500 text-ink-600">Flesch reading ease</span>
            <span className="text-[13px] font-700" style={{ color: easeColor(ease) }}>
              {ease}/100
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${ease}%`, background: easeColor(ease) }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11.5px] text-ink-400">
            <span>{stats.readabilityLabel}</span>
            <span>Grade {stats.gradeLevel} · {gradeHint(stats.gradeLevel)}</span>
          </div>
        </div>
      </div>

      {/* Vocabulary variety */}
      <div>
        <h3 className="mb-2 text-sm font-700 text-ink-900" style={{ fontWeight: 700 }}>
          Vocabulary variety
        </h3>
        <div className="rounded-lg border border-ink-100 bg-white px-3 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[12.5px] font-500 text-ink-600">Unique-word ratio</span>
            <span className="text-[13px] font-700 text-ink-900">{diversityPct}%</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-violetish-500 transition-all"
              style={{ width: `${diversityPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11.5px] text-ink-400">
            {ins.uniqueWords} distinct of {ins.totalWords} words. Higher means more varied wording.
          </p>
        </div>
      </div>

      {/* Most-used words */}
      <div>
        <h3 className="mb-2 text-sm font-700 text-ink-900" style={{ fontWeight: 700 }}>
          Most-used words
        </h3>
        {ins.overused.length === 0 ? (
          <p className="rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-[12.5px] text-ink-400">
            No word is repeated three or more times — nicely varied.
          </p>
        ) : (
          <div className="space-y-1.5">
            {ins.overused.map((w) => (
              <div key={w.word} className="flex items-center gap-2">
                <span className="w-24 shrink-0 truncate text-[12.5px] font-500 text-ink-700">{w.word}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brand-400"
                    style={{ width: `${Math.round((w.count / maxOverused) * 100)}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-[12px] font-600 text-ink-500">{w.count}×</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Writing signals */}
      {(ins.longSentenceCount > 0 || ins.adverbCount > 0) && (
        <div>
          <h3 className="mb-2 text-sm font-700 text-ink-900" style={{ fontWeight: 700 }}>
            Signals
          </h3>
          <div className="space-y-1.5 text-[12.5px]">
            {ins.longSentenceCount > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-ink-700">
                {ins.longSentenceCount} long sentence{ins.longSentenceCount === 1 ? '' : 's'} (30+ words).
                The longest has {ins.longestSentenceWords} — consider splitting for readability.
              </div>
            )}
            {ins.adverbCount > 0 && (
              <div className="rounded-lg border border-ink-100 bg-white px-3 py-2 text-ink-600">
                {ins.adverbCount} “-ly” adverb{ins.adverbCount === 1 ? '' : 's'}. Strong verbs often read
                tighter than adverbs.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

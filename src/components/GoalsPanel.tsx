import type { Stats } from '../types'

export interface Goals {
  audience: string
  formality: string
  intent: string
  domain: string
}

const OPTIONS: Record<keyof Goals, { label: string; values: string[] }> = {
  audience: { label: 'Audience', values: ['General', 'Knowledgeable', 'Expert'] },
  formality: { label: 'Formality', values: ['Informal', 'Neutral', 'Formal'] },
  intent: { label: 'Intent', values: ['Inform', 'Describe', 'Convince', 'Tell a story'] },
  domain: { label: 'Domain', values: ['General', 'Academic', 'Business', 'Casual', 'Creative'] },
}

interface Props {
  goals: Goals
  onChange: (g: Goals) => void
  stats: Stats
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-white px-3 py-2.5">
      <div className="text-lg font-700 text-ink-900" style={{ fontWeight: 700 }}>
        {value}
      </div>
      <div className="text-[11px] font-500 uppercase tracking-wide text-ink-400">{label}</div>
    </div>
  )
}

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? `${m}m ${s}s` : `${s}s`
}

export default function GoalsPanel({ goals, onChange, stats }: Props) {
  return (
    <div className="space-y-6 p-4">
      <div>
        <h3 className="mb-1 text-sm font-700 text-ink-900" style={{ fontWeight: 700 }}>
          Set your goals
        </h3>
        <p className="mb-3 text-[12.5px] text-ink-500">
          Tune suggestions to your audience and purpose.
        </p>
        <div className="space-y-4">
          {(Object.keys(OPTIONS) as (keyof Goals)[]).map((key) => (
            <div key={key}>
              <label className="mb-1.5 block text-[12px] font-600 uppercase tracking-wide text-ink-400">
                {OPTIONS[key].label}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {OPTIONS[key].values.map((v) => {
                  const selected = goals[key] === v
                  return (
                    <button
                      key={v}
                      onClick={() => onChange({ ...goals, [key]: v })}
                      className={`rounded-full border px-3 py-1.5 text-[12.5px] font-500 transition-colors ${
                        selected
                          ? 'border-brand-600 bg-brand-50 text-brand-700'
                          : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'
                      }`}
                    >
                      {v}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-700 text-ink-900" style={{ fontWeight: 700 }}>
          Document insights
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Words" value={stats.words} />
          <Stat label="Characters" value={stats.characters} />
          <Stat label="Sentences" value={stats.sentences} />
          <Stat label="Reading time" value={fmtTime(stats.readingTimeSec)} />
          <Stat label="Readability" value={stats.readabilityLabel} />
          <Stat label="Grade level" value={stats.gradeLevel} />
        </div>
        <div className="mt-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-500 text-ink-600">Flesch reading ease</span>
            <span className="text-[12.5px] font-700 text-ink-900">{stats.fleschReadingEase}/100</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-all"
              style={{ width: `${stats.fleschReadingEase}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

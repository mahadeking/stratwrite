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
}

export default function GoalsPanel({ goals, onChange }: Props) {
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
    </div>
  )
}

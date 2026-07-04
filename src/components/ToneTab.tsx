import type { ToneResult } from '../lib/tone'
import type { Goals } from './GoalsPanel'

interface Props {
  tone: ToneResult
  goals: Goals
}

function mismatchHint(tone: ToneResult, goals: Goals): string | null {
  const goal = goals.formality.toLowerCase() // informal | neutral | formal
  if (goal === 'formal' && tone.formality === 'casual')
    return 'Your goal is a formal tone, but your writing reads as casual. Consider removing contractions and slang.'
  if (goal === 'informal' && tone.formality === 'formal')
    return 'Your goal is an informal tone, but your writing reads as formal. Try a more conversational, relaxed style.'
  return null
}

export default function ToneTab({ tone, goals }: Props) {
  const primary = tone.tones[0]
  const hint = mismatchHint(tone, goals)

  return (
    <div className="space-y-5 p-4">
      {/* Primary tone */}
      <div className="rounded-xl border border-ink-100 bg-white p-4 text-center shadow-card">
        <div className="text-4xl">{primary.emoji}</div>
        <p className="mt-2 text-[15px] font-700 text-ink-900" style={{ fontWeight: 700 }}>
          {tone.summary}
        </p>
        <p className="mt-1 text-[12.5px] text-ink-500">{primary.blurb}</p>
      </div>

      {/* Detected tones with strength bars */}
      <div>
        <h3 className="mb-2.5 text-[12px] font-600 uppercase tracking-wide text-ink-400">
          Detected tones
        </h3>
        <div className="space-y-3">
          {tone.tones.map((t) => (
            <div key={t.key}>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[15px]">{t.emoji}</span>
                <span className="text-[13.5px] font-600 text-ink-800">{t.label}</span>
                <span className="ml-auto text-[12px] font-600 text-ink-400">{t.strength}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${t.strength}%` }}
                />
              </div>
              <p className="mt-1 text-[12px] text-ink-400">{t.blurb}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Goal mismatch hint */}
      {hint && (
        <div className="rounded-xl border border-delivery/30 bg-[#f7f4ff] p-3">
          <div className="flex items-start gap-2">
            <span className="text-delivery">💡</span>
            <p className="text-[12.5px] leading-relaxed text-ink-700">{hint}</p>
          </div>
        </div>
      )}

      <p className="text-[11.5px] leading-relaxed text-ink-400">
        Tone is estimated from your word choice, punctuation, and phrasing. It updates as you write.
      </p>
    </div>
  )
}

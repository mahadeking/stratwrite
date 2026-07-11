import type { CheckResult, Category, CategoryScore, Suggestion } from '../types'
import { checkSpelling } from './spell'
import { runRules } from './rules'
import { computeStats } from './readability'

/** Remove suggestions that overlap an earlier (higher-priority) one. */
function dedupeOverlaps(suggestions: Suggestion[]): Suggestion[] {
  const priority: Record<Category, number> = {
    correctness: 0,
    clarity: 1,
    delivery: 2,
    engagement: 3,
  }
  const sorted = [...suggestions].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start
    if (priority[a.category] !== priority[b.category])
      return priority[a.category] - priority[b.category]
    return b.end - b.start - (a.end - a.start)
  })
  const kept: Suggestion[] = []
  let lastEnd = -1
  for (const s of sorted) {
    // Allow informational (no-fix) long-sentence markers to overlap word-level ones,
    // but avoid double word-level underlines on the same span.
    const isWide = s.end - s.start > 60
    if (s.start >= lastEnd || isWide) {
      kept.push(s)
      if (!isWide) lastEnd = s.end
    }
  }
  return kept.sort((a, b) => a.start - b.start)
}

const CATEGORY_LABELS: Record<Category, string> = {
  correctness: 'Correctness',
  clarity: 'Clarity',
  engagement: 'Engagement',
  delivery: 'Delivery',
}

function computeScore(suggestions: Suggestion[], words: number): number {
  if (words === 0) return 100
  const weights: Record<Category, number> = {
    correctness: 3,
    clarity: 1.6,
    delivery: 1.3,
    engagement: 1,
  }
  let penalty = 0
  for (const s of suggestions) penalty += weights[s.category]
  // Normalize penalty against document length so long docs aren't over-punished.
  const density = penalty / Math.max(20, words)
  const score = Math.round(100 - density * 180)
  return Math.max(1, Math.min(100, score))
}

export interface CheckOptions {
  spelling?: boolean
  grammarStyle?: boolean
}

export function checkText(text: string, userDict?: Set<string>, opts?: CheckOptions): CheckResult {
  // Rules run BEFORE spelling so that when a precise grammar rule and a raw
  // spelling guess cover the same span (e.g. "alot" → the rule "a lot" vs. the
  // corrector's "alto"), dedupeOverlaps keeps the higher-quality rule.
  const all = [
    ...(opts?.grammarStyle !== false ? runRules(text) : []),
    ...(opts?.spelling !== false ? checkSpelling(text, userDict) : []),
  ]
  const suggestions = dedupeOverlaps(all)
  const stats = computeStats(text)

  const categoryScores: CategoryScore[] = (
    ['correctness', 'clarity', 'engagement', 'delivery'] as Category[]
  ).map((category) => ({
    category,
    label: CATEGORY_LABELS[category],
    count: suggestions.filter((s) => s.category === category).length,
  }))

  return {
    suggestions,
    stats,
    score: computeScore(suggestions, stats.words),
    categoryScores,
  }
}

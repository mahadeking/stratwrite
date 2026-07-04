export type Category = 'correctness' | 'clarity' | 'engagement' | 'delivery'

export interface Suggestion {
  id: string
  category: Category
  /** Short rule name, e.g. "Spelling", "Passive voice" */
  rule: string
  /** Human-friendly explanation shown in the card */
  message: string
  /** Character offsets into the plain text */
  start: number
  end: number
  /** The exact original substring [start, end) */
  original: string
  /** Suggested replacement(s); first is primary. Empty = no auto-fix (informational). */
  replacements: string[]
}

export interface CategoryScore {
  category: Category
  label: string
  count: number
}

export interface Stats {
  words: number
  characters: number
  charactersNoSpaces: number
  sentences: number
  paragraphs: number
  readingTimeSec: number
  speakingTimeSec: number
  fleschReadingEase: number
  gradeLevel: number
  readabilityLabel: string
  avgWordsPerSentence: number
}

export interface CheckResult {
  suggestions: Suggestion[]
  stats: Stats
  score: number
  categoryScores: CategoryScore[]
}

export const CATEGORY_META: Record<
  Category,
  { label: string; color: string; markClass: string; blurb: string }
> = {
  correctness: {
    label: 'Correctness',
    color: '#e5484d',
    markClass: 'mark-correctness',
    blurb: 'Spelling, grammar & punctuation',
  },
  clarity: {
    label: 'Clarity',
    color: '#3b82f6',
    markClass: 'mark-clarity',
    blurb: 'Concise & easy to read',
  },
  engagement: {
    label: 'Engagement',
    color: '#12a150',
    markClass: 'mark-engagement',
    blurb: 'Vivid & compelling word choice',
  },
  delivery: {
    label: 'Delivery',
    color: '#8b5cf6',
    markClass: 'mark-delivery',
    blurb: 'Tone & confidence',
  },
}

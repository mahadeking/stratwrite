import type { Stats } from '../types'

const WORD_RE = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g

export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  if (w.length <= 3) return 1
  let cleaned = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
  const groups = cleaned.match(/[aeiouy]{1,2}/g)
  return groups ? Math.max(1, groups.length) : 1
}

function readabilityLabel(ease: number): string {
  if (ease >= 90) return 'Very easy'
  if (ease >= 70) return 'Easy'
  if (ease >= 60) return 'Plain English'
  if (ease >= 50) return 'Fairly difficult'
  if (ease >= 30) return 'Difficult'
  return 'Very difficult'
}

export function computeStats(text: string): Stats {
  const words = text.match(WORD_RE) ?? []
  const wordCount = words.length
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, '').length

  const sentenceMatches = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? []
  const sentences = Math.max(
    text.trim() ? 1 : 0,
    sentenceMatches.filter((s) => s.trim().length > 0).length,
  )

  const paragraphs = Math.max(
    text.trim() ? 1 : 0,
    text.split(/\n{2,}/).filter((p) => p.trim().length > 0).length,
  )

  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0)

  const avgWordsPerSentence = sentences ? wordCount / sentences : 0
  const avgSyllablesPerWord = wordCount ? syllables / wordCount : 0

  let ease =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
  if (!wordCount) ease = 100
  ease = Math.max(0, Math.min(100, ease))

  let grade =
    0.39 * avgWordsPerSentence + 11.8 * avgSyllablesPerWord - 15.59
  if (!wordCount) grade = 0
  grade = Math.max(0, grade)

  return {
    words: wordCount,
    characters,
    charactersNoSpaces,
    sentences,
    paragraphs,
    readingTimeSec: Math.round((wordCount / 225) * 60),
    speakingTimeSec: Math.round((wordCount / 130) * 60),
    fleschReadingEase: Math.round(ease),
    gradeLevel: Math.round(grade * 10) / 10,
    readabilityLabel: readabilityLabel(ease),
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
  }
}

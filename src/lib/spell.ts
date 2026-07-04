import wordArray from 'an-array-of-english-words'
import type { Suggestion } from '../types'

// Build a fast lookup set (all lowercase).
const DICT = new Set<string>(wordArray as unknown as string[])

// Common words / contractions / tech terms the base list may miss.
const EXTRA = [
  "i'm", "you're", "we're", "they're", "he's", "she's", "it's", "that's",
  "don't", "doesn't", "didn't", "won't", "can't", "cannot", "isn't", "aren't",
  "wasn't", "weren't", "haven't", "hasn't", "hadn't", "wouldn't", "shouldn't",
  "couldn't", "let's", "i've", "you've", "we've", "they've", "i'll", "you'll",
  "we'll", "they'll", "i'd", "you'd", "we'd", "they'd", "there's", "here's",
  "what's", "who's", "y'all", "o'clock",
  'email', 'emails', 'online', 'website', 'websites', 'blog', 'blogs',
  'app', 'apps', 'login', 'signup', 'ok', 'okay', 'internet', 'wifi',
  'smartphone', 'ai', 'url', 'urls', 'faq', 'ceo', 'api',
]
for (const w of EXTRA) DICT.add(w)

// A small set of frequent words used to rank suggestions (more common first).
const COMMON = new Set<string>([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it', 'for',
  'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his',
  'by', 'from', 'they', 'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my',
  'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out', 'if',
  'about', 'who', 'get', 'which', 'go', 'me', 'when', 'make', 'can', 'like',
  'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into', 'year',
  'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then',
  'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back',
  'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most',
  'thing', 'test', 'the', 'their', 'there', 'here', 'where', 'received',
  'definitely', 'separate', 'necessary', 'beginning', 'writing', 'really',
])

const ALPHA = 'abcdefghijklmnopqrstuvwxyz'
const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g

function known(word: string): boolean {
  const lower = word.toLowerCase().replace(/’/g, "'")
  return DICT.has(lower)
}

function edits1(word: string): Set<string> {
  const result = new Set<string>()
  const splits: [string, string][] = []
  for (let i = 0; i <= word.length; i++) {
    splits.push([word.slice(0, i), word.slice(i)])
  }
  for (const [L, R] of splits) {
    if (R) result.add(L + R.slice(1)) // delete
    if (R.length > 1) result.add(L + R[1] + R[0] + R.slice(2)) // transpose
    for (const c of ALPHA) {
      if (R) result.add(L + c + R.slice(1)) // replace
      result.add(L + c + R) // insert
    }
  }
  return result
}

function rankCandidate(cand: string, original: string): number {
  let score = 0
  if (COMMON.has(cand)) score -= 50
  if (cand[0] === original[0]) score -= 10 // same first letter is usually right
  if (cand.length === original.length) score -= 5
  score += Math.abs(cand.length - original.length)
  return score
}

function suggestFor(word: string): string[] {
  const lower = word.toLowerCase()
  const e1 = [...edits1(lower)].filter((w) => DICT.has(w))
  let candidates = e1
  if (candidates.length < 3) {
    // edits2, but keep it bounded
    const e2 = new Set<string>()
    let budget = 4000
    for (const w of edits1(lower)) {
      for (const w2 of edits1(w)) {
        if (DICT.has(w2)) e2.add(w2)
        if (--budget <= 0) break
      }
      if (budget <= 0) break
    }
    candidates = [...new Set([...e1, ...e2])]
  }
  candidates.sort((a, b) => rankCandidate(a, lower) - rankCandidate(b, lower))
  const top = candidates.slice(0, 4)
  // Preserve original capitalization pattern.
  return top.map((c) => {
    if (word === word.toUpperCase() && word.length > 1) return c.toUpperCase()
    if (word[0] === word[0].toUpperCase()) return c[0].toUpperCase() + c.slice(1)
    return c
  })
}

let idc = 0
export function checkSpelling(text: string, userDict?: Set<string>): Suggestion[] {
  const out: Suggestion[] = []
  let m: RegExpExecArray | null
  WORD_RE.lastIndex = 0
  while ((m = WORD_RE.exec(text)) !== null) {
    const word = m[0]
    // Skip: short words, acronyms (ALL CAPS), words with no lowercase letters.
    if (word.length <= 2) continue
    if (word === word.toUpperCase()) continue
    if (known(word)) continue
    if (userDict && userDict.has(word.toLowerCase().replace(/’/g, "'"))) continue

    idc += 1
    out.push({
      id: `s${idc}`,
      category: 'correctness',
      rule: 'Spelling',
      message: `“${word}” may be misspelled.`,
      start: m.index,
      end: m.index + word.length,
      original: word,
      replacements: suggestFor(word),
    })
  }
  return out
}

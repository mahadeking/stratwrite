// Deeper document analysis for the Insights panel — content-word frequency,
// vocabulary diversity, and sentence-level metrics. Everything is computed
// locally from the plain text; no network and no external data.

const STOPWORDS = new Set<string>([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'than', 'so', 'because',
  'as', 'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'about', 'against',
  'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'from', 'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'is',
  'are', 'was', 'were', 'be', 'been', 'being', 'am', 'do', 'does', 'did',
  'doing', 'have', 'has', 'had', 'having', 'i', 'you', 'he', 'she', 'it', 'we',
  'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'its', 'our',
  'their', 'mine', 'yours', 'ours', 'theirs', 'this', 'that', 'these', 'those',
  'who', 'whom', 'which', 'what', 'whose', 'when', 'where', 'why', 'how', 'all',
  'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'too', 'very', 'can', 'will', 'just',
  'should', 'now', 'also', 'here', 'there', 'one', 'would', 'could', 'get',
  'got', 'make', 'made', 'like', 'well', 'much', 'many', 'been', 'were',
])

const WORD_RE = /[A-Za-z]+(?:['’-][A-Za-z]+)*/g

export interface WordFreq {
  word: string
  count: number
}

export interface Insights {
  totalWords: number
  uniqueWords: number
  /** unique / total, 0..1 — a rough measure of vocabulary variety */
  lexicalDiversity: number
  /** average characters per word */
  avgWordLength: number
  /** words in the longest sentence */
  longestSentenceWords: number
  /** number of sentences with 30+ words */
  longSentenceCount: number
  /** count of -ly adverbs (a writing-tightness signal) */
  adverbCount: number
  /** most-repeated content words (excludes stopwords), used 3+ times */
  overused: WordFreq[]
}

export function computeInsights(text: string): Insights {
  const raw = text.match(WORD_RE) ?? []
  const words = raw.map((w) => w.toLowerCase())
  const totalWords = words.length
  const uniq = new Set(words)
  const charTotal = words.reduce((sum, w) => sum + w.length, 0)

  const freq = new Map<string, number>()
  let adverbCount = 0
  for (const w of words) {
    if (w.length > 4 && w.endsWith('ly')) adverbCount++
    if (w.length < 4 || STOPWORDS.has(w)) continue
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  const overused = [...freq.entries()]
    .map(([word, count]) => ({ word, count }))
    .filter((f) => f.count >= 3)
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word))
    .slice(0, 6)

  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? []
  let longestSentenceWords = 0
  let longSentenceCount = 0
  for (const s of sentences) {
    const wc = (s.match(WORD_RE) ?? []).length
    if (wc > longestSentenceWords) longestSentenceWords = wc
    if (wc >= 30) longSentenceCount++
  }

  return {
    totalWords,
    uniqueWords: uniq.size,
    lexicalDiversity: totalWords ? uniq.size / totalWords : 0,
    avgWordLength: totalWords ? charTotal / totalWords : 0,
    longestSentenceWords,
    longSentenceCount,
    adverbCount,
    overused,
  }
}

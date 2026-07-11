import type { Suggestion } from '../types'

// The full English word list (~2.5 MB) is loaded lazily so the app can start
// instantly; spell-check switches on once it's ready.
let DICT: Set<string> | null = null
let loadingPromise: Promise<void> | null = null

export function loadDictionary(): Promise<void> {
  if (DICT) return Promise.resolve()
  if (!loadingPromise) {
    loadingPromise = import('an-array-of-english-words').then((mod) => {
      const words = ((mod as any).default ?? mod) as string[]
      const d = new Set<string>(words)
      for (const w of EXTRA) d.add(w)
      for (const a of ACRONYMS) d.add(a)
      DICT = d
    })
  }
  return loadingPromise
}

export function isDictReady(): boolean {
  return DICT !== null
}

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

// Common acronyms/initialisms — so we don't flag them once we start checking
// ALL-CAPS words. (Lowercased; known() lowercases before lookup.)
const ACRONYMS = [
  'nasa', 'html', 'css', 'http', 'https', 'xml', 'json', 'sql', 'uri', 'cfo',
  'cto', 'coo', 'hr', 'fbi', 'cia', 'nsa', 'usa', 'uk', 'eu', 'un', 'seo',
  'pdf', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ui', 'ux', 'tv', 'pc', 'id',
  'iq', 'ml', 'vr', 'ar', 'gps', 'usb', 'ram', 'cpu', 'gpu', 'os', 'ios',
  'pin', 'atm', 'diy', 'asap', 'rsvp', 'aka', 'vip', 'pm', 'am', 'us', 'ok',
  'ceo', 'faq', 'ceo', 'wifi', 'url', 'api', 'sms', 'gif', 'ceo', 'phd',
]

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

// Frequent misspellings mapped directly to their correct form. Checked before
// the edit-distance corrector because (a) the corrector can only insert letters
// a–z, so it can never produce apostrophes or spaces ("dont"→"don't",
// "alot"→"a lot"), and (b) among equally-close real words it has no reliable way
// to know which is actually intended ("recieve" is one edit from both "receive"
// and "relieve"). Keys are lowercase; capitalization is restored on output.
const COMMON_MISSPELLINGS: Record<string, string> = {
  // contractions the corrector structurally cannot build
  dont: "don't", cant: "can't", wont: "won't", isnt: "isn't", arent: "aren't",
  wasnt: "wasn't", werent: "weren't", doesnt: "doesn't", didnt: "didn't",
  wouldnt: "wouldn't", couldnt: "couldn't", shouldnt: "shouldn't",
  hasnt: "hasn't", havent: "haven't", hadnt: "hadn't", wprldnt: "wouldn't",
  im: "I'm", ive: "I've", youre: "you're", youve: "you've", youll: "you'll",
  theyre: "they're", theyve: "they've", theyll: "they'll", thats: "that's",
  whats: "what's", hes: "he's", shes: "she's", weve: "we've", werre: "we're",
  // frequent spelling errors, incl. classic i-before-e and doubled letters
  alot: 'a lot', recieve: 'receive', recieved: 'received', beleive: 'believe',
  beleived: 'believed', wierd: 'weird', freind: 'friend', freinds: 'friends',
  thier: 'their', acheive: 'achieve', acheived: 'achieved', definately: 'definitely',
  definatly: 'definitely', definetly: 'definitely', seperate: 'separate',
  seperated: 'separated', seperately: 'separately', occured: 'occurred',
  occuring: 'occurring', occurance: 'occurrence', untill: 'until', wich: 'which',
  becuase: 'because', becasue: 'because', beacuse: 'because', tommorow: 'tomorrow',
  tommorrow: 'tomorrow', tomorow: 'tomorrow', adress: 'address', arguement: 'argument',
  calender: 'calendar', cemetary: 'cemetery', collegue: 'colleague', comming: 'coming',
  commited: 'committed', commitee: 'committee', concious: 'conscious',
  dissapoint: 'disappoint', embarass: 'embarrass', enviroment: 'environment',
  existance: 'existence', familar: 'familiar', finaly: 'finally', foriegn: 'foreign',
  gaurd: 'guard', goverment: 'government', grammer: 'grammar', happend: 'happened',
  harrassment: 'harassment', independant: 'independent', occassion: 'occasion',
  persistant: 'persistent', posession: 'possession', prefered: 'preferred',
  priviledge: 'privilege', publically: 'publicly', reccomend: 'recommend',
  recomend: 'recommend', refered: 'referred', relevent: 'relevant', religous: 'religious',
  remeber: 'remember', resturant: 'restaurant', rythm: 'rhythm', sucessful: 'successful',
  succesful: 'successful', suprise: 'surprise', tendancy: 'tendency', therefor: 'therefore',
  truely: 'truly', unfortunatly: 'unfortunately', usualy: 'usually', vaccum: 'vacuum',
  wether: 'whether', writting: 'writing', alomst: 'almost', teh: 'the', hte: 'the',
  adn: 'and', nad: 'and', ot: 'to', fo: 'of', accross: 'across', agian: 'again',
  alright: 'all right', aparent: 'apparent', basicly: 'basically', begining: 'beginning',
  beofre: 'before', wfull: 'well',
}

const ALPHA = 'abcdefghijklmnopqrstuvwxyz'
const WORD_RE = /[A-Za-z]+(?:['’][A-Za-z]+)*/g

/** Length of the shared leading prefix of two strings. */
function commonPrefix(a: string, b: string): number {
  let i = 0
  while (i < a.length && i < b.length && a[i] === b[i]) i++
  return i
}

function known(word: string): boolean {
  const lower = word.toLowerCase().replace(/’/g, "'")
  return !DICT || DICT.has(lower)
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
  // Reward shared leading letters — the more of the word that matches before the
  // typo, the likelier this is the intended word (receive vs. relieve).
  score -= commonPrefix(cand, original) * 4
  if (cand[0] === original[0]) score -= 10 // same first letter is usually right
  if (cand.length === original.length) score -= 5
  score += Math.abs(cand.length - original.length)
  return score
}

/** Restore the original word's capitalization pattern onto a replacement. */
function preserveCase(word: string, replacement: string): string {
  if (!replacement) return replacement
  if (word === word.toUpperCase() && word.length > 1) return replacement.toUpperCase()
  if (word[0] === word[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1)
  return replacement
}

function suggestFor(word: string): string[] {
  const dict = DICT
  if (!dict) return []
  const lower = word.toLowerCase().replace(/’/g, "'")
  const ranked: string[] = []
  // A known common misspelling always leads — it's the intended correction.
  const fix = COMMON_MISSPELLINGS[lower]
  if (fix) ranked.push(fix)

  const e1 = [...edits1(lower)].filter((w) => dict.has(w))
  let candidates = e1
  if (candidates.length < 3) {
    // edits2, but keep it bounded
    const e2 = new Set<string>()
    let budget = 4000
    for (const w of edits1(lower)) {
      for (const w2 of edits1(w)) {
        if (dict.has(w2)) e2.add(w2)
        if (--budget <= 0) break
      }
      if (budget <= 0) break
    }
    candidates = [...new Set([...e1, ...e2])]
  }
  candidates.sort((a, b) => rankCandidate(a, lower) - rankCandidate(b, lower))
  for (const c of candidates) {
    if (ranked.length >= 4) break
    if (!ranked.includes(c)) ranked.push(c)
  }
  // Preserve original capitalization pattern.
  return ranked.slice(0, 4).map((c) => preserveCase(word, c))
}

let idc = 0
export function checkSpelling(text: string, userDict?: Set<string>): Suggestion[] {
  const out: Suggestion[] = []
  let m: RegExpExecArray | null
  WORD_RE.lastIndex = 0
  while ((m = WORD_RE.exec(text)) !== null) {
    const word = m[0]
    // Skip very short tokens and anything containing digits.
    if (word.length <= 2) continue
    // ALL-CAPS words ARE checked now (via known(), which lowercases) — real
    // acronyms live in the dictionary/ACRONYMS list, so only typos get flagged.
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

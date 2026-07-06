import type { Category, Suggestion } from '../types'

let counter = 0
function makeId() {
  counter += 1
  return `r${counter}`
}

interface RawMatch {
  category: Category
  rule: string
  message: string
  start: number
  end: number
  original: string
  replacements: string[]
}

/** Wordy / redundant phrases → concise alternatives (clarity). */
const WORDY: Record<string, string> = {
  'in order to': 'to',
  'in order for': 'for',
  'due to the fact that': 'because',
  'in spite of the fact that': 'although',
  'in the event that': 'if',
  'for the purpose of': 'for',
  'with regard to': 'about',
  'with reference to': 'about',
  'in the near future': 'soon',
  'at this point in time': 'now',
  'at the present time': 'now',
  'a large number of': 'many',
  'a majority of': 'most',
  'the majority of': 'most',
  'a sufficient amount of': 'enough',
  'has the ability to': 'can',
  'have the ability to': 'can',
  'is able to': 'can',
  'are able to': 'can',
  'in the process of': '',
  'take into consideration': 'consider',
  'make a decision': 'decide',
  'come to the conclusion': 'conclude',
  'on a daily basis': 'daily',
  'in a timely manner': 'promptly',
  'each and every': 'every',
  'first and foremost': 'first',
  'end result': 'result',
  'past history': 'history',
  'basic fundamentals': 'fundamentals',
  'advance planning': 'planning',
  'close proximity': 'near',
  'absolutely essential': 'essential',
  'completely eliminate': 'eliminate',
  'few in number': 'few',
  'period of time': 'period',
  'point in time': 'point',
}

/** Weasel / filler words that weaken writing (engagement). */
const WEASEL = [
  'very',
  'really',
  'quite',
  'rather',
  'somewhat',
  'basically',
  'actually',
  'literally',
  'just',
  'simply',
  'totally',
  'definitely',
  'certainly',
  'probably',
  'virtually',
  'fairly',
  'pretty much',
  'kind of',
  'sort of',
  'a lot of',
  'lots of',
]

/** Hedges that reduce confidence (delivery). */
const HEDGES = [
  'i think',
  'i believe',
  'i feel',
  'i guess',
  'in my opinion',
  'it seems',
  'perhaps',
  'maybe',
  'possibly',
  'hopefully',
]

/** Clichés (engagement). */
const CLICHES: Record<string, string> = {
  'at the end of the day': 'ultimately',
  'think outside the box': 'think creatively',
  'low-hanging fruit': 'easy wins',
  'move the needle': 'make progress',
  'boil the ocean': 'do too much',
  'circle back': 'follow up',
  'touch base': 'check in',
  'going forward': 'from now on',
  'needless to say': '',
  'last but not least': 'finally',
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * High-precision grammar rules (correctness). Each matches a whole phrase and
 * replaces it, so offsets stay exact. Patterns are deliberately conservative to
 * avoid false positives.
 */
interface GrammarRule {
  re: RegExp
  rule: string
  message: string
  replace: (m: RegExpExecArray) => string
}

const DN: Record<string, string> = {
  no: 'any',
  nothing: 'anything',
  nobody: 'anybody',
  none: 'any',
  never: 'ever',
  nowhere: 'anywhere',
  neither: 'either',
}

const GRAMMAR_RULES: GrammarRule[] = [
  // "should of" → "should have"
  {
    re: /\b(should|would|could|must|might|may)\s+of\b/gi,
    rule: 'Word choice',
    message: '“of” should be “have” after this verb.',
    replace: (m) => `${m[1]} have`,
  },
  // your / you're
  {
    re: /\byour\s+welcome\b/gi,
    rule: 'Confused word',
    message: 'Did you mean “you’re welcome” (you are)?',
    replace: () => `you're welcome`,
  },
  {
    re: /\byour\s+(a|an)\b/gi,
    rule: 'Confused word',
    message: 'Did you mean “you’re” (you are)?',
    replace: (m) => `you're ${m[1]}`,
  },
  {
    re: /\byour\s+(going|gonna|getting|coming|kidding|doing|being|welcome|invited)\b/gi,
    rule: 'Confused word',
    message: 'Did you mean “you’re” (you are)?',
    replace: (m) => `you're ${m[1]}`,
  },
  // their → there (existential)
  {
    re: /\btheir\s+(is|are|was|were|will|has|have|been|would|could|should)\b/gi,
    rule: 'Confused word',
    message: 'Did you mean “there”?',
    replace: (m) => `there ${m[1]}`,
  },
  // there/their → they're
  {
    re: /\b(there|their)\s+(going|gonna|coming|getting)\b/gi,
    rule: 'Confused word',
    message: 'Did you mean “they’re” (they are)?',
    replace: (m) => `they're ${m[2]}`,
  },
  // to → too
  {
    re: /\bto\s+(much|many|late|early|big|small|hard|easy|good|long|short|far|fast|slow|old|young|soon|often|expensive|cheap|busy|tired|loud|quiet)\b/gi,
    rule: 'Confused word',
    message: 'Did you mean “too”?',
    replace: (m) => `too ${m[1]}`,
  },
  // then → than (after comparatives)
  {
    re: /\b(more|less|better|worse|greater|fewer|bigger|smaller|larger|older|younger|rather|faster|slower|higher|lower|cheaper|easier|harder|stronger|weaker|sooner|other|else)\s+then\b/gi,
    rule: 'Confused word',
    message: 'Use “than” for comparisons.',
    replace: (m) => `${m[1]} than`,
  },
  // its → it's (it is)
  {
    re: /\bits\s+(a|an|not|going|gonna|been|too|so|very|time|clear|important|possible)\b/gi,
    rule: 'Confused word',
    message: 'Did you mean “it’s” (it is)?',
    replace: (m) => `it's ${m[1]}`,
  },
  // subject–verb agreement
  {
    re: /\b(we|they|you)\s+was\b/gi,
    rule: 'Subject-verb agreement',
    message: 'Use “were” with this subject.',
    replace: (m) => `${m[1]} were`,
  },
  {
    re: /\b(he|she|it)\s+don't\b/gi,
    rule: 'Subject-verb agreement',
    message: 'Use “doesn’t” with this subject.',
    replace: (m) => `${m[1]} doesn't`,
  },
  {
    re: /\b(we|they|you|i)\s+doesn't\b/gi,
    rule: 'Subject-verb agreement',
    message: 'Use “don’t” with this subject.',
    replace: (m) => `${m[1]} don't`,
  },
  {
    re: /\b(we|they|you)\s+is\b/gi,
    rule: 'Subject-verb agreement',
    message: 'Use “are” with this subject.',
    replace: (m) => `${m[1]} are`,
  },
  // alot → a lot
  {
    re: /\balot\b/gi,
    rule: 'Word choice',
    message: '“alot” isn’t a word — use “a lot”.',
    replace: () => 'a lot',
  },
]

const SENTENCE_ABBR = new Set([
  'mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'st', 'vs', 'etc', 'eg', 'ie',
  'ex', 'no', 'al', 'inc', 'ltd', 'co', 'u.s', 'u.k', 'a.m', 'p.m', 'approx',
  'dept', 'est', 'fig', 'gov', 'capt', 'col', 'sgt', 'lt', 'ph.d', 'i.e', 'e.g',
])

function scanPhrases(
  text: string,
  phrases: string[] | Record<string, string>,
  build: (phrase: string, hit: string) => Omit<RawMatch, 'start' | 'end' | 'original'>,
): RawMatch[] {
  const list = Array.isArray(phrases) ? phrases : Object.keys(phrases)
  const out: RawMatch[] = []
  for (const phrase of list) {
    const re = new RegExp(`\\b${escapeRe(phrase)}\\b`, 'gi')
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const base = build(phrase, m[0])
      out.push({
        ...base,
        start: m.index,
        end: m.index + m[0].length,
        original: m[0],
      })
      if (m.index === re.lastIndex) re.lastIndex++
    }
  }
  return out
}

/** Preserve the capitalization pattern of the original when substituting. */
function matchCase(original: string, replacement: string): string {
  if (!replacement) return replacement
  if (original === original.toUpperCase() && original.length > 1) {
    return replacement.toUpperCase()
  }
  if (original[0] === original[0].toUpperCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1)
  }
  return replacement
}

export function runRules(text: string): Suggestion[] {
  const raw: RawMatch[] = []

  // ---- CORRECTNESS: grammar & punctuation ----

  // Repeated word ("the the")
  {
    const re = /\b(\w+)\s+\1\b/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      // Skip legitimate repeats like "had had", "that that" is risky; keep simple.
      raw.push({
        category: 'correctness',
        rule: 'Repeated word',
        message: `You repeated the word “${m[1]}”. Delete the duplicate.`,
        start: m.index,
        end: m.index + m[0].length,
        original: m[0],
        replacements: [m[1]],
      })
    }
  }

  // Double (or more) spaces
  {
    const re = / {2,}/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      raw.push({
        category: 'correctness',
        rule: 'Extra spacing',
        message: 'Remove the extra space between words.',
        start: m.index,
        end: m.index + m[0].length,
        original: m[0],
        replacements: [' '],
      })
    }
  }

  // Space before punctuation
  {
    const re = /\s+([,.!?;:])/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      raw.push({
        category: 'correctness',
        rule: 'Punctuation spacing',
        message: 'Remove the space before this punctuation mark.',
        start: m.index,
        end: m.index + m[0].length,
        original: m[0],
        replacements: [m[1]],
      })
    }
  }

  // a/an misuse
  {
    const re = /\b(a|an)\s+([A-Za-z]+)/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const article = m[1].toLowerCase()
      const next = m[2].toLowerCase()
      const startsVowelSound = /^[aeiou]/.test(next) && !/^(uni|use|user|euro|one|once)/.test(next)
      const correct = startsVowelSound ? 'an' : 'a'
      if (article !== correct) {
        const fixed = matchCase(m[1], correct)
        raw.push({
          category: 'correctness',
          rule: 'Article agreement',
          message: `Use “${correct}” before “${m[2]}”.`,
          start: m.index,
          end: m.index + m[1].length,
          original: m[1],
          replacements: [fixed],
        })
      }
    }
  }

  // Standalone lowercase "i"
  {
    const re = /(^|[^A-Za-z])i(?=[^A-Za-z]|$)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const iPos = m.index + m[1].length
      raw.push({
        category: 'correctness',
        rule: 'Capitalize “I”',
        message: 'The pronoun “I” should always be capitalized.',
        start: iPos,
        end: iPos + 1,
        original: 'i',
        replacements: ['I'],
      })
    }
  }

  // Missing space after sentence punctuation ("word.Next")
  {
    const re = /([a-z,])([.!?])([A-Z])/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      raw.push({
        category: 'correctness',
        rule: 'Missing space',
        message: 'Add a space after the punctuation mark.',
        start: m.index,
        end: m.index + m[0].length,
        original: m[0],
        replacements: [`${m[1]}${m[2]} ${m[3]}`],
      })
    }
  }

  // Grammar rules (confused words, agreement, double negatives, etc.)
  for (const g of GRAMMAR_RULES) {
    g.re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = g.re.exec(text)) !== null) {
      const rep = matchCase(m[0], g.replace(m))
      raw.push({
        category: 'correctness',
        rule: g.rule,
        message: g.message,
        start: m.index,
        end: m.index + m[0].length,
        original: m[0],
        replacements: [rep],
      })
      if (m.index === g.re.lastIndex) g.re.lastIndex++
    }
  }

  // Double negatives — a negative verb followed (within a couple of words) by
  // another negative word. Lookbehind so we only replace the second negative.
  {
    const re =
      /(?<=(?:\bnot|n['’]t)\s+(?:\w+\s+){0,2})(no|nothing|nobody|none|never|nowhere|neither)\b/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      raw.push({
        category: 'correctness',
        rule: 'Double negative',
        message: 'This is a double negative — it can confuse readers.',
        start: m.index,
        end: m.index + m[0].length,
        original: m[0],
        replacements: [DN[m[0].toLowerCase()] ?? m[0]],
      })
      if (m.index === re.lastIndex) re.lastIndex++
    }
  }

  // Sentence-start capitalization (guarded against abbreviations)
  {
    const re = /(^|([A-Za-z][A-Za-z.]*)[.!?]["')\]]?\s+)([a-z])/g
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      const prev = m[2]
      if (prev) {
        const p = prev.toLowerCase().replace(/\.$/, '')
        if (prev.length === 1 || SENTENCE_ABBR.has(p)) continue
      }
      const pos = m.index + m[1].length
      raw.push({
        category: 'correctness',
        rule: 'Capitalization',
        message: 'Capitalize the first letter of the sentence.',
        start: pos,
        end: pos + 1,
        original: m[3],
        replacements: [m[3].toUpperCase()],
      })
    }
  }

  // ---- CLARITY: wordiness ----
  raw.push(
    ...scanPhrases(text, WORDY, (phrase) => {
      const concise = WORDY[phrase]
      return {
        category: 'clarity',
        rule: 'Wordy phrase',
        message: concise
          ? `“${phrase}” is wordy. Try “${concise}”.`
          : `“${phrase}” adds no meaning. Consider removing it.`,
        replacements: concise ? [concise] : [''],
      }
    }).map((r) => ({ ...r, replacements: r.replacements.map((rep) => matchCase(r.original, rep)) })),
  )

  // Long sentence (readability → clarity)
  {
    const sentenceRe = /[^.!?\n]+[.!?]?/g
    let m: RegExpExecArray | null
    while ((m = sentenceRe.exec(text)) !== null) {
      const s = m[0]
      const wc = (s.match(/[A-Za-z0-9]+/g) ?? []).length
      if (wc >= 30) {
        const startTrim = s.length - s.trimStart().length
        raw.push({
          category: 'clarity',
          rule: 'Hard-to-read sentence',
          message: `This sentence is ${wc} words long. Consider splitting it for readability.`,
          start: m.index + startTrim,
          end: m.index + s.trimEnd().length,
          original: s.trim(),
          replacements: [],
        })
      }
    }
  }

  // ---- ENGAGEMENT: weasel words, clichés ----
  raw.push(
    ...scanPhrases(text, WEASEL, (phrase) => ({
      category: 'engagement',
      rule: 'Weak intensifier',
      message: `“${phrase}” weakens your point. Consider removing it or using a stronger word.`,
      replacements: [''],
    })),
  )

  raw.push(
    ...scanPhrases(text, CLICHES, (phrase) => {
      const alt = CLICHES[phrase]
      return {
        category: 'engagement',
        rule: 'Cliché',
        message: alt
          ? `“${phrase}” is a cliché. Try “${alt}”.`
          : `“${phrase}” is a cliché. Consider removing it.`,
        replacements: alt ? [alt] : [''],
      }
    }),
  )

  // ---- DELIVERY: passive voice & hedging ----

  // Passive voice: (am/is/are/was/were/be/been/being) + past participle (word ending -ed or common irregulars)
  {
    const re =
      /\b(am|is|are|was|were|be|been|being)\s+(\w+ed|written|made|done|given|taken|seen|known|shown|held|found|kept|sent|built|told|brought|bought|caught|taught)\b/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(text)) !== null) {
      raw.push({
        category: 'delivery',
        rule: 'Passive voice',
        message: 'Passive voice can feel indirect. Consider an active construction.',
        start: m.index,
        end: m.index + m[0].length,
        original: m[0],
        replacements: [],
      })
    }
  }

  raw.push(
    ...scanPhrases(text, HEDGES, (phrase) => ({
      category: 'delivery',
      rule: 'Hedging language',
      message: `“${phrase}” can sound uncertain. State it directly for a more confident tone.`,
      replacements: [''],
    })),
  )

  return raw.map((r) => ({ id: makeId(), ...r }))
}

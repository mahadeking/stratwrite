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

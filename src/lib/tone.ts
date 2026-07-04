/**
 * Heuristic tone detector — no AI. Scores the text across several tone
 * dimensions using word choice, punctuation, and phrasing signals (the same
 * kinds of cues Grammarly describes), then surfaces the strongest tones.
 */

export interface ToneScore {
  key: string
  label: string
  emoji: string
  /** 0–100 relative strength for the bar. */
  strength: number
  blurb: string
}

export interface ToneResult {
  tones: ToneScore[]
  summary: string
  /** One of: formal | casual | neutral — used to compare against a Goals setting. */
  formality: 'formal' | 'casual' | 'neutral'
}

interface ToneDef {
  key: string
  label: string
  emoji: string
  blurb: string
}

const DEFS: Record<string, ToneDef> = {
  formal: { key: 'formal', label: 'Formal', emoji: '🎩', blurb: 'Professional and measured' },
  casual: { key: 'casual', label: 'Casual', emoji: '😎', blurb: 'Relaxed and conversational' },
  confident: { key: 'confident', label: 'Confident', emoji: '💪', blurb: 'Assertive and self-assured' },
  tentative: { key: 'tentative', label: 'Tentative', emoji: '🤔', blurb: 'Cautious and hedged' },
  friendly: { key: 'friendly', label: 'Friendly', emoji: '😊', blurb: 'Warm and approachable' },
  optimistic: { key: 'optimistic', label: 'Optimistic', emoji: '🙂', blurb: 'Positive and upbeat' },
  concerned: { key: 'concerned', label: 'Concerned', emoji: '😟', blurb: 'Worried or apologetic' },
  excited: { key: 'excited', label: 'Excited', emoji: '🎉', blurb: 'Energetic and enthusiastic' },
  urgent: { key: 'urgent', label: 'Urgent', emoji: '⚡', blurb: 'Pressing and time-sensitive' },
  analytical: { key: 'analytical', label: 'Analytical', emoji: '📊', blurb: 'Logical and data-driven' },
  neutral: { key: 'neutral', label: 'Neutral', emoji: '😐', blurb: 'Even and matter-of-fact' },
}

const LEX: Record<string, string[]> = {
  formalConnectors: ['therefore', 'however', 'furthermore', 'moreover', 'consequently', 'regarding', 'hence', 'thus', 'nevertheless', 'accordingly', 'whereas', 'herein', 'pursuant', 'aforementioned', 'shall'],
  informal: ['gonna', 'wanna', 'gotta', 'yeah', 'yep', 'nope', 'kinda', 'sorta', 'cool', 'stuff', 'guys', 'ok', 'okay', 'lol', 'haha', 'hey', 'yikes', 'oops', 'btw', 'awesome', 'super'],
  positive: ['great', 'good', 'excellent', 'wonderful', 'amazing', 'fantastic', 'love', 'happy', 'glad', 'excited', 'delighted', 'pleased', 'perfect', 'best', 'beautiful', 'enjoy', 'appreciate', 'thrilled', 'brilliant', 'success'],
  negative: ['unfortunately', 'problem', 'issue', 'difficult', 'worried', 'concern', 'concerned', 'sorry', 'apologize', 'apologies', 'disappointed', 'fail', 'failure', 'bad', 'wrong', 'terrible', 'awful', 'hate', 'frustrated', 'annoyed', 'upset', 'struggle', 'delay'],
  confident: ['will', 'definitely', 'certainly', 'clearly', 'absolutely', 'must', 'ensure', 'guarantee', 'confident', 'undoubtedly', 'surely', 'commit', 'deliver', 'proven', 'expert', 'always'],
  tentative: ['maybe', 'perhaps', 'possibly', 'might', 'seems', 'hopefully', 'probably', 'apparently', 'somewhat', 'unsure', 'guess'],
  tentativePhrases: ['i think', 'i believe', 'i guess', 'i feel', 'kind of', 'sort of', 'not sure', 'i hope', 'in my opinion'],
  friendly: ['please', 'thanks', 'thank you', 'appreciate', 'kindly', 'welcome', 'cheers', 'regards', 'hope you', 'happy to', 'hello', 'dear', 'looking forward'],
  urgent: ['asap', 'urgent', 'immediately', 'right away', 'deadline', 'critical', 'quickly', 'hurry', 'today', 'now', 'must'],
  analytical: ['data', 'analysis', 'result', 'results', 'percent', 'evidence', 'research', 'measure', 'metric', 'metrics', 'report', 'compare', 'statistics', 'therefore', 'because', 'ratio', 'average'],
  excited: ['cant wait', "can't wait", 'so excited', 'amazing', 'incredible', 'wow', 'yay', 'thrilled', 'awesome'],
}

const WORD_RE = /[A-Za-z]+(?:'[A-Za-z]+)?/g
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu

function countPhrases(hay: string, phrases: string[]): number {
  let n = 0
  for (const p of phrases) {
    if (p.includes(' ')) {
      let idx = 0
      while ((idx = hay.indexOf(p, idx)) !== -1) {
        n++
        idx += p.length
      }
    } else {
      const re = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      n += (hay.match(re) ?? []).length
    }
  }
  return n
}

export function detectTone(text: string): ToneResult {
  const trimmed = text.trim()
  const words = trimmed.match(WORD_RE) ?? []
  const wc = words.length

  if (wc < 3) {
    return {
      tones: [{ ...DEFS.neutral, strength: 100 }],
      summary: 'Write a bit more to detect the tone of your text.',
      formality: 'neutral',
    }
  }

  const lower = trimmed.toLowerCase()
  const per100 = (n: number) => (n / wc) * 100

  const exclam = (trimmed.match(/!/g) ?? []).length
  const questions = (trimmed.match(/\?/g) ?? []).length
  const contractions = (lower.match(/\b\w+'\w+\b/g) ?? []).length
  const emojis = (trimmed.match(EMOJI_RE) ?? []).length
  const allCaps = words.filter((w) => w.length >= 3 && w === w.toUpperCase()).length
  const secondPerson = countPhrases(lower, ['you', 'your', "you're", 'yours'])
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / wc

  const hit = (k: string) => per100(countPhrases(lower, LEX[k]))

  const positive = hit('positive')
  const negative = hit('negative')

  // Raw tone scores (higher = stronger signal).
  const raw: Record<string, number> = {
    formal: hit('formalConnectors') * 3 + Math.max(0, avgWordLen - 4.6) * 6 + (contractions === 0 ? 4 : 0) - per100(contractions) * 1.5 - emojis * 5,
    casual: per100(contractions) * 2 + hit('informal') * 3 + emojis * 6 + per100(exclam) * 1.2 + per100(secondPerson) * 0.4,
    confident: hit('confident') * 3 - hit('tentative') * 2 - countPhrases(lower, LEX.tentativePhrases) * 3,
    tentative: hit('tentative') * 3 + per100(countPhrases(lower, LEX.tentativePhrases)) * 4 + per100(questions) * 1.5,
    friendly: hit('friendly') * 4 + per100(secondPerson) * 0.6 + Math.min(per100(exclam), 6) * 0.5,
    optimistic: positive * 3 - negative * 1.5,
    concerned: negative * 3.2 - positive * 1,
    excited: per100(exclam) * 2.2 + hit('excited') * 4 + emojis * 4 + allCaps * 2,
    urgent: hit('urgent') * 3 + allCaps * 2.5 + Math.min(per100(exclam), 8) * 0.6,
    analytical: hit('analytical') * 3 + (/\d/.test(trimmed) ? 4 : 0) + Math.max(0, avgWordLen - 4.8) * 3 - per100(exclam) * 2,
  }

  // Keep only positive scores.
  const scored = Object.entries(raw)
    .map(([key, v]) => ({ key, v }))
    .filter((s) => s.v > 2)
    .sort((a, b) => b.v - a.v)

  const formality: ToneResult['formality'] =
    raw.formal > raw.casual + 3 ? 'formal' : raw.casual > raw.formal + 3 ? 'casual' : 'neutral'

  if (scored.length === 0) {
    return {
      tones: [{ ...DEFS.neutral, strength: 100 }],
      summary: 'Your writing sounds neutral and even.',
      formality,
    }
  }

  const max = scored[0].v
  const top = scored.slice(0, 3).map((s) => ({
    ...DEFS[s.key],
    strength: Math.round(Math.min(100, (s.v / max) * 100)),
  }))

  const labels = top.map((t) => t.label.toLowerCase())
  const summary =
    labels.length === 1
      ? `Your writing sounds ${labels[0]}.`
      : `Your writing sounds mostly ${labels[0]}${labels[1] ? `, with a hint of ${labels[1]}` : ''}.`

  return { tones: top, summary, formality }
}

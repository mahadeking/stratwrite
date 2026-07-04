/** Longer "Learn more" explanations keyed by a suggestion's `rule` name. */
export const EXPLANATIONS: Record<string, string> = {
  Spelling:
    'This word isn’t in the dictionary, so it may be a typo. Pick a suggested spelling, or add it to your personal dictionary if it’s correct (a name, brand, or technical term).',
  'Repeated word':
    'The same word appears twice in a row. This is usually an accidental duplication — remove one copy.',
  'Extra spacing':
    'There’s more than one space between words. Standard writing uses a single space, so the extra spaces should be removed.',
  'Punctuation spacing':
    'A space appears before a punctuation mark. In English, punctuation like commas and periods attaches directly to the preceding word with no space before it.',
  'Article agreement':
    'Use “a” before a consonant sound and “an” before a vowel sound (a book, an hour). This keeps the phrase easy to pronounce and grammatically correct.',
  'Capitalize “I”':
    'The pronoun “I” is always capitalized in English, whether it starts a sentence or appears in the middle.',
  'Missing space':
    'Two sentences (or words) are joined with no space after the punctuation. Add a space so the text is readable.',
  'Wordy phrase':
    'This phrase uses more words than needed to express a simple idea. A shorter alternative makes your writing clearer and easier to read.',
  'Hard-to-read sentence':
    'Long sentences can be hard to follow because the reader has to hold many ideas in mind at once. Consider splitting this into two or more shorter sentences.',
  'Weak intensifier':
    'Words like “very”, “really”, and “just” add emphasis but little meaning. Removing them, or choosing a stronger word, makes your writing more confident and direct.',
  Cliché:
    'This is an overused expression that has lost its impact. A fresh, specific phrasing will engage your reader more.',
  'Passive voice':
    'In the passive voice the subject receives the action instead of doing it (“the report was written by the team”). The active voice (“the team wrote the report”) is usually clearer and more direct.',
  'Hedging language':
    'Hedging phrases like “I think” or “maybe” can make your writing sound uncertain. Stating your point directly gives it more authority.',
}

export function explanationFor(rule: string): string | undefined {
  return EXPLANATIONS[rule]
}

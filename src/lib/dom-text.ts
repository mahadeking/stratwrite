/**
 * Utilities to map between a contentEditable DOM subtree and the plain-text
 * string our checker operates on. We build a `charMap` with one entry per
 * plain-text character pointing back to the exact DOM Text node + offset, so we
 * can construct DOM Ranges for highlighting and for applying fixes without
 * disturbing the surrounding rich formatting.
 */

export interface CharPos {
  node: Text
  offset: number
}

export interface Serialized {
  text: string
  /** charMap[i] locates plain-text char i in the DOM; null = synthetic newline. */
  charMap: (CharPos | null)[]
}

const BLOCK = new Set([
  'DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'BLOCKQUOTE', 'PRE', 'SECTION',
])

export function serialize(root: Node): Serialized {
  const chars: string[] = []
  const charMap: (CharPos | null)[] = []

  const pushNewline = () => {
    if (chars.length === 0 || chars[chars.length - 1] === '\n') return
    chars.push('\n')
    charMap.push(null)
  }

  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = child as Text
        const s = t.data
        for (let i = 0; i < s.length; i++) {
          chars.push(s[i])
          charMap.push({ node: t, offset: i })
        }
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const el = child as HTMLElement
        if (el.tagName === 'BR') {
          chars.push('\n')
          charMap.push(null)
          continue
        }
        const isBlock = BLOCK.has(el.tagName)
        if (isBlock) pushNewline()
        walk(el)
        if (isBlock) pushNewline()
      }
    }
  }

  walk(root)
  // Trim a single leading newline artifact if present.
  return { text: chars.join(''), charMap }
}

/** Build a DOM Range spanning plain-text [start, end). Returns null if empty. */
export function buildRange(charMap: (CharPos | null)[], start: number, end: number): Range | null {
  let s = start
  while (s < end && !charMap[s]) s++
  let e = end
  while (e > s && !charMap[e - 1]) e--
  if (s >= e) return null
  const a = charMap[s]
  const b = charMap[e - 1]
  if (!a || !b) return null
  try {
    const range = document.createRange()
    range.setStart(a.node, a.offset)
    range.setEnd(b.node, b.offset + 1)
    return range
  } catch {
    return null
  }
}

/** Plain-text offset of the current caret within root, or null if not inside. */
export function caretOffset(root: Node, sel: Selection | null): number | null {
  if (!sel || sel.rangeCount === 0) return null
  const node = sel.anchorNode
  if (!node || !root.contains(node)) return null
  const { charMap } = serialize(root)
  if (node.nodeType === Node.TEXT_NODE) {
    for (let i = 0; i < charMap.length; i++) {
      const c = charMap[i]
      if (c && c.node === node && c.offset >= sel.anchorOffset) return i
    }
    // caret at end of a text node
    for (let i = charMap.length - 1; i >= 0; i--) {
      const c = charMap[i]
      if (c && c.node === node) return i + 1
    }
  }
  return null
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

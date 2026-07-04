import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { Suggestion } from '../types'
import { buildRange, caretOffset, serialize } from '../lib/dom-text'

export interface EditorHandle {
  applyReplacement: (start: number, end: number, replacement: string) => void
  focus: () => void
}

interface Props {
  initialHtml: string
  initialText: string
  placeholder?: string
  onChange: (plain: string, html: string) => void
  suggestions: Suggestion[]
  activeId: string | null
  onActivate: (id: string | null) => void
  onActiveRect?: (rect: DOMRect | null) => void
  showUnderlines?: boolean
}

const CATEGORIES = ['correctness', 'clarity', 'engagement', 'delivery'] as const
const supportsHighlights = typeof CSS !== 'undefined' && 'highlights' in CSS

const Editor = forwardRef<EditorHandle, Props>(function Editor(
  { initialHtml, initialText, placeholder, onChange, suggestions, activeId, onActivate, onActiveRect, showUnderlines = true },
  ref,
) {
  const elRef = useRef<HTMLDivElement>(null)

  // Report the on-screen position of the active suggestion (for the inline popup).
  useEffect(() => {
    const el = elRef.current
    if (!el || !onActiveRect) return
    const compute = () => {
      if (!activeId) return onActiveRect(null)
      const s = suggestions.find((x) => x.id === activeId)
      if (!s) return onActiveRect(null)
      const { charMap } = serialize(el)
      const range = buildRange(charMap, s.start, s.end)
      onActiveRect(range ? range.getBoundingClientRect() : null)
    }
    compute()
    el.addEventListener('scroll', compute)
    window.addEventListener('resize', compute)
    return () => {
      el.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
    }
  }, [activeId, suggestions, onActiveRect])

  // Load initial content once (component is remounted per document via `key`).
  useEffect(() => {
    const el = elRef.current
    if (!el) return
    if (initialHtml) el.innerHTML = initialHtml
    else el.innerText = initialText
    updateEmptyState()
    report()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateEmptyState = () => {
    const el = elRef.current
    if (!el) return
    const empty = el.textContent?.trim().length === 0
    el.classList.toggle('is-empty', empty)
  }

  const report = () => {
    const el = elRef.current
    if (!el) return
    const { text } = serialize(el)
    onChange(text, el.innerHTML)
  }

  const handleInput = () => {
    updateEmptyState()
    report()
  }

  // Paint grammar underlines using the CSS Custom Highlight API (no DOM mutation).
  useEffect(() => {
    const el = elRef.current
    if (!el || !supportsHighlights) return
    const registry0 = (CSS as any).highlights
    if (!showUnderlines) {
      for (const cat of CATEGORIES) registry0.delete(`sg-${cat}`)
      registry0.delete('sg-active')
      return
    }
    const { charMap } = serialize(el)

    const buckets: Record<string, Range[]> = {
      correctness: [], clarity: [], engagement: [], delivery: [],
    }
    const activeRanges: Range[] = []

    for (const s of suggestions) {
      if (s.end - s.start > 60) continue // wide informational markers: card only
      const range = buildRange(charMap, s.start, s.end)
      if (!range) continue
      buckets[s.category].push(range)
      if (s.id === activeId) activeRanges.push(range)
    }

    const HL = (window as any).Highlight
    const registry = (CSS as any).highlights
    for (const cat of CATEGORIES) {
      const key = `sg-${cat}`
      if (buckets[cat].length) {
        const hl = new HL(...buckets[cat])
        hl.priority = 1
        registry.set(key, hl)
      } else {
        registry.delete(key)
      }
    }
    if (activeRanges.length) {
      const hl = new HL(...activeRanges)
      hl.priority = 2
      registry.set('sg-active', hl)
    } else {
      registry.delete('sg-active')
    }
  }, [suggestions, activeId, showUnderlines])

  // Clear highlights on unmount.
  useEffect(() => {
    return () => {
      if (!supportsHighlights) return
      const registry = (CSS as any).highlights
      for (const cat of CATEGORIES) registry.delete(`sg-${cat}`)
      registry.delete('sg-active')
    }
  }, [])

  useImperativeHandle(ref, () => ({
    applyReplacement(start, end, replacement) {
      const el = elRef.current
      if (!el) return
      const { charMap } = serialize(el)
      const range = buildRange(charMap, start, end)
      if (!range) return
      range.deleteContents()
      if (replacement) range.insertNode(document.createTextNode(replacement))
      // collapse selection after the inserted text
      const sel = window.getSelection()
      if (sel) {
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
      }
      updateEmptyState()
      report()
    },
    focus() {
      elRef.current?.focus()
    },
  }))

  const handleCaret = () => {
    const el = elRef.current
    if (!el) return
    const off = caretOffset(el, window.getSelection())
    if (off === null) return
    const hit = suggestions.find((s) => off >= s.start && off <= s.end && s.end - s.start <= 60)
    onActivate(hit ? hit.id : null)
  }

  return (
    <div
      ref={elRef}
      className="rich-editor editor-type h-full w-full overflow-y-auto text-ink-900 outline-none"
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-multiline="true"
      data-gramm="false"
      data-gramm_editor="false"
      data-enable-grammarly="false"
      data-1p-ignore
      data-lpignore="true"
      data-placeholder={placeholder ?? 'Start writing or paste your text here…'}
      onInput={handleInput}
      onMouseUp={handleCaret}
      onKeyUp={handleCaret}
    />
  )
})

export default Editor

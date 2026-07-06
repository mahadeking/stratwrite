// StratWrite extension — content script.
// Watches editable fields, asks the background worker to check the text,
// and shows a floating badge + suggestions panel. Applies fixes to the field.

declare const chrome: any

interface Sug {
  id: string
  category: 'correctness' | 'clarity' | 'engagement' | 'delivery'
  rule: string
  message: string
  start: number
  end: number
  original: string
  replacements: string[]
}

const COLORS: Record<string, string> = {
  correctness: '#e5484d',
  clarity: '#3b82f6',
  engagement: '#12a150',
  delivery: '#8b5cf6',
}

const SHADOW_CSS = `
:host, * { box-sizing: border-box; }
.sw-badge {
  position: fixed; pointer-events: auto; display: inline-flex; align-items: center; gap: 4px;
  height: 26px; padding: 0 8px; border: none; border-radius: 999px; cursor: pointer;
  font: 600 12px/1 Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #fff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 6px 18px -4px rgba(99,80,200,.5); transition: transform .12s ease;
}
.sw-badge:hover { transform: translateY(-1px); }
.sw-badge.sw-clean { background: #12a150; box-shadow: 0 6px 18px -4px rgba(18,161,80,.45); }
.sw-logo { font-weight: 700; }
.sw-count {
  background: rgba(255,255,255,.28); border-radius: 999px; min-width: 16px; height: 16px;
  padding: 0 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 11px;
}
.sw-panel {
  position: fixed; pointer-events: auto; width: 320px; max-height: 60vh; display: flex; flex-direction: column;
  background: #fff; border: 1px solid #eceef2; border-radius: 16px; overflow: hidden;
  box-shadow: 0 18px 50px -12px rgba(30,20,80,.35); color: #1f2333;
  font: 400 13px/1.45 Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}
.sw-head { display: flex; align-items: center; padding: 10px 12px; border-bottom: 1px solid #f0f1f4; }
.sw-h-title { font-weight: 700; font-size: 13px; }
.sw-x { margin-left: auto; border: none; background: none; cursor: pointer; color: #9aa1b2; font-size: 13px; }
.sw-x:hover { color: #40475b; }
.sw-list { overflow-y: auto; padding: 8px; display: flex; flex-direction: column; gap: 8px; }
.sw-card { border: 1px solid #eceef2; border-radius: 12px; padding: 10px; }
.sw-cat { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
.sw-dot { width: 7px; height: 7px; border-radius: 999px; display: inline-block; }
.sw-msg { margin-top: 5px; font-size: 13px; color: #40475b; }
.sw-btns { margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px; }
.sw-accept {
  border: none; cursor: pointer; border-radius: 8px; padding: 5px 10px; font-size: 12.5px; font-weight: 600;
  color: #fff; background: #4f46e5;
}
.sw-accept:hover { background: #4338ca; }
.sw-foot { display: block; padding: 9px 12px; border-top: 1px solid #f0f1f4; font-size: 12px; font-weight: 600; color: #4f46e5; text-decoration: none; }
.sw-foot:hover { background: #f7f7fb; }
`

let enabled = true
let activeEl: HTMLElement | null = null
let sug: Sug[] = []
let score = 100
let panelOpen = false
let debounce: any = null
let reqSeq = 0

// ---- Shadow-DOM overlay (fully isolated from the host page) ----
const host = document.createElement('div')
host.id = 'stratwrite-ext-host'
host.style.cssText =
  'position:fixed;inset:0;pointer-events:none;z-index:2147483647;'
const shadow = host.attachShadow({ mode: 'open' })
try {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(SHADOW_CSS)
  ;(shadow as any).adoptedStyleSheets = [sheet]
} catch {
  const styleEl = document.createElement('style')
  styleEl.textContent = SHADOW_CSS
  shadow.appendChild(styleEl)
}
const layer = document.createElement('div')
shadow.appendChild(layer)
;(document.documentElement || document.body).appendChild(host)

function isEditable(el: any): el is HTMLElement {
  if (!el || el.nodeType !== 1) return false
  const tag = el.tagName
  if (tag === 'TEXTAREA') return true
  if (tag === 'INPUT') {
    const t = (el.getAttribute('type') || 'text').toLowerCase()
    return ['text', 'search', 'email', 'url', 'tel', ''].includes(t)
  }
  if (el.isContentEditable) return true
  return false
}

function getText(el: HTMLElement): string {
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') return (el as HTMLInputElement).value
  return (el as HTMLElement).innerText
}

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
}

function applyFix(el: HTMLElement, s: Sug, rep: string) {
  if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
    const input = el as HTMLInputElement
    const v = input.value
    const next = v.slice(0, s.start) + rep + v.slice(s.end)
    setNativeValue(input, next)
    const caret = s.start + rep.length
    try {
      input.setSelectionRange(caret, caret)
    } catch {}
  } else {
    // contentEditable: replace the target range across text nodes
    replaceInEditable(el, s.start, s.end, rep)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  el.focus()
}

function replaceInEditable(root: HTMLElement, start: number, end: number, rep: string) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let pos = 0
  let startNode: Text | null = null
  let startOffset = 0
  let endNode: Text | null = null
  let endOffset = 0
  let n: Node | null
  while ((n = walker.nextNode())) {
    const t = n as Text
    const len = t.data.length
    if (!startNode && pos + len >= start) {
      startNode = t
      startOffset = start - pos
    }
    if (pos + len >= end) {
      endNode = t
      endOffset = end - pos
      break
    }
    pos += len
  }
  if (!startNode || !endNode) return
  const range = document.createRange()
  try {
    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset)
    range.deleteContents()
    if (rep) range.insertNode(document.createTextNode(rep))
  } catch {}
}

// ---- Rendering ----
function scoreColor(pct: number) {
  return pct >= 90 ? '#7c3aed' : pct >= 75 ? '#4f46e5' : pct >= 50 ? '#e0a100' : '#e5484d'
}

function render() {
  layer.innerHTML = ''
  if (!enabled || !activeEl) return
  const rect = activeEl.getBoundingClientRect()
  if (rect.width === 0 && rect.height === 0) return

  const count = sug.length

  // Badge
  const badge = document.createElement('button')
  badge.className = 'sw-badge'
  const bottom = Math.min(window.innerHeight - 34, rect.bottom - 30)
  const right = Math.max(8, window.innerWidth - rect.right + 8)
  badge.style.top = bottom + 'px'
  badge.style.right = right + 'px'
  if (count === 0) {
    badge.classList.add('sw-clean')
    badge.innerHTML = '<span class="sw-logo">✓</span>'
    badge.title = 'StratWrite — looks good'
  } else {
    badge.style.setProperty('--sw-accent', scoreColor(score))
    badge.innerHTML = `<span class="sw-logo">S</span><span class="sw-count">${count}</span>`
    badge.title = `StratWrite — ${count} suggestion${count === 1 ? '' : 's'}`
  }
  badge.onclick = (e) => {
    e.preventDefault()
    e.stopPropagation()
    panelOpen = !panelOpen
    render()
  }
  layer.appendChild(badge)

  if (!panelOpen || count === 0) return

  // Panel
  const panel = document.createElement('div')
  panel.className = 'sw-panel'
  const panelBottom = window.innerHeight - bottom + 6
  panel.style.bottom = panelBottom + 'px'
  panel.style.right = right + 'px'

  const header = document.createElement('div')
  header.className = 'sw-head'
  header.innerHTML = `<span class="sw-h-title">${count} suggestion${count === 1 ? '' : 's'}</span>`
  const closeBtn = document.createElement('button')
  closeBtn.className = 'sw-x'
  closeBtn.textContent = '✕'
  closeBtn.onclick = () => {
    panelOpen = false
    render()
  }
  header.appendChild(closeBtn)
  panel.appendChild(header)

  const list = document.createElement('div')
  list.className = 'sw-list'
  sug.slice(0, 40).forEach((s) => {
    const card = document.createElement('div')
    card.className = 'sw-card'
    const color = COLORS[s.category] || '#666'
    card.innerHTML =
      `<div class="sw-cat" style="color:${color}"><span class="sw-dot" style="background:${color}"></span>${s.rule}</div>` +
      `<div class="sw-msg">${escapeHtml(s.message)}</div>`
    if (s.replacements && s.replacements.length) {
      const btnRow = document.createElement('div')
      btnRow.className = 'sw-btns'
      s.replacements.slice(0, 3).forEach((rep) => {
        const b = document.createElement('button')
        b.className = 'sw-accept'
        b.textContent = rep === '' ? 'Remove' : rep
        b.onclick = () => {
          applyFix(activeEl!, s, rep)
          scheduleCheck(0)
        }
        btnRow.appendChild(b)
      })
      card.appendChild(btnRow)
    }
    list.appendChild(card)
  })
  panel.appendChild(list)

  const footer = document.createElement('a')
  footer.className = 'sw-foot'
  footer.href = 'https://stratwrite.netlify.app'
  footer.target = '_blank'
  footer.textContent = 'Open StratWrite editor →'
  panel.appendChild(footer)

  layer.appendChild(panel)
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ---- Checking ----
function scheduleCheck(delay = 600) {
  clearTimeout(debounce)
  debounce = setTimeout(runCheck, delay)
}

function runCheck() {
  if (!enabled || !activeEl) return
  const text = getText(activeEl)
  if (!text || text.trim().length < 2) {
    sug = []
    score = 100
    render()
    return
  }
  const seq = ++reqSeq
  try {
    chrome.runtime.sendMessage({ type: 'sw-check', text }, (res: any) => {
      if (chrome.runtime.lastError) return
      if (seq !== reqSeq) return // stale
      if (res && res.ok) {
        sug = res.suggestions || []
        score = res.score ?? 100
        render()
      }
    })
  } catch {}
}

// ---- Event wiring ----
document.addEventListener(
  'focusin',
  (e) => {
    const t = e.target as HTMLElement
    if (isEditable(t)) {
      activeEl = t
      panelOpen = false
      scheduleCheck(200)
    }
  },
  true,
)

document.addEventListener(
  'input',
  (e) => {
    if (e.target === activeEl) scheduleCheck()
  },
  true,
)

window.addEventListener('scroll', () => render(), true)
window.addEventListener('resize', () => render())

// Close panel when clicking elsewhere on the page
document.addEventListener(
  'mousedown',
  (e) => {
    if (!panelOpen) return
    const path = (e as any).composedPath ? (e as any).composedPath() : []
    if (!path.includes(host)) {
      panelOpen = false
      render()
    }
  },
  true,
)

// ---- Enabled state ----
try {
  chrome.storage?.local?.get?.({ enabled: true }, (r: any) => {
    enabled = r?.enabled !== false
    render()
  })
  chrome.storage?.onChanged?.addListener?.((changes: any) => {
    if (changes.enabled) {
      enabled = changes.enabled.newValue !== false
      if (!enabled) {
        sug = []
        panelOpen = false
      }
      render()
    }
  })
} catch {}

export interface Doc {
  id: string
  title: string
  /** Plain text — used for checking, previews, search, word count. */
  text: string
  /** Rich HTML content of the editor (optional; falls back to `text`). */
  html?: string
  createdAt: number
  updatedAt: number
  /** When set, the doc is in Trash (soft-deleted). */
  deletedAt?: number
  /** Optional folder/collection this doc belongs to. */
  folderId?: string
}

export interface Folder {
  id: string
  name: string
  createdAt: number
}

const FKEY = 'writeright.folders'

export function loadFolders(): Folder[] {
  try {
    return JSON.parse(localStorage.getItem(FKEY) || '[]')
  } catch {
    return []
  }
}

export function saveFolders(folders: Folder[]) {
  try {
    localStorage.setItem(FKEY, JSON.stringify(folders))
  } catch {
    /* ignore */
  }
}

const KEY = 'writeright.docs'

export function loadDocs(): Doc[] {
  try {
    const raw = localStorage.getItem(KEY)
    const docs = raw ? (JSON.parse(raw) as Doc[]) : []
    return docs.sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

export function saveDocs(docs: Doc[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(docs))
  } catch {
    /* ignore quota / privacy-mode errors */
  }
}

export interface Version {
  ts: number
  title: string
  text: string
  html?: string
}

const VKEY = 'writeright.versions'

export function loadVersions(): Record<string, Version[]> {
  try {
    return JSON.parse(localStorage.getItem(VKEY) || '{}')
  } catch {
    return {}
  }
}

export function saveVersions(v: Record<string, Version[]>) {
  try {
    localStorage.setItem(VKEY, JSON.stringify(v))
  } catch {
    /* ignore */
  }
}

/** Approximate size (bytes) of everything StratWrite stores locally. */
export function storageBytes(): number {
  let total = 0
  for (const key of ['writeright.docs', 'writeright.versions', 'writeright.dictionary']) {
    total += (localStorage.getItem(key) || '').length
  }
  return total
}

export function newDoc(partial?: Partial<Doc>): Doc {
  const now = Date.now()
  return {
    id: `d${now.toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    text: '',
    createdAt: now,
    updatedAt: now,
    ...partial,
  }
}

export function wordCount(text: string): number {
  return (text.match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? []).length
}

/** e.g. "just now", "5 minutes ago", "3 days ago", "Jan 4". */
export function timeAgo(ts: number, now = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000))
  if (s < 45) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} minute${m === 1 ? '' : 's'} ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`
  const wk = Math.floor(d / 7)
  if (wk < 5) return `${wk} week${wk === 1 ? '' : 's'} ago`
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

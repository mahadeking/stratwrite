import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Topbar, { type ExportFormat } from './components/Topbar'
import Editor, { type EditorHandle } from './components/Editor'
import Toolbar from './components/Toolbar'
import Sidebar from './components/Sidebar'
import InlinePopup from './components/InlinePopup'
import SettingsModal, { DEFAULT_SETTINGS, type Settings } from './components/SettingsModal'
import DocsHome from './components/DocsHome'
import type { Goals } from './components/GoalsPanel'
import { checkText } from './lib/checker'
import { detectTone } from './lib/tone'
import {
  loadDocs,
  saveDocs,
  newDoc,
  loadVersions,
  saveVersions,
  storageBytes,
  loadFolders,
  saveFolders,
  type Doc,
  type Version,
  type Folder,
} from './lib/store'
import { buildHtmlDocument, download, htmlToMarkdown, sanitizeFilename } from './lib/export'
import type { Template } from './lib/templates'
import type { CheckResult, Suggestion } from './types'

const SAMPLE = `Their are many reason why writing well is a important skill in todays world.  In order to communicate you're ideas clearly, you must payy attention to grammer, spelling, and tone.

I think that alot of people beleive good writing comes natural, but the truth is that it takes alot of practice. At the end of the day, the writer who revises there work carefully will allways produce more better results then the one who does not.

The report was written by the team, and it was reviewed by the manager, and it was very very long, which made it really quite hard to read because the sentences just kept going on and on without any clear breaks or structure whatsoever.`

const EMPTY_RESULT: CheckResult = {
  suggestions: [],
  stats: {
    words: 0,
    characters: 0,
    charactersNoSpaces: 0,
    sentences: 0,
    paragraphs: 0,
    readingTimeSec: 0,
    speakingTimeSec: 0,
    fleschReadingEase: 100,
    gradeLevel: 0,
    readabilityLabel: 'Very easy',
    avgWordsPerSentence: 0,
  },
  score: 100,
  categoryScores: [
    { category: 'correctness', label: 'Correctness', count: 0 },
    { category: 'clarity', label: 'Clarity', count: 0 },
    { category: 'engagement', label: 'Engagement', count: 0 },
    { category: 'delivery', label: 'Delivery', count: 0 },
  ],
}

export default function App() {
  // ---- Documents ----
  const [docs, setDocs] = useState<Doc[]>(() => {
    const existing = loadDocs()
    if (existing.length) return existing
    // Seed a welcome document on first run so the app isn't empty.
    const seed = newDoc({ title: 'Welcome to StratWrite', text: SAMPLE })
    saveDocs([seed])
    return [seed]
  })
  const [view, setView] = useState<'home' | 'editor'>('home')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [versions, setVersions] = useState<Record<string, Version[]>>(() => loadVersions())
  const [folders, setFolders] = useState<Folder[]>(() => loadFolders())

  // ---- Editor working copy ----
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [html, setHtml] = useState('')
  const editorRef = useRef<EditorHandle>(null)
  const [result, setResult] = useState<CheckResult>(EMPTY_RESULT)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeRect, setActiveRect] = useState<DOMRect | null>(null)
  const handleActiveRect = useCallback((r: DOMRect | null) => setActiveRect(r), [])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [userDict, setUserDict] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('writeright.dictionary')
      return new Set<string>(saved ? JSON.parse(saved) : [])
    } catch {
      return new Set<string>()
    }
  })
  const [goals, setGoals] = useState<Goals>({
    audience: 'General',
    formality: 'Neutral',
    intent: 'Inform',
    domain: 'General',
  })
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('writeright.settings')
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })
  const [showSettings, setShowSettings] = useState(false)
  const toggleSetting = (key: keyof Settings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      try {
        localStorage.setItem('writeright.settings', JSON.stringify(next))
      } catch {
        /* ignore */
      }
      return next
    })
  }

  // Debounced re-check whenever the text (or user dictionary) changes, in editor.
  useEffect(() => {
    if (view !== 'editor') return
    const t = setTimeout(
      () => setResult(checkText(text, userDict, { spelling: settings.spelling, grammarStyle: settings.grammarStyle })),
      250,
    )
    return () => clearTimeout(t)
  }, [text, userDict, view, settings.spelling, settings.grammarStyle])

  // Debounced auto-save of the current document.
  useEffect(() => {
    if (view !== 'editor' || !currentId) return
    const t = setTimeout(() => {
      setDocs((prev) => {
        const next = prev.map((d) =>
          d.id === currentId ? { ...d, title, text, html, updatedAt: Date.now() } : d,
        )
        saveDocs(next)
        return next
      })
    }, 500)
    return () => clearTimeout(t)
  }, [title, text, html, currentId, view])

  // Save a version snapshot of the current doc (deduped against the latest).
  const snapshotCurrent = () => {
    if (!currentId || (!text.trim() && !title.trim())) return
    setVersions((prev) => {
      const list = prev[currentId] ?? []
      const last = list[0]
      if (last && last.text === text && (last.html || '') === (html || '') && last.title === title) {
        return prev
      }
      const next = {
        ...prev,
        [currentId]: [{ ts: Date.now(), title, text, html }, ...list].slice(0, 20),
      }
      saveVersions(next)
      return next
    })
  }

  // Persist the current editor state into the docs list immediately (used on navigation).
  const flushSave = () => {
    if (!currentId) return
    snapshotCurrent()
    setDocs((prev) => {
      const next = prev.map((d) =>
        d.id === currentId ? { ...d, title, text, html, updatedAt: Date.now() } : d,
      )
      saveDocs(next)
      return next
    })
  }

  const restoreVersion = (docId: string, ts: number) => {
    const v = versions[docId]?.find((x) => x.ts === ts)
    if (!v) return
    commit(
      docs.map((d) =>
        d.id === docId ? { ...d, title: v.title, text: v.text, html: v.html, updatedAt: Date.now() } : d,
      ),
    )
  }

  const clearDictionary = () => {
    setUserDict(new Set())
    try {
      localStorage.removeItem('writeright.dictionary')
    } catch {
      /* ignore */
    }
  }

  const clearAllData = () => {
    try {
      localStorage.removeItem('writeright.docs')
      localStorage.removeItem('writeright.versions')
      localStorage.removeItem('writeright.dictionary')
    } catch {
      /* ignore */
    }
    setVersions({})
    setUserDict(new Set())
    const seed = newDoc({ title: 'Welcome to StratWrite', text: SAMPLE })
    saveDocs([seed])
    setDocs([seed])
    setCurrentId(null)
    setView('home')
  }

  const commit = (next: Doc[]) => {
    setDocs(next)
    saveDocs(next)
  }

  // ---- Document actions ----
  const [epoch, setEpoch] = useState(0)

  const hydrate = (doc: Doc) => {
    setTitle(doc.title)
    setText(doc.text)
    setHtml(doc.html ?? '')
    setDismissed(new Set())
    setActiveId(null)
    setResult(EMPTY_RESULT)
    setCurrentId(doc.id)
    setView('editor')
  }

  const openDoc = (id: string) => {
    flushSave()
    const doc = docs.find((d) => d.id === id)
    if (doc) hydrate(doc)
  }

  const createDoc = () => {
    flushSave()
    const doc = newDoc()
    commit([doc, ...docs])
    hydrate(doc)
  }

  // ---- Folders ----
  const commitFolders = (next: Folder[]) => {
    setFolders(next)
    saveFolders(next)
  }
  const createFolder = (name: string) => {
    const clean = name.trim()
    if (!clean) return
    commitFolders([
      ...folders,
      { id: `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: clean, createdAt: Date.now() },
    ])
  }
  const renameFolder = (id: string, name: string) => {
    const clean = name.trim()
    if (!clean) return
    commitFolders(folders.map((f) => (f.id === id ? { ...f, name: clean } : f)))
  }
  const deleteFolder = (id: string) => {
    commitFolders(folders.filter((f) => f.id !== id))
    commit(docs.map((d) => (d.folderId === id ? { ...d, folderId: undefined } : d)))
  }
  const moveDocToFolder = (docId: string, folderId: string | null) => {
    commit(docs.map((d) => (d.id === docId ? { ...d, folderId: folderId ?? undefined } : d)))
  }

  const createFromTemplate = (tpl: Template) => {
    flushSave()
    const plain = tpl.html
      ? new DOMParser().parseFromString(tpl.html, 'text/html').body.textContent ?? ''
      : ''
    const doc = newDoc({ title: tpl.docTitle, text: plain, html: tpl.html })
    commit([doc, ...docs])
    hydrate(doc)
  }

  const duplicateDoc = (id: string) => {
    const src = docs.find((d) => d.id === id)
    if (!src) return
    const copy = newDoc({ title: (src.title.trim() || 'Untitled document') + ' (copy)', text: src.text })
    commit([copy, ...docs])
  }

  // Soft delete → move to Trash.
  const deleteDoc = (id: string) => {
    commit(docs.map((d) => (d.id === id ? { ...d, deletedAt: Date.now() } : d)))
    if (currentId === id) {
      setCurrentId(null)
      setView('home')
    }
  }

  const restoreDoc = (id: string) => {
    commit(docs.map((d) => (d.id === id ? { ...d, deletedAt: undefined, updatedAt: Date.now() } : d)))
  }

  const deleteForever = (id: string) => {
    commit(docs.filter((d) => d.id !== id))
  }

  const emptyTrash = () => {
    commit(docs.filter((d) => !d.deletedAt))
  }

  const uploadFiles = async (files: File[]) => {
    const created: Doc[] = []
    for (const file of files) {
      const content = await file.text()
      const isHtml = /\.html?$/i.test(file.name)
      const title = file.name.replace(/\.[^.]+$/, '')
      if (isHtml) {
        const plain = new DOMParser().parseFromString(content, 'text/html').body.textContent ?? ''
        created.push(newDoc({ title, html: content, text: plain }))
      } else {
        created.push(newDoc({ title, text: content }))
      }
    }
    if (created.length) commit([...created, ...docs])
  }

  const goHome = () => {
    flushSave()
    setView('home')
  }

  const exportDoc = (format: ExportFormat) => {
    const name = sanitizeFilename(title)
    if (format === 'copy') {
      navigator.clipboard?.writeText(text).catch(() => {})
      return
    }
    if (format === 'txt') {
      download(`${name}.txt`, text, 'text/plain')
    } else if (format === 'html') {
      download(`${name}.html`, buildHtmlDocument(title, html), 'text/html')
    } else if (format === 'md') {
      const body = html ? htmlToMarkdown(html) : text
      const md = (title.trim() ? `# ${title.trim()}\n\n` : '') + body
      download(`${name}.md`, md, 'text/markdown')
    }
  }

  const addToDictionary = (word: string) => {
    const w = word.toLowerCase().replace(/’/g, "'")
    setUserDict((prev) => {
      const next = new Set(prev).add(w)
      try {
        localStorage.setItem('writeright.dictionary', JSON.stringify([...next]))
      } catch {
        /* ignore */
      }
      return next
    })
    setActiveId(null)
  }

  // ---- Suggestions ----
  const sig = (s: Suggestion) => `${s.rule}::${s.original.toLowerCase()}`

  const visible = useMemo(
    () => result.suggestions.filter((s) => !dismissed.has(sig(s))),
    [result.suggestions, dismissed],
  )

  const tone = useMemo(() => detectTone(text), [text])

  const activeSuggestion = useMemo(
    () => visible.find((s) => s.id === activeId) ?? null,
    [visible, activeId],
  )

  const visibleResult: CheckResult = useMemo(() => {
    const categoryScores = result.categoryScores.map((cs) => ({
      ...cs,
      count: visible.filter((s) => s.category === cs.category).length,
    }))
    return { ...result, categoryScores }
  }, [result, visible])

  const applyFix = (s: Suggestion, replacement: string) => {
    editorRef.current?.applyReplacement(s.start, s.end, replacement)
    setActiveId(null)
  }

  const dismiss = (s: Suggestion) => {
    setDismissed((prev) => new Set(prev).add(sig(s)))
    if (activeId === s.id) setActiveId(null)
  }

  const loadSample = () => {
    setDismissed(new Set())
    setText(SAMPLE)
    setHtml('')
    setEpoch((e) => e + 1)
  }
  const clearAll = () => {
    setDismissed(new Set())
    setText('')
    setHtml('')
    setEpoch((e) => e + 1)
  }

  // ---- Render ----
  const content =
    view === 'home' ? (
      <DocsHome
        docs={docs.filter((d) => !d.deletedAt)}
        trashed={docs.filter((d) => d.deletedAt)}
        versions={versions}
        folders={folders}
        storage={{ docs: docs.length, bytes: storageBytes(), dictionary: userDict.size }}
        onCreateFolder={createFolder}
        onRenameFolder={renameFolder}
        onDeleteFolder={deleteFolder}
        onMoveDocToFolder={moveDocToFolder}
        onOpen={openDoc}
        onNew={createDoc}
        onNewFromTemplate={createFromTemplate}
        onUpload={uploadFiles}
        onDelete={deleteDoc}
        onDuplicate={duplicateDoc}
        onRestore={restoreDoc}
        onDeleteForever={deleteForever}
        onEmptyTrash={emptyTrash}
        onRestoreVersion={restoreVersion}
        onClearDictionary={clearDictionary}
        onClearAllData={clearAllData}
        onOpenSettings={() => setShowSettings(true)}
      />
    ) : (
      <div className="flex h-full w-full flex-col bg-ink-50/30">
      <Topbar
        title={title}
        onTitle={setTitle}
        stats={result.stats}
        onHome={goHome}
        onClear={clearAll}
        onSample={loadSample}
        onExport={exportDoc}
        onOpenSettings={() => setShowSettings(true)}
      />

      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 overflow-y-auto bg-ink-50 py-6">
          <div className="mx-auto flex h-full min-h-[70vh] max-w-3xl flex-col px-4">
            <div className="flex h-full min-h-[70vh] flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
              <Toolbar onCommand={() => editorRef.current?.focus()} />
              <div className="min-h-0 flex-1 overflow-hidden">
                <Editor
                  key={`${currentId}:${epoch}`}
                  ref={editorRef}
                  initialHtml={html}
                  initialText={text}
                  onChange={(plain, nextHtml) => {
                    setText(plain)
                    setHtml(nextHtml)
                  }}
                  suggestions={visible}
                  activeId={activeId}
                  onActivate={setActiveId}
                  onActiveRect={handleActiveRect}
                  showUnderlines={settings.underlines}
                />
              </div>
            </div>
          </div>
        </main>

        <Sidebar
          result={visibleResult}
          visible={visible}
          activeId={activeId}
          goals={goals}
          tone={tone}
          showTone={settings.tone}
          onGoals={setGoals}
          onActivate={setActiveId}
          onApply={applyFix}
          onDismiss={dismiss}
          onAddToDictionary={addToDictionary}
        />
      </div>

    </div>
    )

  return (
    <div className="h-screen w-screen overflow-hidden p-2 sm:p-3.5">
      <div className="mx-auto h-full max-w-[1520px] overflow-hidden rounded-4xl border border-white/70 bg-white/80 shadow-float">
        {content}
      </div>
      {view === 'editor' && settings.inlinePopup && activeSuggestion && activeRect && (
        <InlinePopup
          suggestion={activeSuggestion}
          rect={activeRect}
          onApply={(rep) => applyFix(activeSuggestion, rep)}
          onDismiss={() => dismiss(activeSuggestion)}
          onAddToDictionary={addToDictionary}
          onClose={() => setActiveId(null)}
        />
      )}

      {showSettings && (
        <SettingsModal
          settings={settings}
          onToggle={toggleSetting}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

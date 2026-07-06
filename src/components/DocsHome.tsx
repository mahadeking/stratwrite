import { useEffect, useRef, useState } from 'react'
import type { Doc, Version, Folder } from '../lib/store'
import { timeAgo, wordCount } from '../lib/store'
import { TEMPLATES, type Template } from '../lib/templates'

interface Props {
  docs: Doc[]
  trashed: Doc[]
  versions: Record<string, Version[]>
  folders: Folder[]
  storage: { docs: number; bytes: number; dictionary: number }
  onCreateFolder: (name: string) => void
  onRenameFolder: (id: string, name: string) => void
  onDeleteFolder: (id: string) => void
  onMoveDocToFolder: (docId: string, folderId: string | null) => void
  onOpen: (id: string) => void
  onNew: () => void
  onNewFromTemplate: (tpl: Template) => void
  onUpload: (files: File[]) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
  onRestore: (id: string) => void
  onDeleteForever: (id: string) => void
  onEmptyTrash: () => void
  onRestoreVersion: (docId: string, ts: number) => void
  onClearDictionary: () => void
  onClearAllData: () => void
  onOpenSettings: () => void
  dark: boolean
  onToggleTheme: () => void
}

type Nav = 'docs' | 'templates' | 'versions' | 'trash' | 'account' | 'apps' | 'support'

function previewOf(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean || 'Empty document'
}

function groupByRecency(docs: Doc[]): [string, Doc[]][] {
  const now = Date.now()
  const day = 86_400_000
  const buckets: Record<string, Doc[]> = { Today: [], Yesterday: [], 'Previous 7 days': [], Earlier: [] }
  for (const d of docs) {
    const age = now - d.updatedAt
    if (age < day) buckets.Today.push(d)
    else if (age < 2 * day) buckets.Yesterday.push(d)
    else if (age < 7 * day) buckets['Previous 7 days'].push(d)
    else buckets.Earlier.push(d)
  }
  return Object.entries(buckets).filter(([, arr]) => arr.length)
}

const TITLES: Record<Nav, string> = {
  docs: 'Docs',
  templates: 'Templates',
  versions: 'Version history',
  trash: 'Trash',
  account: 'Account',
  apps: 'Apps',
  support: 'Support',
}

export default function DocsHome(props: Props) {
  const { docs, trashed, versions, folders } = props
  const [nav, setNav] = useState<Nav>('docs')
  const [query, setQuery] = useState('')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [showUnlock, setShowUnlock] = useState(false)
  const [folderFilter, setFolderFilter] = useState<string | null>(null)
  const [addingFolder, setAddingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [navOpen, setNavOpen] = useState(false)
  const goNav = (n: Nav) => {
    setNav(n)
    setNavOpen(false)
  }
  const fileRef = useRef<HTMLInputElement>(null)

  const versionDocCount = Object.keys(versions).filter((k) => versions[k]?.length).length
  const activeFolder = folders.find((f) => f.id === folderFilter) ?? null
  const folderDocCount = (id: string) => docs.filter((d) => d.folderId === id).length

  const openDocs = () => {
    setNav('docs')
    setFolderFilter(null)
    setNavOpen(false)
  }
  const commitNewFolder = () => {
    if (newFolderName.trim()) props.onCreateFolder(newFolderName)
    setNewFolderName('')
    setAddingFolder(false)
  }

  const handleFiles = (list: FileList | null) => {
    if (list && list.length) props.onUpload(Array.from(list))
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="flex h-full w-full bg-white/60">
      {/* Mobile drawer backdrop */}
      {navOpen && (
        <div onClick={() => setNavOpen(false)} className="fixed inset-0 z-40 bg-ink-900/40 lg:hidden" />
      )}
      {/* Sidebar */}
      <aside
        className={`z-50 flex w-[248px] shrink-0 flex-col border-r border-ink-100 bg-ink-50/95 px-3 py-4 backdrop-blur transition-transform duration-200 max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:shadow-pop lg:static lg:translate-x-0 lg:bg-ink-50/50 lg:backdrop-blur-none ${
          navOpen ? 'translate-x-0' : 'max-lg:-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2 px-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-brand-500 to-violetish-500 text-white shadow-sm">
            <svg width="18" height="18" viewBox="0 0 32 32">
              <path d="M9 21.5 L16 8 L23 21.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11.6 16.5 H20.4" stroke="#c7d2fe" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            </svg>
          </span>
          <span className="text-[16px] font-700 tracking-tight text-ink-900" style={{ fontWeight: 700 }}>
            StratWrite
          </span>
          <span className="ml-1 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide text-brand-700">
            Free
          </span>
        </div>

        <nav className="mt-6 space-y-1">
          <NavItem active={nav === 'docs' && !folderFilter} onClick={openDocs} label="Docs" count={docs.length} icon={<DocIcon />} />
          <NavItem active={nav === 'templates'} onClick={() => goNav('templates')} label="Templates" icon={<TemplateIcon />} />
          <NavItem active={nav === 'versions'} onClick={() => goNav('versions')} label="Version history" count={versionDocCount} icon={<HistoryIcon />} />
          <NavItem active={nav === 'trash'} onClick={() => goNav('trash')} label="Trash" count={trashed.length} icon={<TrashIcon />} />
          <NavItem active={nav === 'account'} onClick={() => goNav('account')} label="Account" icon={<AccountIcon />} />
          <NavItem active={nav === 'apps'} onClick={() => goNav('apps')} label="Apps" badge="AI" icon={<AppsIcon />} />
        </nav>

        {/* Folders */}
        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between px-3">
            <span className="text-[11px] font-700 uppercase tracking-wide text-ink-400">Folders</span>
            <button
              onClick={() => setAddingFolder(true)}
              aria-label="New folder"
              className="grid h-5 w-5 place-items-center rounded text-ink-400 transition-colors hover:bg-white hover:text-ink-700"
            >
              <svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
            </button>
          </div>
          <div className="space-y-0.5">
            {addingFolder && (
              <input
                autoFocus
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onBlur={commitNewFolder}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitNewFolder()
                  if (e.key === 'Escape') {
                    setNewFolderName('')
                    setAddingFolder(false)
                  }
                }}
                placeholder="Folder name…"
                className="mx-1 w-[calc(100%-8px)] rounded-lg border border-brand-300 bg-white px-2.5 py-1.5 text-[13px] text-ink-700 outline-none"
              />
            )}
            {folders.length === 0 && !addingFolder && (
              <p className="px-3 py-1 text-[12px] text-ink-400">No folders yet.</p>
            )}
            {folders.map((f) => (
              <FolderRow
                key={f.id}
                name={f.name}
                count={folderDocCount(f.id)}
                active={nav === 'docs' && folderFilter === f.id}
                onClick={() => {
                  setNav('docs')
                  setFolderFilter(f.id)
                  setNavOpen(false)
                }}
                onDelete={() => {
                  props.onDeleteFolder(f.id)
                  if (folderFilter === f.id) setFolderFilter(null)
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-1">
          <NavItem active={nav === 'support'} onClick={() => goNav('support')} label="Support" icon={<HelpIcon />} />
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-600 text-[12px] font-700 text-white">S</span>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-600 text-ink-700">Transparency Strategies</div>
              <div className="text-[11px] text-ink-400">Free plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top band with actions cluster (AlignIQ-style) */}
        <div className="flex h-16 shrink-0 items-center justify-end gap-2.5 px-4 sm:px-8">
          <button
            onClick={() => setNavOpen(true)}
            aria-label="Open menu"
            className="mr-auto grid h-10 w-10 place-items-center rounded-full bg-white text-ink-600 shadow-card lg:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            onClick={() => setShowUnlock(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-delivery/30 bg-[#f3efff] px-3.5 py-2 text-[12.5px] font-700 text-delivery transition-colors hover:bg-[#ebe4ff]"
          >
            ✨ Unlock AI features
          </button>
          <button aria-label="Notifications" className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-ink-500 shadow-card transition-colors hover:text-ink-800">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M6 9a6 6 0 0112 0c0 5 2 6 2 6H4s2-1 2-6M9.5 20a2.5 2.5 0 005 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-correctness ring-2 ring-white" />
          </button>
          <button
            onClick={props.onToggleTheme}
            aria-label={props.dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={props.dark ? 'Light mode' : 'Dark mode'}
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-500 shadow-card transition-colors hover:text-ink-800"
          >
            {props.dark ? (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <button onClick={props.onOpenSettings} aria-label="Settings" className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink-500 shadow-card transition-colors hover:text-ink-800">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7.7 1.6 1.6 0 01-3.2 0 1.6 1.6 0 00-2.7-.7l-.1.1A2 2 0 114 16.9l.1-.1a1.6 1.6 0 00-.7-2.7 1.6 1.6 0 010-3.2 1.6 1.6 0 00.7-2.7L4 8.1A2 2 0 116.9 5.3l.1.1a1.6 1.6 0 001.8.3 1.6 1.6 0 001-1.5 1.6 1.6 0 013.2 0 1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1A2 2 0 1120 8.1l-.1.1a1.6 1.6 0 00-.3 1.8 1.6 1.6 0 001.5 1 1.6 1.6 0 010 3.2 1.6 1.6 0 00-1.5 1z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violetish-500 text-[13px] font-700 text-white shadow-sm">S</span>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 px-4 pb-1 pt-5 sm:px-8">
          <h1 className="text-[26px] font-700 tracking-tight text-ink-900" style={{ fontWeight: 700 }}>
            {nav === 'docs' && activeFolder ? activeFolder.name : TITLES[nav]}
          </h1>
          {nav === 'docs' && activeFolder && (
            <button
              onClick={openDocs}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-[12.5px] font-600 text-brand-700 transition-colors hover:bg-brand-100"
            >
              📁 In “{activeFolder.name}”
              <span className="text-brand-400">✕</span>
            </button>
          )}

          {nav === 'docs' && (
            <>
              <button
                onClick={props.onNew}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-violetish-500 px-4 py-2 text-[13.5px] font-600 text-white shadow-sm transition-all hover:from-brand-700 hover:to-violetish-600"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
                New doc
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-4 py-2 text-[13.5px] font-600 text-ink-700 shadow-card transition-colors hover:border-ink-300 hover:bg-ink-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M12 16V4m0 0l-5 5m5-5l5 5M4 20h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Upload
              </button>
              <input ref={fileRef} type="file" multiple accept=".txt,.md,.markdown,.html,.htm,text/plain,text/html" className="hidden" onChange={(e) => handleFiles(e.target.files)} />
            </>
          )}

          {nav === 'trash' && trashed.length > 0 && (
            <button
              onClick={props.onEmptyTrash}
              className="inline-flex items-center gap-1.5 rounded-lg border border-correctness/30 bg-white px-3.5 py-2 text-[13.5px] font-600 text-correctness transition-colors hover:bg-red-50"
            >
              Empty trash
            </button>
          )}

          {(nav === 'docs' || nav === 'trash' || nav === 'versions') && (
            <div className="relative w-full sm:ml-auto sm:w-auto">
              <svg width="16" height="16" viewBox="0 0 24 24" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300">
                <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full rounded-full border border-ink-200 bg-white py-2 pl-8 pr-3 text-[13.5px] text-ink-700 shadow-card outline-none placeholder:text-ink-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 sm:w-60"
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          {nav === 'docs' && (
            <DocGrid
              docs={folderFilter ? docs.filter((d) => d.folderId === folderFilter) : docs}
              query={query}
              trashed={false}
              folders={folders}
              menuId={menuId}
              confirmId={confirmId}
              setMenuId={setMenuId}
              setConfirmId={setConfirmId}
              onOpen={props.onOpen}
              onNew={props.onNew}
              onDuplicate={props.onDuplicate}
              onDelete={props.onDelete}
              onRestore={props.onRestore}
              onDeleteForever={props.onDeleteForever}
              onMoveToFolder={props.onMoveDocToFolder}
            />
          )}
          {nav === 'trash' && (
            <DocGrid
              docs={trashed}
              query={query}
              trashed
              menuId={menuId}
              confirmId={confirmId}
              setMenuId={setMenuId}
              setConfirmId={setConfirmId}
              onOpen={props.onOpen}
              onNew={props.onNew}
              onDuplicate={props.onDuplicate}
              onDelete={props.onDelete}
              onRestore={props.onRestore}
              onDeleteForever={props.onDeleteForever}
            />
          )}
          {nav === 'templates' && <TemplatesPanel onUse={props.onNewFromTemplate} />}
          {nav === 'versions' && (
            <VersionsPanel docs={docs} versions={versions} query={query} onRestore={props.onRestoreVersion} />
          )}
          {nav === 'account' && (
            <AccountPanel storage={props.storage} onClearDictionary={props.onClearDictionary} onClearAllData={props.onClearAllData} />
          )}
          {nav === 'apps' && <AppsPanel onUnlock={() => setShowUnlock(true)} />}
          {nav === 'support' && <SupportPanel />}
        </div>
      </main>

      {showUnlock && <UnlockModal onClose={() => setShowUnlock(false)} />}
    </div>
  )
}

/* ---------------- Doc grid ---------------- */

function DocGrid({
  docs,
  query,
  trashed,
  folders = [],
  menuId,
  confirmId,
  setMenuId,
  setConfirmId,
  onOpen,
  onNew,
  onDuplicate,
  onDelete,
  onRestore,
  onDeleteForever,
  onMoveToFolder,
}: {
  docs: Doc[]
  query: string
  trashed: boolean
  folders?: Folder[]
  menuId: string | null
  confirmId: string | null
  setMenuId: (id: string | null) => void
  setConfirmId: (id: string | null) => void
  onOpen: (id: string) => void
  onNew: () => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  onDeleteForever: (id: string) => void
  onMoveToFolder?: (docId: string, folderId: string | null) => void
}) {
  const q = query.trim().toLowerCase()
  const filtered = q ? docs.filter((d) => d.title.toLowerCase().includes(q) || d.text.toLowerCase().includes(q)) : docs
  const groups: [string, Doc[]][] = trashed ? [['In Trash', filtered]] : groupByRecency(filtered)

  if (docs.length === 0) return trashed ? <Empty icon="🗑️" title="Trash is empty" sub="Deleted documents will appear here." /> : <Empty icon="📝" title="No documents yet" sub="Create a document or upload a file to get started." action={{ label: 'New document', onClick: onNew }} />
  if (filtered.length === 0) return <div className="mt-16 text-center text-[15px] font-600 text-ink-500">No results for “{query}”.</div>

  return (
    <div className="space-y-8">
      {groups.map(([label, list]) => (
        <section key={label}>
          <h2 className="mb-3 text-[13px] font-600 text-ink-400">{label}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((d) => (
              <DocCard
                key={d.id}
                doc={d}
                trashed={trashed}
                folders={folders}
                onMoveToFolder={onMoveToFolder}
                menuOpen={menuId === d.id}
                confirming={confirmId === d.id}
                onOpen={() => (trashed ? undefined : onOpen(d.id))}
                onToggleMenu={() => {
                  setMenuId(menuId === d.id ? null : d.id)
                  setConfirmId(null)
                }}
                onDuplicate={() => {
                  onDuplicate(d.id)
                  setMenuId(null)
                }}
                onDelete={() => {
                  onDelete(d.id)
                  setMenuId(null)
                }}
                onRestore={() => {
                  onRestore(d.id)
                  setMenuId(null)
                }}
                onAskDelete={() => setConfirmId(d.id)}
                onCancelDelete={() => setConfirmId(null)}
                onConfirmDelete={() => {
                  onDeleteForever(d.id)
                  setConfirmId(null)
                  setMenuId(null)
                }}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/* ---------------- Templates ---------------- */

function TemplatesPanel({ onUse }: { onUse: (tpl: Template) => void }) {
  return (
    <div>
      <p className="mb-5 max-w-xl text-[13.5px] text-ink-500">
        Start faster with a ready-made structure. Pick a template and StratWrite creates a new
        document you can fill in — grammar, clarity, and tone checks work right away.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onUse(t)}
            className="group flex h-44 flex-col rounded-2xl border border-ink-100/70 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-2xl">{t.icon}</span>
            <h3 className="mt-3 text-[15px] font-600 text-ink-900">{t.title}</h3>
            <p className="mt-1 line-clamp-2 flex-1 text-[12.5px] leading-relaxed text-ink-500">{t.blurb}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-600 text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
              Use template
              <svg width="14" height="14" viewBox="0 0 24 24">
                <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Version history ---------------- */

function VersionsPanel({
  docs,
  versions,
  query,
  onRestore,
}: {
  docs: Doc[]
  versions: Record<string, Version[]>
  query: string
  onRestore: (docId: string, ts: number) => void
}) {
  const q = query.trim().toLowerCase()
  const withVersions = docs.filter((d) => (versions[d.id]?.length ?? 0) > 0 && (!q || d.title.toLowerCase().includes(q)))

  if (withVersions.length === 0)
    return <Empty icon="🕘" title="No version history yet" sub="Edit a document and leave it — StratWrite saves a snapshot you can restore." />

  return (
    <div className="space-y-6">
      {withVersions.map((d) => (
        <section key={d.id} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <h3 className="mb-3 text-[15px] font-600 text-ink-900">{d.title.trim() || 'Untitled document'}</h3>
          <ul className="space-y-2">
            {versions[d.id].map((v) => (
              <li key={v.ts} className="flex items-center gap-3 rounded-lg border border-ink-100 px-3 py-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink-50 text-ink-400">🕘</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-600 text-ink-700">{timeAgo(v.ts)}</div>
                  <div className="truncate text-[12px] text-ink-400">{wordCount(v.text)} words · {previewOf(v.text).slice(0, 50)}</div>
                </div>
                <button
                  onClick={() => onRestore(d.id, v.ts)}
                  className="rounded-lg border border-ink-200 px-3 py-1.5 text-[12.5px] font-600 text-ink-700 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

/* ---------------- Account ---------------- */

function AccountPanel({
  storage,
  onClearDictionary,
  onClearAllData,
}: {
  storage: { docs: number; bytes: number; dictionary: number }
  onClearDictionary: () => void
  onClearAllData: () => void
}) {
  const [confirmClear, setConfirmClear] = useState(false)
  const kb = (storage.bytes / 1024).toFixed(1)

  return (
    <div className="max-w-2xl space-y-5">
      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-600 text-[16px] font-700 text-white">S</span>
          <div>
            <div className="text-[15px] font-700 text-ink-900" style={{ fontWeight: 700 }}>Transparency Strategies</div>
            <div className="text-[13px] text-ink-500">Free plan · no account needed</div>
          </div>
          <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-[12px] font-600 text-brand-700">Free</span>
        </div>
      </div>

      <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
        <h3 className="text-[14px] font-700 text-ink-900" style={{ fontWeight: 700 }}>Storage</h3>
        <p className="mt-1 text-[13px] text-ink-500">Everything is stored privately in this browser.</p>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <Stat label="Documents" value={storage.docs} />
          <Stat label="Dictionary words" value={storage.dictionary} />
          <Stat label="Space used" value={`${kb} KB`} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={onClearDictionary} className="rounded-lg border border-ink-200 px-3 py-2 text-[13px] font-600 text-ink-700 transition-colors hover:bg-ink-50">
            Clear personal dictionary
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-correctness/30 bg-white p-5 shadow-card">
        <h3 className="text-[14px] font-700 text-correctness" style={{ fontWeight: 700 }}>Danger zone</h3>
        <p className="mt-1 text-[13px] text-ink-500">Permanently delete all documents, versions, and settings from this browser.</p>
        {!confirmClear ? (
          <button onClick={() => setConfirmClear(true)} className="mt-3 rounded-lg bg-correctness px-3 py-2 text-[13px] font-600 text-white transition hover:brightness-95">
            Clear all data
          </button>
        ) : (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[13px] font-600 text-ink-700">Delete everything?</span>
            <button onClick={onClearAllData} className="rounded-lg bg-correctness px-3 py-2 text-[13px] font-600 text-white hover:brightness-95">Yes, delete all</button>
            <button onClick={() => setConfirmClear(false)} className="rounded-lg bg-ink-100 px-3 py-2 text-[13px] font-600 text-ink-600 hover:bg-ink-200">Cancel</button>
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-ink-100 bg-ink-50/60 px-3 py-2.5">
      <div className="text-lg font-700 text-ink-900" style={{ fontWeight: 700 }}>{value}</div>
      <div className="text-[11px] font-500 uppercase tracking-wide text-ink-400">{label}</div>
    </div>
  )
}

/* ---------------- Apps ---------------- */

function AppsPanel({ onUnlock }: { onUnlock: () => void }) {
  const apps = [
    { icon: '🌐', title: 'StratWrite for Chrome', desc: 'Check your writing on any website.', tag: 'Planned' },
    { icon: '🪟', title: 'StratWrite for Windows', desc: 'Suggestions across your desktop apps.', tag: 'Planned' },
    { icon: '📱', title: 'StratWrite for Mobile', desc: 'A keyboard that writes right, anywhere.', tag: 'Planned' },
  ]
  return (
    <div className="max-w-3xl space-y-5">
      <div className="rounded-xl border border-delivery/30 bg-[#f7f4ff] p-5">
        <h3 className="text-[15px] font-700 text-ink-900" style={{ fontWeight: 700 }}>✨ AI writing tools</h3>
        <p className="mt-1 text-[13px] text-ink-600">Rewrite, paraphrase, humanize, summarize, and chat — built in and ready. Add an Anthropic API key to switch them on.</p>
        <button onClick={onUnlock} className="mt-3 rounded-lg bg-delivery px-3.5 py-2 text-[13px] font-600 text-white transition hover:brightness-95">Unlock AI features</button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {apps.map((a) => (
          <div key={a.title} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
            <div className="text-2xl">{a.icon}</div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[14px] font-600 text-ink-800">{a.title}</span>
            </div>
            <p className="mt-1 text-[12.5px] text-ink-500">{a.desc}</p>
            <span className="mt-3 inline-block rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-600 text-ink-500">{a.tag}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------------- Support ---------------- */

function SupportPanel() {
  return (
    <div className="max-w-2xl space-y-5">
      <Card title="Getting started">
        <ul className="list-disc space-y-1.5 pl-5 text-[13.5px] text-ink-600">
          <li>Click <b>New doc</b> to start writing, or <b>Upload</b> to import a .txt, .md, or .html file.</li>
          <li>As you type, colored wavy underlines flag issues. Open the <b>Review</b> panel to accept fixes.</li>
          <li>Check the <b>Tone</b> tab to see how your writing sounds, and <b>Goals</b> to set your audience.</li>
          <li>Use the <b>Download</b> button to export as text, HTML, or Markdown.</li>
        </ul>
      </Card>
      <Card title="Your suggestions">
        <p className="text-[13.5px] text-ink-600">Four categories, each with its own color: <span className="font-600 text-correctness">Correctness</span>, <span className="font-600 text-clarity">Clarity</span>, <span className="font-600 text-engagement">Engagement</span>, and <span className="font-600 text-delivery">Delivery</span>. Click a card to accept a fix, jump to the next, add a word to your dictionary, or read “Learn more”.</p>
      </Card>
      <Card title="Privacy">
        <p className="text-[13.5px] text-ink-600">StratWrite runs entirely in your browser. Your documents never leave your device, and all checking works offline — no account, no sign-in, no cost.</p>
      </Card>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <h3 className="mb-2 text-[14px] font-700 text-ink-900" style={{ fontWeight: 700 }}>{title}</h3>
      {children}
    </div>
  )
}

/* ---------------- Unlock AI modal ---------------- */

function UnlockModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="animate-pop w-full max-w-md rounded-2xl bg-white p-6 shadow-pop">
        <div className="text-3xl">✨</div>
        <h2 className="mt-2 text-[18px] font-700 text-ink-900" style={{ fontWeight: 700 }}>Unlock AI features</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">
          Generative tools — rewrite, paraphrase, humanize, summarize, and chat — are built in and ready.
          They run on Claude and need an <b>Anthropic API key</b> (pay-as-you-go, from about $5).
          Everything else in StratWrite stays free forever.
        </p>
        <ul className="mt-3 space-y-1 text-[13px] text-ink-600">
          <li>✍️ Rewrite &amp; adjust tone</li>
          <li>📝 Paraphrase &amp; humanize</li>
          <li>💬 AI chat &amp; drafting</li>
        </ul>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg bg-brand-600 px-4 py-2 text-[13.5px] font-600 text-white transition-colors hover:bg-brand-700">Got it</button>
        </div>
      </div>
    </div>
  )
}

/* ---------------- shared bits ---------------- */

function Empty({ icon, title, sub, action }: { icon: string; title: string; sub: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-ink-50 text-3xl">{icon}</div>
      <h2 className="mt-4 text-lg font-700 text-ink-900" style={{ fontWeight: 700 }}>{title}</h2>
      <p className="mt-1.5 text-[14px] text-ink-500">{sub}</p>
      {action && (
        <button onClick={action.onClick} className="mt-5 rounded-lg bg-brand-600 px-4 py-2.5 text-[14px] font-600 text-white shadow-sm transition-colors hover:bg-brand-700">
          {action.label}
        </button>
      )}
    </div>
  )
}

function NavItem({ active, onClick, label, count, badge, icon }: { active: boolean; onClick: () => void; label: string; count?: number; badge?: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-[14px] font-600 transition-colors ${
        active ? 'bg-white text-ink-900 shadow-card' : 'text-ink-600 hover:bg-white/70'
      }`}
    >
      <span className={active ? 'text-brand-600' : 'text-ink-400'}>{icon}</span>
      {label}
      {count && count > 0 ? (
        <span className="ml-auto rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-600 text-ink-500">{count}</span>
      ) : badge ? (
        <span className="ml-auto rounded-full bg-delivery/10 px-1.5 py-0.5 text-[10px] font-700 text-delivery">{badge}</span>
      ) : null}
    </button>
  )
}

function FolderRow({
  name,
  count,
  active,
  onClick,
  onDelete,
}: {
  name: string
  count: number
  active: boolean
  onClick: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`group/f flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13.5px] font-500 transition-colors ${
        active ? 'bg-white text-ink-900 shadow-card' : 'text-ink-600 hover:bg-white/70'
      }`}
    >
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
        <span className={active ? 'text-brand-600' : 'text-ink-400'}>📁</span>
        <span className="truncate">{name}</span>
      </button>
      {count > 0 && <span className="text-[11px] text-ink-400">{count}</span>}
      <button
        onClick={onDelete}
        aria-label={`Delete folder ${name}`}
        className="grid h-5 w-5 shrink-0 place-items-center rounded text-ink-300 opacity-0 transition-all hover:bg-ink-100 hover:text-correctness group-hover/f:opacity-100"
      >
        <svg width="13" height="13" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
    </div>
  )
}

/* ---------------- Doc card ---------------- */

interface CardProps {
  doc: Doc
  trashed: boolean
  folders?: Folder[]
  onMoveToFolder?: (docId: string, folderId: string | null) => void
  menuOpen: boolean
  confirming: boolean
  onOpen: () => void
  onToggleMenu: () => void
  onDuplicate: () => void
  onDelete: () => void
  onRestore: () => void
  onAskDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}

function DocCard(props: CardProps) {
  const { doc, trashed, menuOpen, confirming, folders = [], onMoveToFolder } = props
  const menuRef = useRef<HTMLDivElement>(null)
  const [sub, setSub] = useState<'main' | 'folders'>('main')
  const currentFolder = folders.find((f) => f.id === doc.folderId) ?? null

  useEffect(() => {
    if (!menuOpen) {
      setSub('main')
      return
    }
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) props.onToggleMenu()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onClick={trashed ? undefined : props.onOpen}
      className={`group relative flex h-48 flex-col rounded-2xl border border-ink-100/70 bg-white p-4 shadow-card transition-all ${
        trashed ? '' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-pop'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-md bg-ink-50 px-2 py-0.5 text-[11px] font-600 text-ink-500">{wordCount(doc.text)} words</span>
        <div ref={menuRef} className="relative">
          <button
            aria-label="More actions"
            onClick={(e) => {
              e.stopPropagation()
              props.onToggleMenu()
            }}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-400 opacity-0 transition-all hover:bg-ink-100 group-hover:opacity-100 aria-[expanded=true]:opacity-100"
            aria-expanded={menuOpen}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <circle cx="5" cy="12" r="1.6" fill="currentColor" />
              <circle cx="12" cy="12" r="1.6" fill="currentColor" />
              <circle cx="19" cy="12" r="1.6" fill="currentColor" />
            </svg>
          </button>
          {menuOpen && (
            <div onClick={(e) => e.stopPropagation()} className="animate-pop absolute right-0 top-8 z-20 w-44 overflow-hidden rounded-xl border border-ink-100 bg-white py-1 shadow-pop">
              {trashed ? (
                !confirming ? (
                  <>
                    <MenuBtn onClick={props.onRestore}>Restore</MenuBtn>
                    <MenuBtn danger onClick={props.onAskDelete}>Delete forever</MenuBtn>
                  </>
                ) : (
                  <ConfirmDelete onConfirm={props.onConfirmDelete} onCancel={props.onCancelDelete} />
                )
              ) : sub === 'folders' ? (
                <div className="py-0.5">
                  <button
                    onClick={() => setSub('main')}
                    className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-[12px] font-600 text-ink-400 hover:text-ink-700"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Move to folder
                  </button>
                  <div className="max-h-52 overflow-y-auto">
                    {folders.length === 0 && <p className="px-3 py-1.5 text-[12.5px] text-ink-400">No folders yet.</p>}
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => {
                          onMoveToFolder?.(doc.id, f.id)
                          props.onToggleMenu()
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50"
                      >
                        <span>📁</span>
                        <span className="flex-1 truncate">{f.name}</span>
                        {doc.folderId === f.id && <span className="text-brand-600">✓</span>}
                      </button>
                    ))}
                  </div>
                  {doc.folderId && (
                    <MenuBtn
                      onClick={() => {
                        onMoveToFolder?.(doc.id, null)
                        props.onToggleMenu()
                      }}
                    >
                      Remove from folder
                    </MenuBtn>
                  )}
                </div>
              ) : (
                <>
                  <MenuBtn onClick={props.onDuplicate}>Duplicate</MenuBtn>
                  {onMoveToFolder && (
                    <button
                      onClick={() => setSub('folders')}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-[13.5px] text-ink-700 transition-colors hover:bg-ink-50"
                    >
                      Move to folder
                      <svg width="14" height="14" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    </button>
                  )}
                  <MenuBtn danger onClick={props.onDelete}>Move to trash</MenuBtn>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <h3 className="mt-2 line-clamp-1 text-[15px] font-600 text-ink-900">{doc.title.trim() || 'Untitled document'}</h3>
      <p className="mt-1.5 line-clamp-3 flex-1 text-[13px] leading-relaxed text-ink-500">{previewOf(doc.text)}</p>
      <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-400">
        <span>{trashed ? 'Deleted' : 'Edited'} {timeAgo(doc.deletedAt ?? doc.updatedAt)}</span>
        {currentFolder && !trashed && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-600 text-brand-700">
            📁 {currentFolder.name}
          </span>
        )}
      </div>
    </div>
  )
}

function MenuBtn({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center px-3 py-2 text-left text-[13.5px] transition-colors ${danger ? 'text-correctness hover:bg-red-50' : 'text-ink-700 hover:bg-ink-50'}`}>
      {children}
    </button>
  )
}

function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="px-3 py-2">
      <p className="text-[12.5px] text-ink-600">Delete forever?</p>
      <div className="mt-2 flex gap-1.5">
        <button onClick={onConfirm} className="flex-1 rounded-md bg-correctness px-2 py-1.5 text-[12.5px] font-600 text-white hover:brightness-95">Delete</button>
        <button onClick={onCancel} className="flex-1 rounded-md bg-ink-100 px-2 py-1.5 text-[12.5px] font-600 text-ink-600 hover:bg-ink-200">Cancel</button>
      </div>
    </div>
  )
}

/* ---------------- icons ---------------- */

function DocIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24"><path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M14 3v4h4M9 13h6M9 17h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>)
}
function TemplateIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 9h16M9 9v11" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>)
}
function HistoryIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 12a9 9 0 109-9 9 9 0 00-7 3.3M3 4v3.3h3.3M12 7v5l4 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>)
}
function TrashIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0v12a1 1 0 01-1 1H7a1 1 0 01-1-1V7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>)
}
function AccountIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>)
}
function AppsIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="4" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" /><rect x="4" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" /><rect x="14" y="14" width="6" height="6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>)
}
function HelpIcon() {
  return (<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M9.5 9a2.5 2.5 0 013.9-1.9c1.6 1 .6 2.9-.9 3.4-.7.2-1 .7-1 1.5M12 16.5v.01" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>)
}

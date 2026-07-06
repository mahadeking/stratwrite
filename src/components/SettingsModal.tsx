export interface Settings {
  spelling: boolean
  grammarStyle: boolean
  underlines: boolean
  inlinePopup: boolean
  tone: boolean
  dark: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  spelling: true,
  grammarStyle: true,
  underlines: true,
  inlinePopup: true,
  tone: true,
  dark: true,
}

interface Props {
  settings: Settings
  onToggle: (key: keyof Settings) => void
  onClose: () => void
}

const TOGGLES: { key: keyof Settings; label: string; desc: string }[] = [
  { key: 'spelling', label: 'Check spelling', desc: 'Underline misspelled words and suggest corrections.' },
  { key: 'grammarStyle', label: 'Check grammar & style', desc: 'Flag clarity, engagement, and delivery issues.' },
  { key: 'underlines', label: 'Show underlines in the editor', desc: 'Highlight issues inline as you write.' },
  { key: 'inlinePopup', label: 'Inline suggestion popup', desc: 'Show a card when you click an underlined word.' },
  { key: 'tone', label: 'Tone detection', desc: 'Analyze how your writing sounds.' },
]

const SHORTCUTS: { name: string; keys: string[] }[] = [
  { name: 'Bold', keys: ['Ctrl', 'B'] },
  { name: 'Italic', keys: ['Ctrl', 'I'] },
  { name: 'Underline', keys: ['Ctrl', 'U'] },
  { name: 'Save', keys: ['Automatic'] },
]

export default function SettingsModal({ settings, onToggle, onClose }: Props) {
  const toggle = (key: keyof Settings) => onToggle(key)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-pop"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5">
          <h2 className="text-[16px] font-700 text-ink-900" style={{ fontWeight: 700 }}>
            Settings
          </h2>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-700"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Quick settings */}
          <h3 className="mb-1 text-[14px] font-700 text-ink-900" style={{ fontWeight: 700 }}>
            Quick settings
          </h3>
          <p className="mb-3 text-[12.5px] text-ink-500">Turn StratWrite’s checks on or off. Changes apply instantly.</p>

          <div className="divide-y divide-ink-50">
            {TOGGLES.map((t) => (
              <div key={t.key} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-600 text-ink-800">{t.label}</div>
                  <div className="text-[12px] text-ink-500">{t.desc}</div>
                </div>
                <Toggle on={settings[t.key]} onClick={() => toggle(t.key)} label={t.label} />
              </div>
            ))}
          </div>

          {/* Appearance */}
          <h3 className="mb-1 mt-5 text-[14px] font-700 text-ink-900" style={{ fontWeight: 700 }}>
            Appearance
          </h3>
          <div className="flex items-center gap-3 border-t border-ink-50 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[13.5px] font-600 text-ink-800">Dark mode</div>
              <div className="text-[12px] text-ink-500">Use a dark colour theme across the app.</div>
            </div>
            <Toggle on={settings.dark} onClick={() => toggle('dark')} label="Dark mode" />
          </div>

          {/* Shortcuts */}
          <h3 className="mb-1 mt-5 text-[14px] font-700 text-ink-900" style={{ fontWeight: 700 }}>
            Keyboard shortcuts
          </h3>
          <p className="mb-3 text-[12.5px] text-ink-500">Formatting shortcuts that work in the editor.</p>
          <div className="divide-y divide-ink-50">
            {SHORTCUTS.map((s) => (
              <div key={s.name} className="flex items-center justify-between py-2.5">
                <span className="text-[13.5px] font-600 text-ink-800">{s.name}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <kbd
                      key={k}
                      className="rounded-md border border-ink-200 bg-ink-50 px-2 py-0.5 text-[11.5px] font-600 text-ink-600"
                    >
                      {k}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-ink-100 px-5 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-lg bg-brand-600 px-4 py-2 text-[13.5px] font-600 text-white transition-colors hover:bg-brand-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        on ? 'bg-gradient-to-r from-brand-600 to-violetish-500' : 'bg-ink-200'
      }`}
    >
      <span
        className={`absolute top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow-sm transition-all ${
          on ? 'left-[22px]' : 'left-0.5'
        }`}
      >
        {on && (
          <svg width="11" height="11" viewBox="0 0 24 24" className="text-brand-600">
            <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  )
}

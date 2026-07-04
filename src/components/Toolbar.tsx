import type { ReactNode } from 'react'

interface Props {
  onCommand: () => void
}

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value)
}

export default function Toolbar({ onCommand }: Props) {
  // Run a command while keeping the editor selection (mousedown preventDefault).
  const run = (fn: () => void) => (e: React.MouseEvent) => {
    e.preventDefault()
    fn()
    onCommand()
  }

  const makeLink = () => {
    const url = window.prompt('Link URL:', 'https://')
    if (url) exec('createLink', url)
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-ink-100 bg-white px-3 py-1.5">
      <Btn label="Bold" onMouseDown={run(() => exec('bold'))}>
        <span className="font-700 text-[15px]" style={{ fontWeight: 700 }}>B</span>
      </Btn>
      <Btn label="Italic" onMouseDown={run(() => exec('italic'))}>
        <span className="italic text-[15px] font-serif">I</span>
      </Btn>
      <Btn label="Underline" onMouseDown={run(() => exec('underline'))}>
        <span className="text-[15px] underline">U</span>
      </Btn>

      <Divider />

      <Btn label="Heading 1" onMouseDown={run(() => exec('formatBlock', 'H1'))}>
        <span className="text-[13px] font-700" style={{ fontWeight: 700 }}>H1</span>
      </Btn>
      <Btn label="Heading 2" onMouseDown={run(() => exec('formatBlock', 'H2'))}>
        <span className="text-[13px] font-700" style={{ fontWeight: 700 }}>H2</span>
      </Btn>
      <Btn label="Normal text" onMouseDown={run(() => exec('formatBlock', 'P'))}>
        <span className="text-[12px] font-600">¶</span>
      </Btn>

      <Divider />

      <Btn label="Bulleted list" onMouseDown={run(() => exec('insertUnorderedList'))}>
        <Icon>
          <circle cx="4" cy="6" r="1.5" fill="currentColor" />
          <circle cx="4" cy="12" r="1.5" fill="currentColor" />
          <circle cx="4" cy="18" r="1.5" fill="currentColor" />
          <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </Icon>
      </Btn>
      <Btn label="Numbered list" onMouseDown={run(() => exec('insertOrderedList'))}>
        <Icon>
          <path d="M9 6h11M9 12h11M9 18h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <text x="2" y="8" fontSize="7" fill="currentColor" fontWeight="700">1</text>
          <text x="2" y="14.5" fontSize="7" fill="currentColor" fontWeight="700">2</text>
          <text x="2" y="21" fontSize="7" fill="currentColor" fontWeight="700">3</text>
        </Icon>
      </Btn>
      <Btn label="Insert link" onMouseDown={run(makeLink)}>
        <Icon>
          <path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 10-5.66-5.66l-1.5 1.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 105.66 5.66l1.5-1.5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        </Icon>
      </Btn>

      <Divider />

      <Btn label="Clear formatting" onMouseDown={run(() => { exec('removeFormat'); exec('formatBlock', 'P') })}>
        <Icon>
          <path d="M6 5h12M9 5l-2 14M13 5l1 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 16l5 5M19 16l-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </Icon>
      </Btn>
    </div>
  )
}

function Btn({
  label,
  onMouseDown,
  children,
}: {
  label: string
  onMouseDown: (e: React.MouseEvent) => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={onMouseDown}
      className="grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-ink-100" />
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      {children}
    </svg>
  )
}

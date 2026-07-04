interface Feature {
  icon: string
  title: string
  desc: string
}

const FEATURES: Feature[] = [
  { icon: '✍️', title: 'Rewrite', desc: 'Rephrase any sentence for clarity and flow.' },
  { icon: '🎯', title: 'Adjust tone', desc: 'Make it more formal, friendly, or confident.' },
  { icon: '📝', title: 'Paraphrase', desc: 'Say it a different way without losing meaning.' },
  { icon: '🧑‍🤝‍🧑', title: 'Humanize', desc: 'Make AI-assisted text sound natural.' },
  { icon: '📄', title: 'Summarize', desc: 'Condense long text into key points.' },
  { icon: '💬', title: 'AI chat', desc: 'Ask for a draft, an outline, or ideas.' },
]

export default function AIPanel() {
  return (
    <div className="p-4">
      <div className="mb-4 rounded-xl border border-delivery/30 bg-gradient-to-br from-[#f5f2ff] to-white p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-delivery/15 text-delivery">✦</span>
          <h3 className="text-sm font-700 text-ink-900" style={{ fontWeight: 700 }}>
            AI Assistant
          </h3>
          <span className="ml-auto rounded-full bg-delivery/10 px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide text-delivery">
            Locked
          </span>
        </div>
        <p className="mt-2 text-[12.5px] leading-relaxed text-ink-600">
          Generative AI features are built in and ready. Add an Anthropic API key to unlock
          rewrites, tone adjustment, paraphrasing, and chat — powered by Claude.
        </p>
        <button
          disabled
          className="mt-3 w-full cursor-not-allowed rounded-lg bg-delivery/90 px-3 py-2 text-[13px] font-600 text-white opacity-70"
        >
          Connect API key to enable
        </button>
      </div>

      <div className="space-y-2">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-3 opacity-90"
          >
            <span className="text-lg">{f.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-600 text-ink-800">{f.title}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" className="text-ink-300">
                  <path
                    d="M6 10V8a6 6 0 1112 0v2m-9 0h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6a2 2 0 012-2z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-[12.5px] text-ink-500">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

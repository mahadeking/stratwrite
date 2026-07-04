# StratWrite — AI Writing Assistant

A Grammarly-style writing assistant. **Phase 1 (free build):** real-time spelling,
grammar, clarity, engagement, and delivery checking that runs entirely in your
browser — no API key, no payment, no data leaves your machine.

## Features (working now, $0)

- ✍️ **Live editor** with inline colored underlines (Grammarly-style)
- 🔴 **Correctness** — spelling, repeated words, punctuation & spacing, a/an, capitalization
- 🔵 **Clarity** — wordy phrases, hard-to-read (long) sentences
- 🟢 **Engagement** — weak intensifiers, clichés
- 🟣 **Delivery** — passive voice, hedging language
- 🎯 **Suggestion cards** — accept a fix or dismiss, one click
- 📊 **Performance score** (0–100) with a category breakdown
- 📈 **Document insights** — word/char/sentence counts, reading time, readability & grade level
- 🎛️ **Goals** — audience, formality, intent, domain

## Ready to unlock later (needs an Anthropic API key)

The **Assistant** tab shows the generative-AI features (rewrite, tone adjust,
paraphrase, humanize, summarize, chat). They're wired up and ready — add a key to
enable them. No key or payment is required to use everything above.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (default http://localhost:5178).

## Tech

Vite + React + TypeScript + Tailwind CSS. Spelling uses a bundled English word list
(`an-array-of-english-words`) with a Norvig-style corrector; all other checks are a
custom rule engine in `src/lib/`.

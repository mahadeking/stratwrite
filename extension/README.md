# StratWrite Browser Extension

A Grammarly-style browser extension that gives you StratWrite's writing suggestions
(spelling, grammar, clarity, engagement, delivery) in **any editable field on any website** —
email, social posts, forms, comment boxes, and more.

**100% local & private:** all checking runs inside your browser. Your text is never sent to any
server.

## Build it

```powershell
cd "C:\Users\mdmah\Claude\Projects\new app\New folder"
npm install        # first time only
npm run build:ext
```

This produces the loadable extension in **`extension-dist/`**.

## Load it in Chrome or Edge

1. Open **`chrome://extensions`** (or `edge://extensions`).
2. Turn on **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the **`extension-dist`** folder.
5. Pin StratWrite from the puzzle-piece menu for quick access.

> Chrome will warn that the extension can "read and change data on all websites" — that's
> required to offer suggestions in text fields everywhere. Nothing leaves your machine.

## Use it

- Click into any text box, textarea, or rich editor on a page.
- A small **StratWrite badge** appears at the corner of the field:
  - **Green ✓** = looks good
  - **Indigo with a number** = that many suggestions
- Click the badge to open the panel, then click a suggestion to **apply the fix**.
- Toggle the extension on/off from its **toolbar popup**.

## How it works

- **`background.ts`** (service worker) loads the shared checking engine (`src/lib/*`) — including
  the dictionary — once, and answers check requests.
- **`content.ts`** is a tiny script injected into pages: it finds editable fields, asks the
  worker to check the text, and renders the badge/panel inside an isolated Shadow DOM (so it
  never clashes with the site's styles). Applying a fix edits the field directly.
- **`popup.html` / `popup.ts`** is the on/off toggle.

## Known limitations (v1)

- Fixes are exact in `<textarea>` / `<input>` fields; in rich `contenteditable` editors they're
  best-effort.
- No inline underlines yet (suggestions live in the badge panel) — this keeps it reliable across
  every site.
- Not yet published to the Chrome Web Store (that needs a one-time $5 developer registration).

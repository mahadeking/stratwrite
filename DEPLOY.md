# Publishing StratWrite

StratWrite is a **static site** — it runs entirely in the browser, no server or database
needed. To publish, you upload the contents of the **`dist/`** folder to any static host.

## Build it (already done, but to rebuild anytime)

```powershell
cd "C:\Users\mdmah\Claude\Projects\new app\New folder"
npm run build
```

This creates/updates the **`dist/`** folder:

```
dist/
  index.html
  favicon.svg
  assets/index-*.js     (the app)
  assets/index-*.css    (styles)
```

Asset paths are **relative**, so the folder works at a domain root (`example.com`) *or*
a subfolder (`example.com/stratwrite/`).

## Fastest way to go live — Netlify Drop (free, no account, ~2 min)

1. Go to **https://app.netlify.com/drop**
2. Drag the whole **`dist`** folder onto the page.
3. You get a live URL instantly (e.g. `random-name.netlify.app`). Done.
   - Optional: make a free account to rename it or add a custom domain.

## Other free hosts

**Vercel** — https://vercel.com → "Add New… → Project" → drag `dist`, or connect a GitHub repo (build command `npm run build`, output dir `dist`).

**Cloudflare Pages** — https://pages.cloudflare.com → upload `dist` or connect a repo.

**GitHub Pages** — push this project to a GitHub repo, then either upload `dist` to a
`gh-pages` branch or use an action. (Relative paths already make this work under
`username.github.io/repo/`.)

**Your own web server** — copy the contents of `dist/` into your web root (e.g. `public_html`). Any host that serves static files works (no Node.js required on the server).

## Good to know

- **Documents are stored in each visitor's browser** (localStorage). They're private to that
  browser and don't sync across devices. That's expected for this version — no backend, no cost.
- **No routing config needed** — the app is a single page; `index.html` serves everything.
- **AI features** stay locked until an Anthropic API key is added (a future enhancement that
  would need a tiny serverless function to keep the key private).
- **Bundle size:** the app is ~3.5 MB (≈810 KB gzipped) because it bundles a full English
  dictionary for offline spell-check. It loads fine; if you want a faster first load later,
  the dictionary can be lazy-loaded on demand.

## Custom domain

Most hosts (Netlify, Vercel, Cloudflare) let you add your own domain for free in their
dashboard — point your domain's DNS to them and they handle HTTPS automatically.

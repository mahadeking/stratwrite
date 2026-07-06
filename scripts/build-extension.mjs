// Bundles the StratWrite browser extension into ./extension-dist
import { build } from 'esbuild'
import { cp, mkdir, rm } from 'node:fs/promises'

const outdir = 'extension-dist'

await rm(outdir, { recursive: true, force: true })
await mkdir(outdir, { recursive: true })

await build({
  entryPoints: {
    background: 'extension/background.ts',
    content: 'extension/content.ts',
    popup: 'extension/popup.ts',
  },
  bundle: true,
  format: 'iife',
  outdir,
  minify: true,
  target: ['chrome110'],
  logLevel: 'info',
})

await cp('extension/manifest.json', `${outdir}/manifest.json`)
await cp('extension/popup.html', `${outdir}/popup.html`)
await cp('extension/icons', `${outdir}/icons`, { recursive: true })

console.log('\n✓ Extension built to ./' + outdir)
console.log('  Load it in Chrome/Edge: chrome://extensions → Developer mode → Load unpacked → select this folder.')

// Rasterizes extension/icon.svg into PNG icons for the extension.
import sharp from 'sharp'
import { mkdir, readFile } from 'node:fs/promises'

const svg = await readFile('extension/icon.svg')
await mkdir('extension/icons', { recursive: true })

const sizes = [16, 32, 48, 128]
for (const size of sizes) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(`extension/icons/icon-${size}.png`)
  console.log(`✓ extension/icons/icon-${size}.png`)
}
console.log('Done.')

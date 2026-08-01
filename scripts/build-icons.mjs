// ─────────────────────────────────────────────────────────────────
//  Rasterise assets/icon-master.svg into every icon /public needs.
//
//  Run:  npm run icons
//
//  Produces:
//    icon-1024.png            master / store listing
//    icon-512.png, icon-192.png, icon-144.png, icon-96.png, icon-48.png
//                             Android + PWA manifest densities
//    icon-maskable-512.png    Android adaptive: art inset to the safe
//                             circle so the launcher can crop any shape
//    apple-touch-icon.png     iOS home screen (180px, no transparency)
//    favicon-32.png, favicon-16.png
//    icon.png                 kept for backwards compatibility
//
//  The maskable variant is a genuinely different image, not a resize:
//  Android crops icons to a circle/squircle/teardrop depending on the
//  launcher, so the mark is scaled to ~78% and padded with the ground
//  colour. Shipping the same file for both is why maskable icons so
//  often end up with their edges sliced off.
// ─────────────────────────────────────────────────────────────────
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root   = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const master = path.join(root, 'assets', 'icon-master.svg')
const out    = path.join(root, 'public')

const svg = fs.readFileSync(master)

const SIZES = [
  ['icon-1024.png', 1024],
  ['icon-512.png', 512],
  ['icon-192.png', 192],
  ['icon-144.png', 144],
  ['icon-96.png', 96],
  ['icon-48.png', 48],
  ['apple-touch-icon.png', 180],
  ['favicon-32.png', 32],
  ['favicon-16.png', 16],
  ['icon.png', 512],
]

// Ground colour continues past the artwork so a launcher crop never
// exposes a transparent corner.
const GROUND = { r: 0x0B, g: 0x0A, b: 0x07, alpha: 1 }

async function build() {
  fs.mkdirSync(out, { recursive: true })

  for (const [name, size] of SIZES) {
    await sharp(svg, { density: 600 })
      .resize(size, size, { fit: 'cover' })
      .flatten({ background: GROUND })   // iOS rejects alpha in app icons
      .png({ compressionLevel: 9 })
      .toFile(path.join(out, name))
    console.log(`  ✓ ${name.padEnd(24)} ${size}×${size}`)
  }

  // Maskable: inset the art to the Android safe zone, pad with ground.
  const inner = 400
  const pad = (512 - inner) / 2
  const art = await sharp(svg, { density: 600 }).resize(inner, inner).png().toBuffer()
  await sharp({ create: { width: 512, height: 512, channels: 4, background: GROUND } })
    .composite([{ input: art, top: pad, left: pad }])
    .flatten({ background: GROUND })
    .png({ compressionLevel: 9 })
    .toFile(path.join(out, 'icon-maskable-512.png'))
  console.log('  ✓ icon-maskable-512.png     512×512 (art inset to safe zone)')
}

build().then(
  () => console.log('\nIcons written to /public'),
  e => { console.error('Icon build failed:', e); process.exit(1) },
)

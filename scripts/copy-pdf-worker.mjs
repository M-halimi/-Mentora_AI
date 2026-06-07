import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const src = join(root, 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.mjs')
const destDir = join(root, 'public')
const dest = join(destDir, 'pdf.worker.min.mjs')

if (!existsSync(src)) {
  console.warn('[copy-pdf-worker] Source not found:', src)
  process.exit(0)
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true })
}

copyFileSync(src, dest)
console.log('[copy-pdf-worker] Copied pdf.worker.min.mjs to public/')

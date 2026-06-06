import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  const start = Date.now()
  const data = new Uint8Array(buffer)

  console.log('[PDF] Starting extraction, buffer size:', buffer.length)

  const doc = await getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise

  console.log('[PDF] Document loaded, pages:', doc.numPages, `(${Date.now() - start}ms)`)

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const pageStart = Date.now()
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item: unknown) => (item as { str: string }).str).join(' ')
    pages.push(text)
    console.log('[PDF] Page', i, 'extracted', text.length, 'chars', `(${Date.now() - pageStart}ms)`)
  }

  const result = pages.join('\n').trim()
  if (!result) throw new Error('No extractable text found in this PDF')

  console.log('[PDF] Extraction complete:', result.length, 'chars total', `(${Date.now() - start}ms)`)
  return result
}

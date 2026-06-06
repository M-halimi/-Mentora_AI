import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer)
  const doc = await getDocument({ data }).promise

  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item) => (item as { str: string }).str).join(' ')
    pages.push(text)
  }

  const result = pages.join('\n').trim()
  if (!result) throw new Error('No extractable text found in this PDF')
  return result
}

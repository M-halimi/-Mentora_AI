import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'

const TIMEOUT = 25000

export async function extractTextFromBuffer(
  buffer: Buffer
): Promise<string> {
  const start = Date.now()

  const data = new Uint8Array(buffer)

  console.log('[PDF] Starting extraction')
  console.log('[PDF] Buffer size:', buffer.length)

  const doc = await getDocument({
    data,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise

  console.log('[PDF] Document loaded:', doc.numPages)

  const pages: string[] = []

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)

    const content = await page.getTextContent()

    const text = content.items
      .map((item: any) => item.str ?? '')
      .join(' ')

    pages.push(text)

    if (Date.now() - start > TIMEOUT) {
      throw new Error(
        `PDF extraction timed out after ${TIMEOUT / 1000}s`
      )
    }
  }

  const result = pages.join('\n').trim()

  if (!result) {
    throw new Error('No extractable text found in this PDF')
  }

  console.log('[PDF] Extraction complete:', result.length)

  return result
}
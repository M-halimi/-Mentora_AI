import { PDFParse } from 'pdf-parse'
import { CanvasFactory } from 'pdf-parse/worker'

export async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer, CanvasFactory })
  const result = await parser.getText()

  const text = result.text?.trim()
  if (!text || text.length === 0) {
    throw new Error('No extractable text found in this PDF')
  }

  return text
}

import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromBuffer } from '@/lib/pdf'
import { validateUploadFile } from '@/lib/validators'

export async function POST(req: NextRequest) {
  const start = Date.now()
  console.log('[Upload API] POST /api/upload started')

  try {
    const formData = await req.formData()
    const file = formData.get('file')

    console.log('[Upload API] FormData parsed', `(${Date.now() - start}ms)`)

    if (!file || !(file instanceof File)) {
      console.error('[Upload API] No file in request')
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 },
      )
    }

    console.log('[Upload API] File received:', file.name, `(${(file.size / 1024).toFixed(1)} KB)`)

    const validationError = validateUploadFile(file)
    if (validationError) {
      console.error('[Upload API] Validation failed:', validationError)
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationError } },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    console.log('[Upload API] Buffer created', `(${Date.now() - start}ms)`)

    const text = await extractTextFromBuffer(buffer)

    console.log('[Upload API] Success, text length:', text.length, `(${Date.now() - start}ms)`)
    return NextResponse.json({ success: true, data: { text } })
  } catch (err) {
    const elapsed = Date.now() - start
    const message = err instanceof Error ? err.message : 'Failed to process PDF'
    console.error(`[Upload API] Error after ${elapsed}ms:`, err)
    return NextResponse.json(
      { success: false, error: { code: 'PDF_PARSE_ERROR', message } },
      { status: 422 },
    )
  }
}

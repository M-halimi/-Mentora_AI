import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromBuffer } from '@/lib/pdf'
import { validateUploadFile } from '@/lib/validators'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'No file provided' } },
        { status: 400 },
      )
    }

    const validationError = validateUploadFile(file)
    if (validationError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: validationError } },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await extractTextFromBuffer(buffer)

    return NextResponse.json({ success: true, data: { text } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to process PDF'
    return NextResponse.json(
      { success: false, error: { code: 'PDF_PARSE_ERROR', message } },
      { status: 422 },
    )
  }
}

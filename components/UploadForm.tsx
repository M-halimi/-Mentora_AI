'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const MAX_FILE_SIZE = 30 * 1024 * 1024

interface UploadFormProps {
  onTextExtracted: (text: string) => void
}

export function UploadForm({ onTextExtracted }: UploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)

  async function extractTextFromPDF(file: File) {
    try {
      setLoading(true)
      setError(null)
      setProgress('Loading PDF engine...')

      const pdfjsLib = await import('pdfjs-dist')

      if (typeof window !== 'undefined' && window.location.origin) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.mjs`
      } else {
        const workerVersion = pdfjsLib.version
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          `https://cdn.jsdelivr.net/npm/pdfjs-dist@${workerVersion}/build/pdf.worker.min.mjs`
      }

      setProgress('Reading file...')

      let arrayBuffer: ArrayBuffer
      try {
        arrayBuffer = await file.arrayBuffer()
      } catch {
        throw new Error('Failed to read file. Try a smaller PDF or a different browser.')
      }

      setProgress('Parsing PDF pages...')

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(`Extracting page ${i} of ${pdf.numPages}...`)

        const page = await pdf.getPage(i)
        const content = await page.getTextContent()

        const pageText = content.items
          .map((item: any) => item.str ?? '')
          .join(' ')

        fullText += pageText + '\n'
      }

      const trimmed = fullText.trim()

      if (!trimmed) {
        throw new Error(
          'No text could be extracted from this PDF. It may be a scanned image-based PDF.'
        )
      }

      onTextExtracted(trimmed)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error while extracting PDF text'
      console.error('[UploadForm]', message, err)
      setError(message)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      if (file.size > MAX_FILE_SIZE) {
        setError('File is too large (max 30MB)')
        return
      }

      if (file.type !== 'application/pdf') {
        setError('Only PDF files are allowed')
        return
      }

      extractTextFromPDF(file)
    },
    []
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_FILE_SIZE,
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0]
      if (err?.code === 'file-too-large') {
        setError('File is too large (max 30MB)')
      } else if (err?.code === 'file-invalid-type') {
        setError('Only PDF files are allowed')
      } else {
        setError(err?.message || 'File rejected')
      }
    },
  })

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div
        {...getRootProps()}
        data-loading={loading || undefined}
        className="w-full max-w-xl p-10 border-2 border-dashed rounded-xl text-center cursor-pointer bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
      >
        <input {...getInputProps()} />

        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-[3px] border-indigo-200 border-t-indigo-600" />
            <p className="text-blue-500 font-semibold">{progress || 'Processing PDF...'}</p>
          </div>
        ) : isDragActive ? (
          <p className="text-indigo-600 font-medium">Drop the PDF here...</p>
        ) : (
          <div>
            <svg
              className="mx-auto mb-3 size-10 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            <p className="text-zinc-600">
              <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-zinc-400 mt-1">PDF only, up to 30MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 w-full max-w-xl rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  )
}

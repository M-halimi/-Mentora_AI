'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

const MAX_FILE_SIZE = 30 * 1024 * 1024

interface UploadFormProps {
  onTextExtracted: (text: string) => void
  onGenerate: () => void
}

export function UploadForm({ onTextExtracted, onGenerate }: UploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [success, setSuccess] = useState(false)

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  async function extractTextFromPDF(file: File) {
    try {
      setLoading(true)
      setError(null)

      const pdfjsLib = await import('pdfjs-dist')

      pdfjsLib.GlobalWorkerOptions.workerSrc =
        typeof window !== 'undefined' && window.location.origin
          ? `${window.location.origin}/pdf.worker.min.mjs`
          : `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

      const arrayBuffer = await file.arrayBuffer()

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

      let fullText = ''

      for (let i = 1; i <= pdf.numPages; i++) {
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
          'No text could be extracted. The PDF may contain only scanned images.'
        )
      }

      setSuccess(true)
      setFileName(file.name)
      setFileSize(file.size)
      onTextExtracted(trimmed)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error while extracting PDF text'
      console.error('[UploadForm]', message, err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      setFileName(file.name)
      setFileSize(file.size)
      setSuccess(false)

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

  function handleReset() {
    setFileName(null)
    setFileSize(null)
    setError(null)
    setLoading(false)
    setSuccess(false)
  }

  function handleGenerate() { onGenerate() }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_FILE_SIZE,
    noClick: loading,
    onDropRejected: (rejections) => {
      const err = rejections[0]?.errors[0]
      if (err?.code === 'file-too-large') {
        setError('File exceeds the 30MB size limit')
      } else if (err?.code === 'file-invalid-type') {
        setError('Only PDF files are accepted')
      } else {
        setError(err?.message || 'File rejected')
      }
    },
  })

  const containerBorder = error
    ? { borderColor: 'var(--error)' }
    : isDragActive
    ? { borderColor: '#6366F1' }
    : { borderColor: 'var(--card-border)' }

  return (
    <div className="w-full flex flex-col items-center gap-4" style={{ maxWidth: 480 }}>
      <div
        {...getRootProps()}
        className="w-full rounded-[18px] border-[1.5px] border-dashed px-8 py-12 text-center transition-all duration-200"
        style={{
          ...containerBorder,
          backgroundColor: !loading && !success && !error ? 'var(--surface)' : 'transparent',
          transform: isDragActive ? 'translateY(-1px)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (!loading && !success && !error)
            (e.currentTarget as HTMLElement).style.borderColor = '#6366F1'
        }}
        onMouseLeave={(e) => {
          if (!loading && !success && !error && !isDragActive)
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--card-border)'
        }}
      >
        <input {...getInputProps()} />

        {loading && (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div
              className="size-8 rounded-full border-2 animate-spin-slow"
              style={{ borderColor: 'var(--border)', borderTopColor: '#6366F1' }}
            />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Analyzing your PDF&hellip;
            </p>
          </div>
        )}

        {success && (
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <div
              className="flex size-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--success-soft)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                {fileName}
              </p>
              {fileSize && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  {formatSize(fileSize)}
                </p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleGenerate()
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 active:scale-[0.97]"
              style={{ backgroundColor: '#6366F1', fontFamily: 'var(--font-sora)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4F46E5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6366F1')}
            >
              Generate Quiz
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        {!loading && !success && !error && (
          <div className="flex flex-col items-center gap-3">
            <div
              className="flex size-12 items-center justify-center rounded-xl border"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                Upload your lesson PDF
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                Drop a file or{' '}
                <span style={{ color: '#6366F1', cursor: 'pointer' }}>browse</span>
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                PDF only
              </span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Max 30MB
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div
              className="flex size-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--error-soft)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'var(--error)' }}>
              {error}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleReset()
              }}
              className="text-xs underline transition-opacity hover:opacity-70"
              style={{ color: 'var(--muted)' }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

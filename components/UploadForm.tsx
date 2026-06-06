'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { LoadingSpinner } from './LoadingSpinner'
import { ErrorMessage } from './ErrorMessage'

interface UploadFormProps {
  onTextExtracted: (text: string) => void
}

export function UploadForm({ onTextExtracted }: UploadFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<{ name: string; size: string } | null>(null)

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0]
    if (!f) return

    setError('')
    setFile({ name: f.name, size: formatSize(f.size) })
    setLoading(true)

    try {
      const formData = new FormData()
      formData.set('file', f)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()

      if (!json.success) {
        setError(json.error?.message || 'Upload failed')
        setLoading(false)
        return
      }

      onTextExtracted(json.data.text)
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }, [onTextExtracted])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 30 * 1024 * 1024,
    disabled: loading,
  })

  return (
    <div className="w-full max-w-lg mx-auto animate-scale-in">
      {loading ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <LoadingSpinner message="Extracting text from PDF..." step="uploading" />
          {file && (
              <div className="mt-4 flex max-w-full items-center justify-center gap-2 text-xs text-zinc-400">
                <svg className="size-4 shrink-0 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                <span className="truncate">{file.name} ({file.size})</span>
              </div>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 active:scale-[0.99] ${
            isDragActive
              ? 'border-indigo-400 bg-indigo-50/50 shadow-lg shadow-indigo-500/5'
              : file
              ? 'border-indigo-200 bg-indigo-50/30'
              : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-md hover:shadow-zinc-900/5'
          }`}
        >
          <input {...getInputProps()} />

          {file ? (
            <div className="animate-scale-in">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-indigo-50">
                <svg className="size-7 text-indigo-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-zinc-800">{file.name}</p>
              <p className="mt-1 text-xs text-zinc-400">{file.size}</p>
              <p className="mt-3 text-xs text-indigo-600 font-medium">Click or drop to replace</p>
            </div>
          ) : (
            <>
              <div className={`mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl transition-all duration-200 ${
                isDragActive ? 'bg-indigo-100 scale-110' : 'bg-zinc-50'
              }`}>
                <svg className={`size-8 transition-colors duration-200 ${
                  isDragActive ? 'text-indigo-500' : 'text-zinc-400'
                }`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                </svg>
              </div>
              <p className="text-base font-medium text-zinc-800">
                {isDragActive ? 'Drop your PDF here' : 'Upload your lesson PDF'}
              </p>
              <p className="mt-1.5 text-sm text-zinc-400">
                Drop a file or <span className="text-indigo-600 font-medium underline underline-offset-2 decoration-indigo-200">browse</span>
              </p>
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  PDF only
                </span>
                <span className="flex items-center gap-1">
                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                  </svg>
                  Max 30MB
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mt-4">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        </div>
      )}
    </div>
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

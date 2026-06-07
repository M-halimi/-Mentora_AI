'use client'

export function LoadingSpinner({ message, step }: { message?: string; step?: 'uploading' | 'generating' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 py-12 animate-fade-in">
      <div className="relative size-10">
        <div className="absolute inset-0 rounded-full border-2 animate-spin-slow" style={{ borderColor: 'var(--border)', borderTopColor: '#6366F1' }} />
        {step === 'generating' && (
          <div className="absolute inset-1 rounded-full border-2 animate-spin-slow" style={{ borderColor: 'transparent', borderTopColor: 'rgba(16,185,129,0.6)', animationDuration: '0.8s', animationDirection: 'reverse' }} />
        )}
      </div>
      {message && (
        <div className="text-center">
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{message}</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>This may take a few seconds</p>
        </div>
      )}
    </div>
  )
}

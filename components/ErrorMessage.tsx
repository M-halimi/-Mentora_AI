'use client'

export function ErrorMessage({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="animate-fade-in rounded-xl border p-4" style={{ borderColor: 'rgba(239,68,68,0.2)', backgroundColor: 'var(--error-soft)' }}>
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
          <svg className="size-4" style={{ color: '#EF4444' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: '#EF4444' }}>Something went wrong</p>
          <p className="mt-0.5 text-sm" style={{ color: 'var(--muted)' }}>{message}</p>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors" style={{ color: 'var(--muted)' }}>
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

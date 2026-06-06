'use client'

export function ErrorMessage({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  return (
    <div className="animate-scale-in rounded-xl border border-red-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50">
          <svg className="size-5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-900">Something went wrong</p>
          <p className="mt-1 text-sm text-zinc-500">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex size-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

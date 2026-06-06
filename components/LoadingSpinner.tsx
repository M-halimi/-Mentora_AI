'use client'

export function LoadingSpinner({ message, step }: { message?: string; step?: 'uploading' | 'generating' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 animate-scale-in">
      <div className="relative size-14">
        <div className="absolute inset-0 rounded-full border-[3px] border-zinc-200" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-indigo-500 animate-spin" />
        {step === 'generating' && (
          <div className="absolute inset-2 rounded-full border-[3px] border-transparent border-t-emerald-400 animate-spin" style={{ animationDuration: '0.8s', animationDirection: 'reverse' }} />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-2 rounded-full bg-indigo-500 animate-pulse-soft" />
        </div>
      </div>
      {message && (
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-700">{message}</p>
          <p className="mt-1 text-xs text-zinc-400">This may take a few seconds</p>
        </div>
      )}
    </div>
  )
}

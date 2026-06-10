'use client'

import { useMemo } from 'react'
import { TeacherDashboard } from '@/components/TeacherDashboard'
import { getAllResults } from '@/lib/quiz-results-store'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const results = useMemo(() => getAllResults(), [])

  return (
    <main className="flex flex-1 flex-col items-center px-5 py-16">
      <div className="w-full" style={{ maxWidth: 560 }}>
        <TeacherDashboard
          results={results}
          onBack={() => router.push('/')}
        />
      </div>
    </main>
  )
}

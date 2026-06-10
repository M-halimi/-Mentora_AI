'use client'

import { useMemo } from 'react'
import { StudentResult } from '@/types'

interface TeacherDashboardProps {
  results: StudentResult[]
  onBack: () => void
}

function getStatus(percentage: number): { label: string; color: string; bg: string } {
  if (percentage >= 90) return { label: 'Excellent', color: '#10B981', bg: 'rgba(16,185,129,0.1)' }
  if (percentage >= 70) return { label: 'Good', color: '#6366F1', bg: 'rgba(99,102,241,0.1)' }
  if (percentage >= 50) return { label: 'Medium', color: '#D97706', bg: 'rgba(217,119,6,0.1)' }
  return { label: 'Weak', color: '#EF4444', bg: 'rgba(239,68,68,0.1)' }
}

export function TeacherDashboard({ results, onBack }: TeacherDashboardProps) {
  const stats = useMemo(() => {
    const total = results.length
    if (total === 0) return { totalStudents: 0, averageScore: 0, completedQuizzes: 0 }

    const sum = results.reduce((acc, r) => acc + r.score.percentage, 0)
    return {
      totalStudents: new Set(results.map(r => r.studentName)).size,
      averageScore: Math.round(sum / total),
      completedQuizzes: total,
    }
  }, [results])

  const latestResults = useMemo(() => {
    const map = new Map<string, StudentResult>()
    results.forEach(r => {
      const existing = map.get(r.studentName)
      if (!existing || r.date > existing.date) {
        map.set(r.studentName, r)
      }
    })
    return Array.from(map.values())
  }, [results])

  const topWeakTopics = useMemo(() => {
    const map = new Map<string, Set<string>>()
    results.forEach(r => {
      r.weakTopics.forEach(wt => {
        if (!map.has(wt.topic)) map.set(wt.topic, new Set())
        map.get(wt.topic)!.add(r.studentName)
      })
    })
    return Array.from(map.entries())
      .map(([topic, students]) => ({ topic, count: students.size }))
      .sort((a, b) => b.count - a.count)
  }, [results])

  if (results.length === 0) {
    return (
      <div className="w-full animate-fade-in text-center py-16">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <svg className="size-6" style={{ color: 'var(--muted)' }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
          </svg>
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>No results yet</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--muted)' }}>
          Complete a quiz and save it to see class results here.
        </p>
        <button
          onClick={onBack}
          className="mt-6 inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all active:scale-[0.97]"
          style={{ backgroundColor: '#6366F1' }}
        >
          Take a Quiz
        </button>
      </div>
    )
  }

  return (
    <div className="w-full animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold" style={{ color: 'var(--text)', fontFamily: 'var(--font-sora)' }}>
          Teacher Dashboard
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-medium transition-colors"
          style={{ color: 'var(--muted)' }}
        >
          <svg className="size-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Quiz
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Students', value: stats.totalStudents, color: '#6366F1' },
          { label: 'Average Score', value: `${stats.averageScore}%`, color: stats.averageScore >= 70 ? '#10B981' : stats.averageScore >= 50 ? '#D97706' : '#EF4444' },
          { label: 'Quizzes', value: stats.completedQuizzes, color: '#6366F1' },
        ].map(stat => (
          <div key={stat.label} className="rounded-[18px] border p-4 text-center" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--muted)' }}>{stat.label}</p>
            <p className="text-2xl font-bold" style={{ color: stat.color, fontFamily: 'var(--font-sora)' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Students Table */}
      <div className="rounded-[18px] border overflow-hidden" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>Students ({latestResults.length})</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-5 py-3 font-medium" style={{ color: 'var(--muted)' }}>Name</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: 'var(--muted)' }}>Score</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: 'var(--muted)' }}>Weakest Topic</th>
                <th className="text-left px-5 py-3 font-medium" style={{ color: 'var(--muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {latestResults.map((r, i) => {
                const status = getStatus(r.score.percentage)
                const weakest = r.weakTopics.sort((a, b) => b.count - a.count)[0]
                return (
                  <tr key={r.id} style={{ borderBottom: i < latestResults.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td className="px-5 py-3 font-medium" style={{ color: 'var(--text)' }}>{r.studentName}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--text)' }}>{r.score.percentage}%</td>
                    <td className="px-5 py-3" style={{ color: 'var(--muted)' }}>{weakest?.topic ?? '-'}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-md px-2 py-0.5 text-[10px] font-semibold" style={{ color: status.color, backgroundColor: status.bg }}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Weak Topics */}
      {topWeakTopics.length > 0 && (
        <div className="rounded-[18px] border p-5" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text)' }}>Top Weak Topics</p>
          <div className="space-y-2">
            {topWeakTopics.map(({ topic, count }) => (
              <div key={topic} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--text)' }}>{topic}</span>
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{count} student{count > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

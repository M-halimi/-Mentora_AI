import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Teacher Copilot — AI Quiz Generator',
  description: 'Upload a PDF lesson and instantly generate multiple-choice quizzes using AI.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-gradient-to-b from-white to-zinc-50 text-zinc-900 antialiased">
        {children}
      </body>
    </html>
  )
}

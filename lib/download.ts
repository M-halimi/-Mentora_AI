import { QuizQuestion } from '@/types'
import { jsPDF } from 'jspdf'

function isIOSDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 1)
  )
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export function downloadJSON(questions: QuizQuestion[], filename = 'quiz.json') {
  const content = JSON.stringify(questions, null, 2)

  if (isIOSDevice()) {
    triggerDownload(`data:application/json;charset=utf-8,${encodeURIComponent(content)}`, filename)
  } else {
    const blob = new Blob([content], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    triggerDownload(url, filename)
    setTimeout(() => URL.revokeObjectURL(url), 10000)
  }
}

export function downloadPDF(questions: QuizQuestion[], title = 'Quiz') {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  function addPage() {
    doc.addPage()
    y = margin
  }

  function checkSpace(needed: number) {
    const pageHeight = doc.internal.pageSize.getHeight()
    if (y + needed > pageHeight - margin) {
      addPage()
    }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text(title, pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Total Questions: ${questions.length}`, margin, y)
  y += 8

  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  questions.forEach((q, i) => {
    if (!q || typeof q.question !== 'string') return

    const lines = doc.splitTextToSize(q.question, contentWidth)
    const questionHeight = lines.length * 6 + 4 * 8 + 10

    checkSpace(questionHeight)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(`Question ${i + 1}`, margin, y)
    y += 6

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(lines, margin, y)
    y += lines.length * 5 + 4

    const labels = ['A', 'B', 'C', 'D']
    const options = Array.isArray(q.options) ? q.options : []
    options.forEach((opt, oi) => {
      const label = oi < labels.length ? labels[oi] : '?'
      const optLines = doc.splitTextToSize(`${label}. ${opt}`, contentWidth - 6)
      const optHeight = optLines.length * 5

      checkSpace(optHeight + 6)

      doc.setFont('helvetica', q.answer === opt ? 'bold' : 'normal')
      doc.text(optLines, margin + 4, y)
      y += optHeight + 2
    })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(100)
    const answerText = `Answer: ${q.answer ?? ''}`
    checkSpace(8)
    doc.text(answerText, margin, y)
    doc.setTextColor(0)
    y += 6

    doc.setDrawColor(230)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
  })

  doc.save('quiz.pdf')
}

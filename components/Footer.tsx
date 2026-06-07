import { FaGithub, FaInstagram, FaGlobe } from 'react-icons/fa'

export function Footer() {
  return (
    <footer
      className="w-full border-t py-6 text-center"
      style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
    >
      <div className="mx-auto px-5" style={{ maxWidth: 480 }}>
        <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
          Teacher Copilot
        </p>
        <p className="mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>
          AI-powered quiz generator for modern learning
        </p>
        <p className="mt-2 text-[12px]" style={{ color: 'var(--muted)' }}>
          Built with ❤️ by{' '}
          <a
            href="https://github.com/M-halimi"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold transition-colors"
            style={{ color: '#6366F1' }}
          >
            Mohammed Halimi
          </a>
        </p>
        <div className="mt-3 flex items-center justify-center gap-4 text-[12px]" style={{ color: 'var(--muted)' }}>
          <a
            href="https://mohadev.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
            style={{ color: 'inherit' }}
          >
            <FaGlobe className="shrink-0" size={12} />
            Portfolio
          </a>
          <a
            href="https://github.com/M-halimi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
            style={{ color: 'inherit' }}
          >
            <FaGithub className="shrink-0" size={12} />
            GitHub
          </a>
          <a
            href="https://instagram.com/mohammed_halimi1"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:opacity-70"
            style={{ color: 'inherit' }}
          >
            <FaInstagram className="shrink-0" size={12} />
            Instagram
          </a>
        </div>
      </div>
    </footer>
  )
}

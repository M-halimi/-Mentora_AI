import { FaGithub, FaInstagram, FaGlobe } from "react-icons/fa"

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-6 text-center text-sm text-zinc-500">

      <p className="font-semibold text-zinc-800">
        Teacher Copilot
      </p>

      <p className="text-xs">
        AI-powered quiz generator for modern learning
      </p>

      <p className="mt-2 text-xs">
        Built with ❤️ by{" "}
        <span className="font-bold text-indigo-600">
          Mohammed Halimi
        </span>
      </p>

      <div className="mt-3 flex justify-center gap-5 text-xs">

        <a href="https://mohadev.netlify.app/" target="_blank" className="flex items-center gap-1">
          <FaGlobe /> Portfolio
        </a>

        <a href="https://github.com/M-halimi" target="_blank" className="flex items-center gap-1">
          <FaGithub /> GitHub
        </a>

        <a href="https://instagram.com/mohammed_halimi1" target="_blank" className="flex items-center gap-1">
          <FaInstagram /> Instagram
        </a>

      </div>

    </footer>
  )
}
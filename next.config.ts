import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfjs-dist', 'groq-sdk'],
}

export default nextConfig

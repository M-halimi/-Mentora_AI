// import type { NextConfig } from 'next'

// const nextConfig: NextConfig = {
//   serverExternalPackages: ['pdfjs-dist', 'groq-sdk'],
//   async headers() {
    
//     return [
      
//       {
//         source: '/:path*.mjs',
//         headers: [
//           {
//             key: 'Content-Type',
//             value: 'application/javascript; charset=utf-8',
//           },
//         ],
//       },
//     ]
    
//   },
// }

// export default nextConfig

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdfjs-dist', 'groq-sdk'],

  allowedDevOrigins: [
    'http://192.168.1.2:3000',
    'http://192.168.1.*:3000',
    'http://localhost:3000'
  ],

  async headers() {
    return [
      {
        source: '/:path*.mjs',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
        ],
      },
    ]
  },
}

export default nextConfig
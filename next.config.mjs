/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: !isProd,
  },
  typescript: {
    ignoreBuildErrors: !isProd,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "localhost:3001"]
    },
    typedRoutes: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          ...(isProd
            ? [
                { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
              ]
            : []),
        ],
      },
    ]
  },
}

export default nextConfig

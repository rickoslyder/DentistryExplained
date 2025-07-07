import withPWAInit from "@ducanh2912/next-pwa"

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: false,
  workboxOptions: {
    disableDevLogs: true,
    // Cache strategies for different route patterns
    runtimeCaching: [
      // Emergency pages - cache first for offline access
      {
        urlPattern: /^\/emergency/,
        handler: "CacheFirst",
        options: {
          cacheName: "emergency-pages",
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
          },
        },
      },
      // Emergency API routes - network first with cache fallback
      {
        urlPattern: /^\/api\/emergency/,
        handler: "NetworkFirst",
        options: {
          cacheName: "emergency-api",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
      // Static assets - cache first
      {
        urlPattern: /\.(js|css|png|jpg|jpeg|svg|gif|ico|woff|woff2)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "static-assets",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // Other pages - stale while revalidate
      {
        urlPattern: /^(?!\/api).*/,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "pages",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
    ],
  },
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: [
      'supabase.co',
      '*.supabase.co',
      'dentistryexplained.supabase.co',
      'clerk.com',
      '*.clerk.com',
      'img.clerk.com',
      'images.unsplash.com', // For demo/placeholder images
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self' https: data: blob:;
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:;
              style-src 'self' 'unsafe-inline' https:;
              img-src 'self' data: https: blob:;
              font-src 'self' data: https:;
              connect-src 'self' https: wss: blob:;
              media-src 'self' https: blob:;
              object-src 'none';
              worker-src 'self' blob:;
              frame-src 'self' https:;
              base-uri 'self';
              form-action 'self' https:;
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s+/g, ' ').trim()
          }
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NEXT_PUBLIC_APP_URL || '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,DELETE,PATCH,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          }
        ]
      },
      {
        // Add CORS headers for Clerk authentication
        source: '/:path*',
        has: [
          {
            type: 'header',
            key: 'origin',
            value: '(https://.*\\.clerk\\.accounts\\.dev|https://clerk\\.accounts\\.dev|https://actual-feline-35\\.accounts\\.dev)'
          }
        ],
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: ':origin'
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
          }
        ]
      }
    ]
  },
}

export default withPWA(nextConfig)

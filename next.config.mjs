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
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.accounts.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://tagmanager.google.com https://*.google-analytics.com https://*.googletagmanager.com;
              style-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://tagmanager.google.com https://fonts.googleapis.com;
              img-src 'self' data: https: blob: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://*.google.com https://*.doubleclick.net;
              font-src 'self' data: https://*.clerk.accounts.dev https://fonts.gstatic.com;
              connect-src 'self' https://clerk.accounts.dev https://*.clerk.accounts.dev https://openai-proxy-0l7e.onrender.com wss://*.clerk.accounts.dev https://*.supabase.co wss://*.supabase.co https://api.resend.com https://challenges.cloudflare.com https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.googletagmanager.com https://*.doubleclick.net https://region1.google-analytics.com;
              media-src 'self';
              object-src 'none';
              worker-src 'self' blob:;
              frame-src 'self' https://clerk.accounts.dev https://*.clerk.accounts.dev https://challenges.cloudflare.com https://www.googletagmanager.com;
              base-uri 'self';
              form-action 'self' https://*.clerk.accounts.dev;
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
      }
    ]
  },
}

export default nextConfig

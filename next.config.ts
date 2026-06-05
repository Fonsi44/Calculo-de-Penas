import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';
const noindexActive = process.env.NEXT_PUBLIC_NOINDEX === 'true' || (process.env.NEXT_PUBLIC_NOINDEX === undefined && !isProd);

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://www.google-analytics.com https://*.clarity.ms https://*.analytics.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  { key: 'Content-Security-Policy', value: csp },
  ...(isProd ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }] : []),
];

const robotsHeader = noindexActive
  ? { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex' }
  : { key: 'X-Robots-Tag', value: 'index, follow, max-image-preview:large, max-snippet:-1' };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // El redirect www → apex lo gestiona Vercel a nivel de dominio
  // (Settings → Domains → Redirect). Aquí solo mantenemos los legacy redirects.
  async redirects() {
    return [
      { source: '/login', destination: '/intranet/login', permanent: true },
      { source: '/casos', destination: '/intranet/casos', permanent: true },
      { source: '/inicio', destination: '/', permanent: true },
      { source: '/home', destination: '/', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [...securityHeaders, robotsHeader],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
      {
        source: '/intranet/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;

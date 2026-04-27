/** @type {import('next').NextConfig} */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : undefined;

const remotePatterns = [];

// Supabase Storage (for any future user-uploaded images, contract logos, etc.)
if (supabaseHostname) {
  remotePatterns.push({
    protocol: 'https',
    hostname: supabaseHostname,
    port: '',
    pathname: '/storage/v1/object/public/**',
  });
}

// Google profile avatars from OAuth — populated into profiles.avatar_url
// at sign-in time. Pre-allowed so the Sidebar / Settings can render them
// later without a config change.
remotePatterns.push({
  protocol: 'https',
  hostname: 'lh3.googleusercontent.com',
  port: '',
  pathname: '/**',
});

const nextConfig = {
  // Don't broadcast that this is a Next.js app via the X-Powered-By header.
  poweredByHeader: false,

  // Strict mode helps catch rendering bugs in development.
  reactStrictMode: true,

  // We run typecheck + lint as separate scripts in CI and pre-commit;
  // skip during build for faster Vercel deploys. Re-enable here if you
  // want CI-style strictness on every build.
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    remotePatterns,
  },

  // Long-term security headers. Each request gets these set globally.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Public widget loaded across origins — needs CORS-friendly caching.
        source: '/widget/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=86400' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },
};

export default nextConfig;

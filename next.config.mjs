/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [{
      source: '/:path*',
      has: [{ type: 'host', value: 'www.belutbakarsurabaya.com' }],
      destination: 'https://belutbakarsurabaya.com/:path*',
      permanent: true,
    }];
  },
  async headers() {
    return process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production'
      ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }]
      : [];
  },
  // Inject the build timestamp as an env var available at runtime.
  // This runs once per Vercel build, so it accurately represents deploy time.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dvalads2e/image/upload/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
    ],
  },
};

export default nextConfig;

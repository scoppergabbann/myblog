/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Inject the build timestamp as an env var available at runtime.
  // This runs once per Vercel build, so it accurately represents deploy time.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  images: {
    remotePatterns: [
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

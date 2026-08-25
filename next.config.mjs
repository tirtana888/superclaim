/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pamkqqegwaxryakubpro.supabase.co',
      },
    ],
  },
};

export default nextConfig;

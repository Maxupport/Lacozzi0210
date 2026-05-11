import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@notionhq/client", "notion-to-md"],
  async redirects() {
    return [
      {
        source: '/contact',
        destination: '/#contact',
        permanent: true,
      },
      {
        source: '/%23contact',
        destination: '/#contact',
        permanent: true,
      }
    ];
  },
};

export default nextConfig;

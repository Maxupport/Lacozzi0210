import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.lacozzi.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api/*'],
      },
      {
        // Explicitly allow AI bots for AEO (Answer Engine Optimization)
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'PerplexityBot', 'anthropic-ai'],
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api/*'],
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    // llms.txt for AI crawlers
    // https://lacozzi0210.vercel.app/llms.txt
  };
}

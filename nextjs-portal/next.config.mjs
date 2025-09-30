/** @type {import('next').NextConfig} */
const base = {
  /* Stabilize client chunk loading; in dev keep it minimal to avoid interference */
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      return [
        {
          source: '/_next/static/:path*',
          headers: [
            { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          ],
        },
      ];
    }
    return [
      {
        // App/pages JS/CSS chunks
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // HTML/documents and all other routes
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
    ];
  },
  // For Turbopack retry with Lightning CSS, uncomment the following:
  // experimental: {
  //   useLightningcss: true,
  // },
};

// In development, prevent Next.js from disposing page chunks too aggressively
const isDev = process.env.NODE_ENV === 'development';
const nextConfig = isDev
  ? {
      ...base,
      onDemandEntries: {
        // keep pages hot for 1 hour (default is much shorter)
        maxInactiveAge: 60 * 60 * 1000,
        // keep more pages in buffer
        pagesBufferLength: 50,
      },
    }
  : base;

export default nextConfig;

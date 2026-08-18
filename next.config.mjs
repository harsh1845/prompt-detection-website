/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prisma 7 talks to SQLite through a driver adapter; keep it out of the bundle.
    serverComponentsExternalPackages: [
      "@prisma/adapter-better-sqlite3",
      "better-sqlite3",
    ],
  },
};

export default nextConfig;

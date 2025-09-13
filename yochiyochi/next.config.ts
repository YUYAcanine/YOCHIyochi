/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Vercel ビルドで ESLint エラーを fail させない
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;

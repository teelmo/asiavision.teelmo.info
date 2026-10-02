/** @type {import('next').NextConfig} */
const nextConfig = {
  // This app never optimizes remote/user images (flags are emoji text),
  // so keep the image optimizer endpoint disabled entirely.
  images: { unoptimized: true },
};

module.exports = nextConfig;

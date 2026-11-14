/** @type {import('next').NextConfig} */
const nextConfig = {
  // mammoth and postgres are Node-only; keep them out of the bundler.
  serverExternalPackages: ["mammoth", "postgres"],
};
export default nextConfig;

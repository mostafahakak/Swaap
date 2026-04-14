/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  /** Emit `route/index.html` so static hosts (e.g. Firebase) serve `/route` and HEAD prefetch reliably. */
  trailingSlash: true,
};

export default nextConfig;

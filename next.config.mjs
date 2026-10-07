/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000"]
    }
  },
  async rewrites() {
    return {
      // Resolve the Climbback host before Trusttable's page and asset routes.
      beforeFiles: [{
        source: "/:path*",
        has: [{ type: "host", value: "climbback-register.vercel.app" }],
        destination: "https://climbback-preregister.dymin0510.chatgpt.site/:path*"
      }],
      afterFiles: [],
      fallback: []
    };
  }
};

export default nextConfig;

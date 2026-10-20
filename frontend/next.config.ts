import type { NextConfig } from "next";

type Pattern = { protocol: "http" | "https"; hostname: string; port?: string };

const remotePatterns: Pattern[] = [
  { protocol: "https", hostname: "images.unsplash.com" },
  { protocol: "https", hostname: "cdn.dummyjson.com" },
];

try {
  const origin = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(
    /\/api\/?$/,
    ""
  );
  const url = new URL(origin);
  remotePatterns.push({
    protocol: url.protocol.startsWith("https") ? "https" : "http",
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
  });
} catch {}

const nextConfig: NextConfig = {
  images: { remotePatterns },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/:path*`,
      },
    ];
  },
};

export default nextConfig;

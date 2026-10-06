import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // PDF de 10 Mo max (vérifié dans lib/pdf.ts) + marge pour l'enveloppe multipart.
    serverActions: { bodySizeLimit: "11mb" },
  },
};

export default nextConfig;

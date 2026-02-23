import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ssh2", "node-ssh"],
};

export default nextConfig;

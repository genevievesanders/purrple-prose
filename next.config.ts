import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Agent SDK spawns a subprocess and must be loaded from node_modules
  // at runtime, not bundled.
  serverExternalPackages: ["@anthropic-ai/claude-agent-sdk"],
};

export default nextConfig;

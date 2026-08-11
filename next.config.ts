import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone-сборка для production (Docker) — B-034-T2
  output: "standalone",
  // Оптимизировано для App Router
  experimental: {
    // Если понадобятся новые функции React
  },
  // Игнорировать архивные файлы при сборке
  transpilePackages: ["archive"],
};

export default nextConfig;

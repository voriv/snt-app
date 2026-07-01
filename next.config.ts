import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Оптимизировано для App Router
  experimental: {
    // Если понадобятся новые функции React
  },
  // Игнорировать архивные файлы при сборке
  transpilePackages: ["archive"],
};

export default nextConfig;

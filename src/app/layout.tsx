import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "СНТ Берёзки-НТ",
  description: "Управление садоводческим товариществом",
};

/**
 * @page RootLayout
 * @description Корневой layout приложения
 *
 * @spec
 * - Server Component
 * - Оборачивает приложение в Providers (ThemeProvider) — единый источник истины для темы
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

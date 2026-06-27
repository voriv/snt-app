import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SessionWrapper } from '@/components/providers/session-wrapper';
import { ThemeWrapper } from '@/components/providers/theme-wrapper';
import { AuthenticatedLayout } from '@/components/layout/sidebar-nav';
import { APP_NAME, APP_DESCRIPTION } from '@/lib/app-config';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionWrapper>
          <ThemeWrapper defaultTheme="light">
            <AuthenticatedLayout>
              {children}
            </AuthenticatedLayout>
          </ThemeWrapper>
        </SessionWrapper>
      </body>
    </html>
  );
}

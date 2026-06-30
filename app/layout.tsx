import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/components/query-provider';
import { LanguageProvider } from '@/lib/i18n/context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://app.roomy.com.ar'),
  icons: {
    icon: '/favicon.svg',
    apple: '/logo-192.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <QueryProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
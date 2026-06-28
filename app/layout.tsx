import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/components/query-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Roomy · PMS para Hoteles y Hostels',
  description: 'Roomy — Sistema de gestión para hoteles boutique y hostels',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo-192.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

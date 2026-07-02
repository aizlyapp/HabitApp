import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://roomy.com.ar'),
  title: 'Roomy - Software de gestión para hostels y hoteles boutique en Latinoamérica',
  description:
    'Sistema de reservas, habitaciones y cobros con Mercado Pago para hostels y hoteles boutique en toda Latinoamérica. Probá gratis 14 días, sin tarjeta de crédito.',
  keywords:
    'software gestión hostel argentina, pms hostel latinoamérica, sistema reservas hostel, pms para hostels, chatbot whatsapp hostel, cobrar mercado pago hostel, gestión de hostels',
  alternates: {
    canonical: 'https://roomy.com.ar/',
  },
  openGraph: {
    title: 'Roomy - PMS para hostels de Latinoamérica',
    description:
      'Calendario de reservas, chatbot de WhatsApp 24/7 y cobros con Mercado Pago para hostels. Probá 14 días gratis.',
    url: 'https://roomy.com.ar/',
    siteName: 'Roomy',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: 'https://roomy.com.ar/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roomy - PMS para hostels de Latinoamérica',
    description:
      'Calendario de reservas, chatbot de WhatsApp 24/7 y cobros con Mercado Pago. Probá gratis 14 días.',
    images: ['https://roomy.com.ar/og-image.png'],
  },
};

import { ThemeProvider } from '@/components/theme-provider';

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Roomy',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            url: 'https://roomy.com.ar',
            description:
              'Sistema de gestión de reservas, chatbot de WhatsApp y cobros para hostels en Latinoamérica.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
              description:
                '14 días gratis. Luego Roomy Pro desde 50 USD fijos al mes.',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Roomy',
              url: 'https://roomy.com.ar',
              logo: 'https://roomy.com.ar/favicon-192x192.png',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Roomy',
            url: 'https://roomy.com.ar',
            logo: 'https://roomy.com.ar/favicon-192x192.png',
            description:
              'Sistema de gestión de reservas, chatbot de WhatsApp y cobros para hostels en Latinoamérica.',
          }),
        }}
      />
      <ThemeProvider>{children}</ThemeProvider>
    </>
  );
}

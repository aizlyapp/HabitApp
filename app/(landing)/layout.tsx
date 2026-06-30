import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Roomy — Software de gestión para hostels y hoteles boutique en Latinoamérica',
  description:
    'Sistema de reservas, habitaciones y cobros con Mercado Pago para hostels y hoteles boutique en toda Latinoamérica. Probá gratis 14 días, sin tarjeta de crédito.',
  keywords:
    'software gestión hostel argentina, pms hostel latinoamérica, sistema reservas hostel, pms para hostels, chatbot whatsapp hostel, cobrar mercado pago hostel, gestión de hostels',
  alternates: {
    canonical: 'https://www.roomy.com.ar/',
  },
  openGraph: {
    title: 'Roomy — Sistema de gestión para hostels en Argentina',
    description:
      'Reservas, habitaciones y cobros con Mercado Pago en un solo lugar. Probá 14 días gratis.',
    url: 'https://www.roomy.com.ar/',
    siteName: 'Roomy',
    locale: 'es_AR',
    type: 'website',
    images: [
      {
        url: 'https://www.roomy.com.ar/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roomy — Sistema de gestión para hostels en Argentina',
    description:
      'Reservas, habitaciones y cobros con Mercado Pago en un solo lugar. Probá gratis 14 días.',
    images: ['https://www.roomy.com.ar/og-image.png'],
  },
};

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
            url: 'https://www.roomy.com.ar',
            description:
              'Sistema de gestión de reservas y cobros para hostels y hoteles boutique en Argentina.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'ARS',
              description:
                '14 días gratis, luego Roomy Pro actualizado al tipo de cambio',
            },
            publisher: {
              '@type': 'Organization',
              name: 'Roomy',
              url: 'https://www.roomy.com.ar',
            },
          }),
        }}
      />
      {children}
    </>
  );
}

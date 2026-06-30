import type { Metadata } from 'next';

const APP_URL = 'https://app.roomy.com.ar';

export const metadata: Metadata = {
  title: 'Roomy · PMS para Hoteles y Hostels',
  description: 'Roomy — Sistema de gestión para hoteles boutique y hostels',
  openGraph: {
    title: 'Roomy · PMS para Hoteles y Hostels',
    description:
      'Sistema de gestión para hostels y hoteles boutique. Reservas, habitaciones y huéspedes en un solo lugar.',
    url: APP_URL,
    type: 'website',
    locale: 'es_AR',
    images: [
      {
        url: `${APP_URL}/og-image.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roomy · PMS para Hoteles y Hostels',
    description:
      'Sistema de gestión para hostels y hoteles boutique. Reservas, habitaciones y huéspedes en un solo lugar.',
    images: [`${APP_URL}/og-image.png`],
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

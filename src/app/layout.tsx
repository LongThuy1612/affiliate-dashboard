import type { Metadata } from 'next';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ToastProvider } from '@/components/ui/Toaster';
import { AuthProvider } from '@/context/AuthContext';
import { ConfigProvider } from '@/context/ConfigContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: {
    default: 'Affiliate Intelligence Dashboard',
    template: '%s | Affiliate Intelligence',
  },
  description: 'Advanced affiliate program management and proxy tracking dashboard. Optimize your marketing with real-time insights and automated data extraction.',
  keywords: ['affiliate marketing', 'dashboard', 'proxy management', 'automated crawling', 'affiliate intelligence', 'data extraction'],
  authors: [{ name: 'drakynumberone' }],
  creator: 'drakynumberone',
  publisher: 'drakynumberone',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Affiliate Intelligence Dashboard',
    description: 'Advanced affiliate program management and proxy tracking dashboard. Optimize your marketing with real-time insights.',
    url: 'https://affiliate-dashboard-lake.vercel.app',
    siteName: 'Affiliate Intelligence',
    images: [
      {
        url: '/seo/background.png',
        width: 1200,
        height: 630,
        alt: 'Affiliate Intelligence Dashboard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Affiliate Intelligence Dashboard',
    description: 'Advanced affiliate program management and proxy tracking dashboard.',
    images: ['/seo/background.png'],
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();

  return (
    <html lang="en" className="h-full">
      <body className="flex h-full overflow-hidden">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <ConfigProvider>
              <ToastProvider>
                <AuthGuard>{children}</AuthGuard>
              </ToastProvider>
            </ConfigProvider>
          </AuthProvider>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}

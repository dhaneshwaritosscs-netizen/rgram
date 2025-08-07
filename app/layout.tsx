import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'R-GRAM - Spiritual & Religious Social Media',
  description: 'Connect with like-minded individuals, share spiritual insights, and discover inspiring religious content on R-GRAM.',
  keywords: 'social media, spiritual, religious, community, faith, inspiration',
  authors: [{ name: 'R-GRAM Team' }],
  creator: 'R-GRAM',
  publisher: 'R-GRAM',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'R-GRAM - Spiritual & Religious Social Media',
    description: 'Connect with like-minded individuals, share spiritual insights, and discover inspiring religious content.',
    url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    siteName: 'R-GRAM',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'R-GRAM - Spiritual & Religious Social Media',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'R-GRAM - Spiritual & Religious Social Media',
    description: 'Connect with like-minded individuals, share spiritual insights, and discover inspiring religious content.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {children}
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
} 
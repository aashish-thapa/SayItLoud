import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://sayitloud.vercel.app'),
  title: {
    default: 'SayItLoud - Share Your Thoughts',
    template: '%s | SayItLoud',
  },
  description:
    'Join the conversation on SayItLoud, a platform for sharing ideas, connecting with others, and discovering new perspectives. Post your thoughts, engage with a vibrant community, and explore trending topics.',
  keywords: [
    'social media',
    'community',
    'discussion',
    'thoughts',
    'ideas',
    'blogging',
    'networking',
  ],
  authors: [{ name: 'SayItLoud Team' }],
  openGraph: {
    title: 'SayItLoud - Share Your Thoughts',
    description:
      'Join the conversation on SayItLoud, a platform for sharing ideas, connecting with others, and discovering new perspectives.',
    url: 'https://sayitloud.vercel.app',
    siteName: 'SayItLoud',
    images: [
      {
        url: '/graph.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SayItLoud - Share Your Thoughts',
    description:
      'Join the conversation on SayItLoud, a platform for sharing ideas, connecting with others, and discovering new perspectives.',
    images: ['/twitter.png'],
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
    google: 'ADQMINuGhx-ij0EI87HPljyZnyxoprFBIf5dGVcy3Mw',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

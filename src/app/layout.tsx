import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ServiceWorkerRegister from '../components/ServiceWorkerRegister'
import NetworkMonitor from '../components/NetworkMonitor'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GeoLog - 个人足迹手账',
  description: '记录你的旅行足迹，探索世界的每一个角落',
  icons: {
    icon: {
      url: '/favicon.ico',
      sizes: 'any',
      type: 'image/x-icon',
    },
  },
  metadataBase: new URL('https://geolog.example.com'),
  openGraph: {
    title: 'GeoLog - 个人足迹手账',
    description: '记录你的旅行足迹，探索世界的每一个角落',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    title: 'GeoLog - 个人足迹手账',
    description: '记录你的旅行足迹，探索世界的每一个角落',
  },
  themeColor: '#3b82f6',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="dark">
      <body className={inter.className}>
        <ServiceWorkerRegister />
        <NetworkMonitor>
          {children}
        </NetworkMonitor>
      </body>
    </html>
  )
}

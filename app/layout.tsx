import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EcommerceCrawler App',
  description: 'Scrape Product Urls',
  generator: 'Python',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

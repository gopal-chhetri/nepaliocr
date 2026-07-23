import '@/styles/globals.css'
import { Inter, Poppins } from 'next/font/google'
import type React from 'react' // Import React

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const poppins = Poppins({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans bg-background text-foreground">
        {children}
      </body>
    </html>
  )
}

import './globals.css'

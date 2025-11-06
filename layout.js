'use client'   // ✅ must be first line

import { Inter, Space_Grotesk } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/components/auth/AuthProvider'
import './globals.css'
import { RecoilRoot } from 'recoil'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' })

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Smart Mess - Smart Cafeteria Voting</title>
        <meta name="description" content="Vote for your favorite meals and reduce food waste" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <AuthProvider>
          <RecoilRoot>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              {children}
              <Toaster position="top-center" theme="dark" />
            </ThemeProvider>
          </RecoilRoot>
        </AuthProvider>
      </body>
    </html>
  )
}

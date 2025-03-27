import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProviderWrapper } from "@/components/theme-provider-wrapper"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { CacheProvider } from "@/lib/cache-context"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "VGM Ads Metrics",
  description: "Track and analyze Google Ads metrics for multiple customers",
  generator: 'v0.dev',
  icons: {
    icon: '/vgm-icon.png',
    apple: '/vgm-icon.png',
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <CacheProvider>
            <ThemeProviderWrapper>
              {children}
              <Toaster />
            </ThemeProviderWrapper>
          </CacheProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

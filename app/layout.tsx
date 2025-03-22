import type React from "react"
import { Inter } from "next/font/google"
import { ThemeProviderWrapper } from "@/components/theme-provider-wrapper"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "VGM Ads Metrics",
  description: "Track and analyze Google Ads metrics for multiple customers",
    generator: 'v0.dev'
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
          <ThemeProviderWrapper>
            {children}
            <Toaster />
          </ThemeProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  )
}



import './globals.css'
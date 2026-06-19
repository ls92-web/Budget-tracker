import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import LayoutGate from '@/components/layout/LayoutGate'

export const metadata: Metadata = {
  title: 'Budgetly - Personal Finance',
  description: 'Premium personal finance and budget tracking',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Nunito:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <LayoutGate>{children}</LayoutGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

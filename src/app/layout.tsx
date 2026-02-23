import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { MachineProvider } from '@/store/machine-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ToastProvider } from '@/components/shared/toast-provider'
import { ThemeProvider } from '@/components/shared/theme-provider'
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
  title: 'OpenClaw Cockpit',
  description: 'Web-based management cockpit for OpenClaw AI agent instances',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <MachineProvider>
            <TooltipProvider>
              <div className="flex h-screen overflow-hidden">
                <Sidebar />
                <div className="flex flex-1 flex-col overflow-hidden">
                  <Header />
                  <main className="flex-1 overflow-y-auto p-6">
                    {children}
                  </main>
                </div>
              </div>
              <ToastProvider />
            </TooltipProvider>
          </MachineProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

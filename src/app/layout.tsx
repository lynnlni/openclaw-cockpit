import type { Metadata } from 'next'
import { MachineProvider } from '@/store/machine-context'
import { AuthProvider } from '@/store/auth-context'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { ToastProvider } from '@/components/shared/toast-provider'
import { ThemeProvider } from '@/components/shared/theme-provider'
import './globals.css'

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
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
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
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

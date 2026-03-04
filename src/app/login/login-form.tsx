'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Eye, EyeOff, Shield, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

interface CaptchaData {
  id: string
  svg: string
}

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captcha, setCaptcha] = useState<CaptchaData | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Load captcha
  const loadCaptcha = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/captcha')
      const result = await response.json()

      if (result.success) {
        setCaptcha(result.data)
        setCaptchaCode('')
      } else {
        toast.error('Failed to load captcha')
      }
    } catch {
      toast.error('Failed to load captcha')
    }
  }, [])

  useEffect(() => {
    loadCaptcha()
  }, [loadCaptcha])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password || !captchaCode) {
      setError('Please fill in all fields')
      return
    }

    if (!captcha) {
      setError('Captcha not loaded')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          captchaId: captcha.id,
          captchaCode,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Login successful')

        // Check if password change is required
        if (result.data.user.requirePasswordChange) {
          router.push('/change-password')
        } else {
          router.push(from)
          router.refresh()
        }
      } else {
        setError(result.error || 'Login failed')
        // Refresh captcha on failure
        loadCaptcha()
      }
    } catch {
      setError('Network error. Please try again.')
      loadCaptcha()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">OpenClaw Cockpit</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="captcha">Verification Code</Label>
              <div className="flex gap-2">
                <Input
                  id="captcha"
                  type="text"
                  placeholder="Enter code"
                  value={captchaCode}
                  onChange={(e) => setCaptchaCode(e.target.value)}
                  disabled={isLoading}
                  maxLength={6}
                  className="flex-1"
                  required
                />
                <button
                  type="button"
                  onClick={loadCaptcha}
                  className="h-10 w-[150px] shrink-0 overflow-hidden rounded-md border bg-white dark:bg-slate-800"
                  disabled={isLoading}
                  title="Click to refresh"
                >
                  {captcha ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: captcha.svg }}
                      className="h-full w-full"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Loading...
                    </div>
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the image to refresh
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Default: admin / admin123</p>
            <p className="text-xs">You must change password on first login</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

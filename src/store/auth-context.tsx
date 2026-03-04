'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

interface User {
  id: string
  username: string
  role: string
  requirePasswordChange: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string, captchaId: string, captchaCode: string) => Promise<{ success: boolean; error?: string; requirePasswordChange?: boolean }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me')
      const result = await response.json()

      if (result.success) {
        setUser(result.data.user)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const login = async (
    username: string,
    password: string,
    captchaId: string,
    captchaCode: string
  ): Promise<{ success: boolean; error?: string; requirePasswordChange?: boolean }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          captchaId,
          captchaCode,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setUser(result.data.user)
        return {
          success: true,
          requirePasswordChange: result.data.user.requirePasswordChange,
        }
      } else {
        return { success: false, error: result.error }
      }
    } catch {
      return { success: false, error: 'Network error' }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      window.location.href = '/login'
    } catch {
      // Force redirect even if API fails
      window.location.href = '/login'
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

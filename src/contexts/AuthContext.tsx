'use client'

import { AuthenticatedUser } from '@/types'
import * as React from 'react'

interface AuthContextType {
  user: AuthenticatedUser | null
  token: string | null
  login: (userData: AuthenticatedUser) => void
  updateUser: (userData: AuthenticatedUser | null) => void
  setUser: (user: Partial<AuthenticatedUser> | null) => void
  logout: () => void
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

// Check if we're in a browser with proper localStorage support
const isBrowser = (): boolean => {
  return (
    typeof window !== 'undefined' &&
    typeof window.localStorage !== 'undefined' &&
    typeof window.localStorage.getItem === 'function'
  )
}

// Safe localStorage access
const getLocalStorage = (key: string): string | null => {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

const setLocalStorage = (key: string, value: string): void => {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // Ignore errors (e.g., private browsing mode)
  }
}

const removeLocalStorage = (key: string): void => {
  if (!isBrowser()) return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore errors
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = React.useState<AuthenticatedUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    try {
      const storedToken = getLocalStorage('token')
      const storedUser = getLocalStorage('user')
      if (storedToken && storedUser) {
        setToken(storedToken)
        setUserState(JSON.parse(storedUser))
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = React.useCallback((userData: AuthenticatedUser) => {
    setLocalStorage('token', userData.token as string)
    setLocalStorage('user', JSON.stringify(userData))
    setToken(userData.token as string)
    setUserState(userData)
  }, [])

  const updateUser = React.useCallback((userData: AuthenticatedUser | null) => {
    if (userData) {
      setLocalStorage('user', JSON.stringify(userData))
      setUserState(userData)
    } else {
      removeLocalStorage('user')
      setUserState(null)
    }
  }, [])

  const setUser = React.useCallback(
    (userData: Partial<AuthenticatedUser> | null) => {
      if (userData) {
        const currentUserData = JSON.parse(getLocalStorage('user') || '{}')
        const newUserData = { ...currentUserData, ...userData }
        setLocalStorage('user', JSON.stringify(newUserData))
        setUserState(newUserData)
      } else {
        removeLocalStorage('user')
        setUserState(null)
      }
    },
    []
  )

  const logout = React.useCallback(() => {
    removeLocalStorage('token')
    removeLocalStorage('user')
    setToken(null)
    setUserState(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, token, login, logout, updateUser, setUser, isLoading }),
    [user, token, login, logout, updateUser, setUser, isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

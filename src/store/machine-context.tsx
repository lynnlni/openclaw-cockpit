'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface MachineContextValue {
  selectedMachineId: string | null
  setSelectedMachineId: (id: string | null) => void
}

const MachineContext = createContext<MachineContextValue | undefined>(undefined)

const STORAGE_KEY = 'openclaw-selected-machine'

function getStoredMachineId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

export function MachineProvider({ children }: { children: ReactNode }) {
  const [selectedMachineId, setSelectedMachineIdState] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setSelectedMachineIdState(getStoredMachineId())
    setHydrated(true)
  }, [])

  const setSelectedMachineId = useCallback((id: string | null) => {
    setSelectedMachineIdState(id)
    try {
      if (id === null) {
        localStorage.removeItem(STORAGE_KEY)
      } else {
        localStorage.setItem(STORAGE_KEY, id)
      }
    } catch {
      // localStorage unavailable
    }
  }, [])

  if (!hydrated) {
    return (
      <MachineContext.Provider
        value={{ selectedMachineId: null, setSelectedMachineId }}
      >
        {children}
      </MachineContext.Provider>
    )
  }

  return (
    <MachineContext.Provider value={{ selectedMachineId, setSelectedMachineId }}>
      {children}
    </MachineContext.Provider>
  )
}

export function useMachine(): MachineContextValue {
  const context = useContext(MachineContext)
  if (context === undefined) {
    throw new Error('useMachine must be used within a MachineProvider')
  }
  return context
}

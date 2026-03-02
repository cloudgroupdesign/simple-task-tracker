import { createContext, useContext } from 'react'
import type { useStore } from './useStore'

type StoreValue = ReturnType<typeof useStore>

export const StoreContext = createContext<StoreValue | null>(null)

export function useAppStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useAppStore must be inside StoreContext.Provider')
  return ctx
}

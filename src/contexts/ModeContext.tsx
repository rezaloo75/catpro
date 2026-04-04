import { createContext, useContext, useState, type ReactNode } from 'react'
import type { CatalogInterface } from '../types'
import { interfaces as staticInterfaces } from '../data/interfaces'

type Mode = 'populated' | 'creation'

interface ModeContextValue {
  mode: Mode
  setMode: (m: Mode) => void
  createdInterfaces: CatalogInterface[]
  addInterface: (iface: CatalogInterface) => void
  removeInterface: (id: string) => void
  updateInterface: (id: string, patch: Partial<CatalogInterface>) => void
}

const ModeContext = createContext<ModeContextValue>({
  mode: 'populated',
  setMode: () => {},
  createdInterfaces: [],
  addInterface: () => {},
  removeInterface: () => {},
  updateInterface: () => {},
})

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>('populated')
  const [createdInterfaces, setCreatedInterfaces] = useState<CatalogInterface[]>([])

  const addInterface = (iface: CatalogInterface) =>
    setCreatedInterfaces(prev => [...prev, iface])

  const removeInterface = (id: string) =>
    setCreatedInterfaces(prev => prev.filter(i => i.id !== id))

  const updateInterface = (id: string, patch: Partial<CatalogInterface>) =>
    setCreatedInterfaces(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i))

  return (
    <ModeContext.Provider value={{
      mode, setMode,
      createdInterfaces, addInterface, removeInterface, updateInterface,
    }}>
      {children}
    </ModeContext.Provider>
  )
}

export function useMode() {
  return useContext(ModeContext)
}

/** Returns the right interface list for the current mode. */
export function useInterfaces(): CatalogInterface[] {
  const { mode, createdInterfaces } = useContext(ModeContext)
  return mode === 'creation' ? createdInterfaces : staticInterfaces
}

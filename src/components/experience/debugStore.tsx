'use client'

import { createContext, useContext } from 'react'
import type { useCreateStore } from 'leva'

type DebugStore = ReturnType<typeof useCreateStore>

/** True only for local/dev builds (`next dev`). Production is built with
 * NODE_ENV=production (see Dockerfile), so the debug panel never ships. */
export const isDev = process.env.NODE_ENV !== 'production'

/** Shared leva store so every object's `useControls` folder lives in one
 * panel/localStorage blob instead of each mounting its own. `null` outside
 * of `Experience` (e.g. during tests): consumers fall back to leva's
 * default global store via `store ?? undefined`. */
const DebugStoreContext = createContext<DebugStore | null>(null)

export const DebugStoreProvider = DebugStoreContext.Provider

export function useDebugStore() {
  return useContext(DebugStoreContext)
}

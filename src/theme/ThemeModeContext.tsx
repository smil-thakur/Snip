import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { getTheme, type ThemeMode } from './index'

const STORAGE_KEY = 'snips-theme-mode'

interface ThemeModeContextValue {
  mode: ThemeMode
  toggleMode: () => void
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined)

function getInitialMode(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Provides the current light/dark mode plus a toggle, and wraps children in
 * the matching MUI theme. Persists the user's choice to localStorage. */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode)

  const toggleMode = () => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  const theme = useMemo(() => getTheme(mode), [mode])

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider')
  return ctx
}

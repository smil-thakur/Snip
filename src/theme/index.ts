import { createTheme, type ThemeOptions } from '@mui/material/styles'

export type ThemeMode = 'light' | 'dark'

/** Shared design tokens: minimal corner radius, tight typography, no
 * gradients/shadows-heavy defaults — keeps the UI feeling like a modern
 * text-first reading surface rather than a dashboard. */
const shape = { borderRadius: 4 }

const typography: ThemeOptions['typography'] = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Helvetica Neue',
    'Arial',
    'sans-serif',
  ].join(','),
  button: { textTransform: 'none', fontWeight: 600 },
}

const lightPalette: ThemeOptions['palette'] = {
  mode: 'light',
  primary: { main: '#111111' },
  background: { default: '#ffffff', paper: '#ffffff' },
  text: { primary: '#0f0f0f', secondary: '#5b5b5b' },
  divider: '#e6e6e6',
}

const darkPalette: ThemeOptions['palette'] = {
  mode: 'dark',
  primary: { main: '#f5f5f5' },
  background: { default: '#0b0b0b', paper: '#131313' },
  text: { primary: '#f5f5f5', secondary: '#a3a3a3' },
  divider: '#262626',
}

export function getTheme(mode: ThemeMode) {
  return createTheme({
    palette: mode === 'light' ? lightPalette : darkPalette,
    shape,
    typography,
    components: {
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 4 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: { boxShadow: 'none' },
        },
      },
    },
  })
}

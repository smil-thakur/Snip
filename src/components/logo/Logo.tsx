import { Box, Typography } from '@mui/material'

interface LogoProps {
  /** "full" renders the "Snip." wordmark; "mark" renders just the boxed "S". */
  variant?: 'full' | 'mark'
  size?: 'small' | 'medium' | 'large'
}

const fontSizes: Record<NonNullable<LogoProps['size']>, number> = {
  small: 18,
  medium: 24,
  large: 32,
}

const markSizes: Record<NonNullable<LogoProps['size']>, number> = {
  small: 28,
  medium: 36,
  large: 48,
}

/** Snips' wordmark: bold, monochrome, no color — it adapts to the active
 * theme via `text.primary` (black on light, white on dark). The "mark"
 * variant is the small boxed "S" used in tight spaces (collapsed nav,
 * favicons-in-app, loading states). */
export function Logo({ variant = 'full', size = 'medium' }: LogoProps) {
  if (variant === 'mark') {
    const s = markSizes[size]
    return (
      <Box
        sx={{
          width: s,
          height: s,
          borderRadius: '4px',
          bgcolor: 'text.primary',
          color: 'background.default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 800,
          fontSize: s * 0.55,
          lineHeight: 1,
          userSelect: 'none',
        }}
        aria-label="Snip."
      >
        S
      </Box>
    )
  }

  return (
    <Typography
      component="span"
      sx={{
        fontWeight: 800,
        fontSize: fontSizes[size],
        letterSpacing: '-0.02em',
        color: 'text.primary',
        userSelect: 'none',
      }}
    >
      Snip
      <Box component="span" sx={{ opacity: 0.45 }}>
        .
      </Box>
    </Typography>
  )
}

import { Box, Chip } from '@mui/material'
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded'

interface RefreshPillProps {
  onClick: () => void
}

/** Sticky "new snips" pill shown at the top of a feed when a background
 * poll finds fresher content — tapping (or the page's pull-to-refresh
 * gesture) applies it. The feed itself never silently swaps out from
 * under the viewer while they're reading. */
export function RefreshPill({ onClick }: RefreshPillProps) {
  return (
    <Box sx={{ position: 'sticky', top: 8, zIndex: 1, display: 'flex', justifyContent: 'center', mb: 1.5 }}>
      <Chip
        icon={<RefreshRoundedIcon fontSize="small" />}
        label="New snips — tap to refresh"
        onClick={onClick}
        color="primary"
        sx={{ boxShadow: 2, cursor: 'pointer', fontWeight: 600 }}
      />
    </Box>
  )
}

import { Box, Drawer, IconButton } from '@mui/material'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { CommentSection } from '../snip/CommentSection'
import { SCROLL_PHONE_WIDTH } from '../../constants/scroll'

interface CommentDrawerProps {
  open: boolean
  snipId: string | null
  onClose: () => void
}

/** Bottom-sheet comments for the Scroll (Reels-style) feed — opening the
 * full snip detail page would break the scroll session, so this reuses the
 * same CommentSection in a Drawer instead, keeping the viewer on /scroll. */
export function CommentDrawer({ open, snipId, onClose }: CommentDrawerProps) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      // ScrollPage's own fixed-position overlay sits at the theme's modal
      // z-index (to stack above the AppBar); a plain Drawer defaults to
      // that same tier, so without bumping it here the two stacking
      // contexts fight and the drawer's own controls can end up
      // unclickable (something in ScrollPage intercepts the pointer).
      sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
      slotProps={{
        paper: {
          sx: {
            // MUI's anchor="bottom" Paper defaults to left:0/right:0 (full
            // viewport width) — cap the width and center via left:0/right:0
            // + margin:auto (not transform: translateX, which MUI's own
            // Slide open/close transition also drives on this element and
            // would fight over) so the drawer matches the same phone-width
            // column as the rest of the Scroll page.
            left: 0,
            right: 0,
            mx: 'auto',
            width: '100%',
            maxWidth: SCROLL_PHONE_WIDTH,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '75vh',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1 }}>
        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
      </Box>
      <IconButton onClick={onClose} aria-label="Close comments" sx={{ position: 'absolute', top: 4, right: 4 }}>
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
      <Box sx={{ overflowY: 'auto', px: 2, pb: 3 }}>{snipId && <CommentSection snipId={snipId} />}</Box>
    </Drawer>
  )
}

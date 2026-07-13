import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

/** Shared MUI confirmation dialog (replaces window.confirm everywhere so
 * destructive actions match the rest of the app's design language).
 *
 * MUI renders Dialog content via a portal, but React still bubbles its
 * synthetic events up the *component* tree, not the DOM tree. Callers of
 * this dialog are frequently nested inside a clickable card (e.g.
 * SnipCard's Paper with an onClick that navigates) — without stopping
 * propagation here, clicking Cancel/Confirm (or anywhere in the dialog)
 * would bubble up and trigger that outer navigation. */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth onClick={(e) => e.stopPropagation()}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button color="error" variant="contained" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

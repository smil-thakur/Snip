import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Stack,
  Paper,
  Tooltip,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import IosShareRoundedIcon from "@mui/icons-material/IosShareRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Logo } from "../logo/Logo";
import type { Snip } from "../../types";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  snip: Snip;
}

function truncate(text: string, max = 140) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

/** Share sheet for a single snip: copy link, native share sheet where
 * supported, and direct intents for the most common destinations, plus a
 * small preview of what gets shared. */
export function ShareDialog({ open, onClose, snip }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${window.location.origin}${window.location.pathname}#/s/${snip.id}`;
  const shareText = `"${truncate(snip.contentText, 100)}" — @${snip.authorUsername} on Snip.`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      void navigator.share({ title: "Snip.", text: shareText, url: shareUrl });
    }
  };

  const intents = [
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      // MUI renders Dialog content via a portal, but React still bubbles
      // its synthetic events up the *component* tree — which here includes
      // SnipCard's clickable Paper. Without this, closing the dialog (or
      // clicking anything inside it) triggers SnipCard's navigate-to-detail
      // handler.
      onClick={(e) => e.stopPropagation()}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1,
        }}
      >
        Share this snip
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseRoundedIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: "center", mb: 0.5 }}
          >
            <Logo variant="mark" size="small" />
            <Typography variant="caption" color="text.secondary">
              @{snip.authorUsername}
            </Typography>
          </Stack>
          <Typography variant="body2">
            {truncate(snip.contentText, 160)}
          </Typography>
        </Paper>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Box
            sx={{
              flex: 1,
              px: 1.5,
              py: 1,
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: 13,
              color: "text.secondary",
            }}
          >
            {shareUrl}
          </Box>
          <Tooltip title={copied ? "Copied!" : "Copy link"}>
            <IconButton
              onClick={handleCopy}
              color={copied ? "success" : "default"}
            >
              {copied ? (
                <CheckRoundedIcon fontSize="small" />
              ) : (
                <ContentCopyRoundedIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
          {typeof navigator.share === "function" && (
            <Tooltip title="Share via…">
              <IconButton onClick={handleNativeShare}>
                <IosShareRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>

        <Stack direction="row" spacing={1}>
          {intents.map((intent) => (
            <Box
              key={intent.label}
              component="a"
              href={intent.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                flex: 1,
                textAlign: "center",
                py: 1,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                fontSize: 13,
                fontWeight: 600,
                color: "text.primary",
                textDecoration: "none",
                "&:hover": { bgcolor: "action.hover" },
              }}
            >
              {intent.label}
            </Box>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

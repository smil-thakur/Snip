import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Box, CircularProgress, Typography } from '@mui/material'
import { SnipCard } from '../components/snip/SnipCard'
import { CommentSection } from '../components/snip/CommentSection'
import { getSnip } from '../api/snipApi'
import type { Snip } from '../types'

function truncate(text: string, max = 160) {
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

/** Permalink for a single snip. Updates the document title/description so
 * browser tabs and history read sensibly; full crawler-facing Open Graph
 * previews are a fast-follow (see project notes) since this is a
 * client-rendered SPA route. */
export function SnipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [snip, setSnip] = useState<Snip | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    setSnip(null)
    setNotFound(false)
    getSnip(id)
      .then(setSnip)
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
        This snip doesn't exist or was removed.
      </Typography>
    )
  }

  if (!snip) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    )
  }

  return (
    <Box>
      <Helmet>
        <title>{`${snip.authorName} on Snip.: "${truncate(snip.contentText, 60)}"`}</title>
        <meta name="description" content={truncate(snip.contentText)} />
      </Helmet>
      <SnipCard snip={snip} onUpdated={setSnip} />
      <CommentSection snipId={snip.id} />
    </Box>
  )
}

<div align="center">

# Snip.

**Short, focused notes on what you're learning — like Twitter, but strictly for education and life skills.**

</div>

Snips is a minimal, Twitter-style feed for sharing short educational notes: what you just learned, a tip that stuck with you, a concept explained in a couple of sentences. Rich-text posts, tags, likes, nested comments, follows, and search — built as a small full-stack app with a React/MUI frontend and a Go backend on Firebase.

## Screenshots

<table>
<tr>
<td width="50%">

**Sign in** — Google or email/password
<img src="docs/screenshots/login.png" width="100%" alt="Login page" />

</td>
<td width="50%">

**Home feed** — Quill composer, tags, likes, comment counts
<img src="docs/screenshots/feed-light.png" width="100%" alt="Home feed, light theme" />

</td>
</tr>
<tr>
<td width="50%">

**Dark theme** — one click, everywhere
<img src="docs/screenshots/feed-dark.png" width="100%" alt="Home feed, dark theme" />

</td>
<td width="50%">

**Discover** — Recent / Top / Following / Search tabs
<img src="docs/screenshots/discover-recent.png" width="100%" alt="Discover, recent tab" />

</td>
</tr>
<tr>
<td width="50%">

**Tag search** — filter by topic
<img src="docs/screenshots/discover-search.png" width="100%" alt="Discover, search by tag" />

</td>
<td width="50%">

**Profile** — follow state, bio, published snips
<img src="docs/screenshots/profile.png" width="100%" alt="Profile page" />

</td>
</tr>
<tr>
<td width="50%">

**Nested comments** — reply to a reply
<img src="docs/screenshots/snip-detail-comments.png" width="100%" alt="Snip detail page with nested comments" />

</td>
<td width="50%">

**Share sheet** — copy link, native share, social intents
<img src="docs/screenshots/share-dialog.png" width="100%" alt="Share dialog" />

</td>
</tr>
</table>

**Mobile** — Discover collapses to an icon-only bottom nav bar on small viewports:

<img src="docs/screenshots/mobile-discover.png" width="320" alt="Mobile Discover view with bottom navigation" />

## Features

- **Auth**: Google or email/password sign-in via Firebase Auth, with one-time username claim on first login
- **Rich-text posts**: Quill-based composer (bold/italic/underline/code/lists/quotes/links), edited posts show an "edited" badge
- **Tags & search**: up to 3 tags per snip (recommended chips or custom), Discover's Search tab filters by tag or free text
- **Social graph**: follow/unfollow, followers/following lists, a Following-scoped feed
- **Likes & nested comments**: threaded replies at any depth, with cascade delete
- **Share sheet**: copy link, native Web Share API, X/WhatsApp/LinkedIn intents, live-updating page title/description
- **Light/dark theme**: persisted, respects system preference on first load
- **Responsive**: bottom icon nav on narrow viewports where a full tab bar wouldn't fit

## Tech stack

**Frontend** (this folder): React 19 + TypeScript + Vite, Material UI (minimal border radius, custom light/dark theme), `react-quill-new`, `react-router-dom`, Firebase Auth (client SDK), Axios, DOMPurify for sanitizing rendered rich text.

**Backend** (`../../snips.backend`): Go + Gin, one package per service (`auth`, `user`, `post`, `like`, `follow`, `comment`, `feed`) each with its own model/repository/service/handler, Firebase Admin SDK (Auth verification + Firestore), rate limiting, request size limits, and access logging.

**Data**: Firestore only — the frontend never talks to Firestore directly, everything goes through the Go backend, so Firestore security rules can (and should) deny client access entirely (`allow read, write: if false`).

## Getting started

### Backend

```bash
cd snips.backend
# .env: PORT, FIREBASE_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS, ALLOWED_ORIGINS
go run cmd/server/main.go
```

### Frontend

```bash
cd snips.frontend/snips
# .env: VITE_FIREBASE_* keys, VITE_API_BASE_URL (see .env.example)
npm install
npm run dev
```

A handful of Firestore composite indexes are required for feed/search queries — Firestore's own error messages include a direct console link to create each one the first time a query needs it.

## Contribution

This project was built collaboratively between the project owner SMIL THAKUR and **[Claude](https://claude.ai)** (Anthropic's Claude Code / Sonnet 5), which handled the end-to-end implementation: backend architecture and all Go services, the React/MUI frontend, Firebase wiring, debugging (including a few real bugs caught and fixed during live browser verification along the way), UI/responsive polish, and this README — iterating turn-by-turn based on the owner's direction and feedback.

import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { OnboardingUsernamePage } from './pages/OnboardingUsernamePage'
import { FeedPage } from './pages/FeedPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { ProfilePage } from './pages/ProfilePage'
import { FollowersPage } from './pages/FollowersPage'
import { FollowingPage } from './pages/FollowingPage'
import { SnipDetailPage } from './pages/SnipDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/onboarding/username"
        element={
          <ProtectedRoute>
            <OnboardingUsernamePage />
          </ProtectedRoute>
        }
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<FeedPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/s/:id" element={<SnipDetailPage />} />
        <Route path="/:username" element={<ProfilePage />} />
        <Route path="/:username/followers" element={<FollowersPage />} />
        <Route path="/:username/following" element={<FollowingPage />} />
      </Route>
    </Routes>
  )
}

export default App

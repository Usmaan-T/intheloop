import React, { useEffect } from 'react'
import SignUp from './Pages/Authentication/SignUp'
import { Route, Routes, Navigate} from 'react-router-dom'
import Home from './Pages/Home/Home'
import AuthPage from './Pages/Authentication/AuthPage'
import LogIn from './Pages/Authentication/LogIn'
import Upload from './Pages/Upload/Upload'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from './firebase/firebase'
import ProfilePage from './Pages/ProfilePage/ProfilePage'
import CreatePlaylist from './components/Playlist/CreatePlaylist'
import ExplorePage from './Pages/Explore/ExplorePage'
import SchemaMigrationPage from './Pages/Admin/SchemaMigrationPage'
import PlaylistDetailPage from './Pages/Playlist/PlaylistDetailPage'
import LoggedInHome from './Pages/Home/LoggedInHome'
import UserProfilePage from './Pages/User/UserProfilePage'
import SamplesPage from './Pages/Samples/SamplesPage'
import useUserStreak from './hooks/useUserStreak'
import { resetDailyStreakFlags } from './utils/streakUtils'

const App = () => {
  const [user, loading] = useAuthState(auth);
  
  // Get reset function from streak hook for the current user
  const { resetDailyStreak } = useUserStreak(user?.uid);
  
  useEffect(() => {
    if (user) {
      // Reset streak flag for current user when app loads
      resetDailyStreak();
    }
  }, [user, resetDailyStreak]);
  
  // This would typically be a cloud function that runs at midnight,
  // but we're including it here for demonstration purposes.
  // In a real app, this should be moved to a server-side scheduled function.
  useEffect(() => {
    // Only let admin users manually reset all streaks (for testing/admin purposes)
    const isAdmin = user?.email === 'admin@example.com'; // Replace with your admin check
    
    if (isAdmin) {
      const now = new Date();
      const hours = now.getHours();
      
      // If it's early morning (after midnight), reset all streaks
      // This is just for demo purposes - in production use a cloud function
      if (hours >= 0 && hours < 2) {
        resetDailyStreakFlags()
          .then(() => console.log('Daily streak flags reset'))
          .catch(error => console.error('Error resetting streak flags:', error));
      }
    }
  }, [user]);
  
  console.log('Current user:', user);
  
  if (loading) {
    // Optionally render a loading spinner or placeholder
    return <div>Loading...</div>;
  }
  return (
    <Routes>
      <Route path='/' element={user ? <LoggedInHome /> : <Home />} />
      <Route path='/auth' element={<AuthPage/>} />
      <Route path='/login' element={<LogIn />} />
      <Route path='/upload' element={user ? <Upload /> : <Navigate to="/auth" />} />
      <Route path='/profilepage' element={<ProfilePage />} />
      <Route path='/explore' element={<ExplorePage />} />
      <Route path='/samples' element={<SamplesPage />} />
      <Route path='/createplaylist' element={<CreatePlaylist />} />
      <Route path='/admin/migration' element={<SchemaMigrationPage />} />
      <Route path='/playlist/:id' element={<PlaylistDetailPage />} />
      <Route path="/user/:userId" element={<UserProfilePage />} />
    </Routes>
  )
}

export default App
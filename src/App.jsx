import React from 'react'
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

const App = () => {
  const [user, loading] = useAuthState(auth);
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
      <Route path='/explore' element={<ExplorePage />} /> {/* Add this route */}
      <Route path='/createplaylist' element={<CreatePlaylist />} />
      <Route path='/admin/migration' element={<SchemaMigrationPage />} />
      <Route path='/playlist/:id' element={<PlaylistDetailPage />} />
      <Route path="/user/:userId" element={<UserProfilePage />} />
    </Routes>
  )
}

export default App
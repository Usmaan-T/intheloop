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


const App = () => {
  const [user, loading] = useAuthState(auth);
  console.log('Current user:', user);
  
  if (loading) {
    // Optionally render a loading spinner or placeholder
    return <div>Loading...</div>;
  }
  return (
    <Routes>
      <Route path='/' element={<Home />}/>
      <Route path='/auth' element={<AuthPage/>} />
      <Route path='/login' element={<LogIn />} />
      <Route path='/upload' element={user ? <Upload /> : <Navigate to="/auth" />} />
      <Route path='/profilepage' element={<ProfilePage />} />
      <Route path='/createplaylist' element={<CreatePlaylist />} />
    </Routes>
  )
}

export default App
import React from 'react'
import { useSignOut } from 'react-firebase-hooks/auth'
import { useNavigate } from 'react-router-dom'
import { auth } from '../firebase/firebase'

export const useLogout = () => {
    const [signOut, loading, error] = useSignOut(auth)
    const navigate = useNavigate()
    
    const handleLogout = async () => {
        try {
            await signOut();
            localStorage.removeItem('user-info')
            // Redirect to auth page after successful logout
            navigate('/auth')
        } catch (error) {
            console.log(error.message)
        }
    }
    
    return {handleLogout, loading, error}
}

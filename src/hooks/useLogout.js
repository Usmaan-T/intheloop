import React from 'react'
import { useSignOut } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/firebase'
export const useLogout = () => {
    const [signOut, loading, error] = useSignOut(auth)
    const handleLogout = async () => {
        try {
            await signOut();
            localStorage.removeItem('user-info')
        } catch (error) {
            console.log(error.message)
        }
    }
    return {handleLogout, loading, error}
}

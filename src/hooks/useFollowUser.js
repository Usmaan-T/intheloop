import React, { useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/firebase'
import { useToast } from '@chakra-ui/react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { firestore } from '../firebase/firebase'


const useFollowUser = () => {
    const [user] = useAuthState(auth)
    const toast = useToast()
    const [loading, setLoading] = useState(false) // Add loading state

    const followUser = async (userId) => {
        if (!user) {
            toast({
                title: 'Please login',
                description: 'You need to be logged in to follow users',
                status: 'error',
                duration: 3000,
                isClosable: true
            })
            return false
        }

        setLoading(true) // Set loading to true when operation starts
        try {
            const userRef = doc(firestore, 'users', user.uid)
            const userSnap = await getDoc(userRef)

            if (!userSnap.exists()) {
                throw new Error('User not found')
            }

            const userData = userSnap.data()
            const following = userData.following || []

            // Check if already following
            if (following.includes(userId)) {
                throw new Error('Already following this user')
            }

            following.push(userId)
            await updateDoc(userRef, { following })

            const targetUserRef = doc(firestore, 'users', userId)
            const targetUserSnap = await getDoc(targetUserRef)

            if (!targetUserSnap.exists()) {
                throw new Error('Target user not found')
            }

            const targetUserData = targetUserSnap.data()
            const followers = targetUserData.followers || []

            followers.push(user.uid)
            await updateDoc(targetUserRef, { followers })

            toast({
                title: 'User followed',
                description: 'You are now following this user',
                status: 'success',
                duration: 3000,
                isClosable: true
            })
        } catch (error) {
            console.error('Error following user:', error)
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true
            })
        } finally {
            setLoading(false) // Reset loading when operation completes
        }
    }

    return { followUser, loading } // Return loading state
}

export default useFollowUser
import React, { useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase/firebase'
import { useToast } from '@chakra-ui/react'
import { doc, getDoc, updateDoc, runTransaction } from 'firebase/firestore'
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
            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, 'users', user.uid)
                const userSnap = await transaction.get(userRef)

                if (!userSnap.exists()) {
                    throw new Error('User not found')
                }

                const targetUserRef = doc(firestore, 'users', userId)
                const targetUserSnap = await transaction.get(targetUserRef)

                if (!targetUserSnap.exists()) {
                    throw new Error('Target user not found')
                }

                const userData = userSnap.data()
                const following = userData.following || []

                const targetUserData = targetUserSnap.data()
                const followers = targetUserData.followers || []

                if (following.includes(userId)) {
                    throw new Error('Already following this user')
                }

                transaction.update(userRef, { 
                    following: [...following, userId] 
                })
                
                transaction.update(targetUserRef, { 
                    followers: [...followers, user.uid] 
                })
            })

            toast({
                title: 'User followed',
                description: 'You are now following this user',
                status: 'success',
                duration: 3000,
                isClosable: true
            })
            
            return true
        } catch (error) {
            console.error('Error following user:', error)
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true
            })
            return false
        } finally {
            setLoading(false) // Reset loading when operation completes
        }
    }

    const unfollowUser = async (userId) => {
        if (!user) {
            toast({
                title: 'Please login',
                description: 'You need to be logged in to unfollow users',
                status: 'error',
                duration: 3000,
                isClosable: true
            })
            return false
        }

        setLoading(true)
        try {
            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, 'users', user.uid)
                const userSnap = await transaction.get(userRef)

                if (!userSnap.exists()) {
                    throw new Error('User not found')
                }

                const targetUserRef = doc(firestore, 'users', userId)
                const targetUserSnap = await transaction.get(targetUserRef)

                if (!targetUserSnap.exists()) {
                    throw new Error('Target user not found')
                }

                const userData = userSnap.data()
                const following = userData.following || []

                const targetUserData = targetUserSnap.data()
                const followers = targetUserData.followers || []

                if (!following.includes(userId)) {
                    throw new Error('Not following this user')
                }

                transaction.update(userRef, { 
                    following: following.filter(id => id !== userId)
                })
                
                transaction.update(targetUserRef, { 
                    followers: followers.filter(id => id !== user.uid)
                })
            })

            toast({
                title: 'User unfollowed',
                description: 'You have unfollowed this user',
                status: 'success',
                duration: 3000,
                isClosable: true
            })
            
            return true
        } catch (error) {
            console.error('Error unfollowing user:', error)
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true
            })
            return false
        } finally {
            setLoading(false)
        }
    }

    const isFollowing = async (userId) => {
        if (!user || !userId) return false
        
        try {
            const userRef = doc(firestore, 'users', user.uid)
            const userSnap = await getDoc(userRef)
            
            if (!userSnap.exists()) return false
            
            const userData = userSnap.data()
            const following = userData.following || []
            
            return following.includes(userId)
        } catch (error) {
            console.error('Error checking follow status:', error)
            return false
        }
    }

    return { followUser, unfollowUser, isFollowing, loading } // Return loading state
}

export default useFollowUser
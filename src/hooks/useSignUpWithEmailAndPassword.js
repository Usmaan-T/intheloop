import { setDoc, doc } from 'firebase/firestore';
import { auth, firestore } from '../firebase/firebase';

import React, { useState } from 'react'
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';

const useSignUpWithEmailAndPassword = () => {
    const [
        createUserWithEmailAndPassword,
        user,
        loading,
        error,
      ] = useCreateUserWithEmailAndPassword(auth);
    
    const [success, setSuccess] = useState(false);
    
    const signup = async (inputs) => {
        if(!inputs.email || !inputs.password || !inputs.username) {
            console.log("Please fill in all fields")
            return
        }
        
        try {
            const newUser = await createUserWithEmailAndPassword(inputs.email, inputs.password)
            if(!newUser && error) {
                console.log(error)
                return
            }
            if(newUser) {
                const userDoc = {
                    uid: newUser.user.uid,
                    email: inputs.email,
                    username: inputs.username,
                    bio: "",
                    profilePicURL: "",
                    followers: [],
                    following: [],
                    posts: [],
                    createdAt: Date.now(),
                    currentStreak: 0,
                    longestStreak: 0,
                    lastUploadDate: null,
                    streakUpdatedToday: false
                }
                await setDoc(doc(firestore, "users", newUser.user.uid), userDoc);
                localStorage.setItem("user-info", JSON.stringify(userDoc));
                setSuccess(true);
            }
        } catch (error) {
            console.log(error)
        }
    }
  return {error, loading, signup, user, success}
}

export default useSignUpWithEmailAndPassword
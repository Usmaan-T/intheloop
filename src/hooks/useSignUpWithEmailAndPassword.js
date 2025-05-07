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
    const [customError, setCustomError] = useState(null);
    
    const signup = async (inputs) => {
        // Reset any previous errors
        setCustomError(null);
        
        if(!inputs.email || !inputs.password || !inputs.username) {
            setCustomError("Please fill in all fields");
            return;
        }

        // Check password length
        if(inputs.password.length < 8) {
            setCustomError("Password must be at least 8 characters");
            return;
        }
        
        try {
            const newUser = await createUserWithEmailAndPassword(inputs.email, inputs.password);
            if(!newUser && error) {
                console.error(error.message);
                setCustomError(error.message || "Failed to create account");
                return;
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
            console.error("Signup error:", error.message);
            // Map Firebase error codes to user-friendly messages
            if (error.code === 'auth/email-already-in-use') {
                setCustomError('This email is already in use');
            } else if (error.code === 'auth/invalid-email') {
                setCustomError('Invalid email format');
            } else if (error.code === 'auth/weak-password') {
                setCustomError('Password is too weak. It must be at least 8 characters');
            } else if (error.code === 'auth/network-request-failed') {
                setCustomError('Network error. Please check your connection');
            } else {
                setCustomError(error.message || 'An error occurred during signup');
            }
        }
    }
  return {error: customError || error?.message, loading, signup, user, success}
}

export default useSignUpWithEmailAndPassword
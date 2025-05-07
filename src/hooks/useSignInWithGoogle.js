import { useState } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase/firebase';

const useSignInWithGoogle = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if this user already has a document in Firestore
      const userDocRef = doc(firestore, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      
      // If user doesn't exist in Firestore, create a document for them
      if (!userDoc.exists()) {
        const username = user.displayName?.split(' ').join('').toLowerCase() || 
                         user.email?.split('@')[0] || 
                         `user${Math.floor(Math.random() * 10000)}`;
        
        const newUserDoc = {
          uid: user.uid,
          email: user.email,
          username: username,
          bio: "",
          profilePicURL: user.photoURL || "",
          followers: [],
          following: [],
          posts: [],
          createdAt: Date.now(),
          currentStreak: 0,
          longestStreak: 0,
          lastUploadDate: null,
          streakUpdatedToday: false
        };
        
        await setDoc(userDocRef, newUserDoc);
        localStorage.setItem("user-info", JSON.stringify(newUserDoc));
      } else {
        // User exists, store their info in localStorage
        localStorage.setItem("user-info", JSON.stringify(userDoc.data()));
      }
      
      setUser(user);
      setSuccess(true);
      setLoading(false);
      return user;
    } catch (error) {
      console.error("Google sign-in error:", error);
      
      // Map error codes to user-friendly messages
      if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. The popup was closed.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        setError('Another sign-in attempt is in progress.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection.');
      } else {
        setError(error.message || 'An error occurred during Google sign-in');
      }
      
      setLoading(false);
      return null;
    }
  };

  return { loading, error, signInWithGoogle, user, success };
};

export default useSignInWithGoogle; 
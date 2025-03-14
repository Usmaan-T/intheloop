
import { setDoc, doc } from 'firebase/firestore';
import { auth, firestore } from '../firebase/firebase';

import React from 'react'
import { useCreateUserWithEmailAndPassword } from 'react-firebase-hooks/auth';

const useSignUpWithEmailAndPassword = () => {
    const [
        createUserWithEmailAndPassword,
        user,
        loading,
        error,
      ] = useCreateUserWithEmailAndPassword(auth);
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
                    uid:newUser.user.uid,
                    email:inputs.email,
                    username:inputs.username,
                    bio:"",
                    profilePicURL:"",
                    followers:[],
                    following:[],
                    posts:[],
                    createdAt:Date.now()
                }
                await setDoc(doc(firestore, "users", newUser.user.uid), userDoc);
                localStorage.setItem("user-info", JSON.stringify(userDoc))
            }
        } catch (error) {
            console.log(error)
        }
    }
  return {error, loading, signup}
}

export default useSignUpWithEmailAndPassword
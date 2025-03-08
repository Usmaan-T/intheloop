// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyAKMni7pFS3YZbuLS4X1hQD07RVTKWf85w",
  authDomain: "instagram-clone-56643.firebaseapp.com",
  projectId: "instagram-clone-56643",
  storageBucket: "instagram-clone-56643.firebasestorage.app",
  messagingSenderId: "92664376691",
  appId: "1:92664376691:web:8a71d91eb8871391c02906",
  measurementId: "G-0F20EGK31E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app)
const firestore = getFirestore(app)
const storage = getStorage(app)

export {app, auth, firestore, storage}
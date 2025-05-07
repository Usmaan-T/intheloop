import React from 'react'
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage, firestore } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import useUserStreak from './useUserStreak';

const useUploadFiles = () => {
  const [audioUpload, setAudioUpload] = useState(null);
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [inputs, setInputs] = useState({
    name: '',
    key: '',
    bpm: '',
    tags: ''
  });
  
  // Add streak hook
  const { updateStreakOnUpload } = useUserStreak(user?.uid);

  const uploadAudio = async () => {
    // Reset error state
    setUploadError('');
    
    // Validate file
    if (!audioUpload) {
      setUploadError('No audio selected.');
      return false;
    }
    
    // Validate user
    if (!user) {
      setUploadError('User is not authenticated.');
      return false;
    }
    
    // Validate required fields before starting the upload
    if (!inputs.name || !inputs.name.trim()) {
      setUploadError('Please enter a track name.');
      return false;
    }
    
    if (!inputs.key || !inputs.key.trim()) {
      setUploadError('Please select a musical key.');
      return false;
    }
    
    if (!inputs.bpm || !inputs.bpm.trim()) {
      setUploadError('Please enter a BPM value.');
      return false;
    }

    // Start loading state
    setLoading(true);

    const storageRef = ref(storage, `audio/${audioUpload.name}_${uuidv4()}`);
    try {
      // Upload the file
      const snapshot = await uploadBytes(storageRef, audioUpload);
      // Get the download URL of the uploaded file
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Create a post object with additional fields
      const post = {
        userId: user.uid,
        audioUrl: downloadURL,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: [],
        bpm: inputs.bpm,
        key: inputs.key,
        name: inputs.name,
        tags: inputs.key ? [...(inputs.tags || []), inputs.key] : inputs.tags || []
      };

      // Save the post object in Firestore under the "posts" collection
      await addDoc(collection(firestore, 'posts'), post);
      
      // Update the user's streak after successful upload
      await updateStreakOnUpload();
      
      console.log('Post saved successfully!');
      return true;
    } catch (error) {
      console.error('Error uploading audio: ', error);
      setUploadError('Failed to upload audio. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!audioUpload) {
      return { isValid: false, error: 'No audio selected.' };
    }
    
    if (!inputs.name || !inputs.name.trim()) {
      return { isValid: false, error: 'Please enter a track name.' };
    }
    
    if (!inputs.key || !inputs.key.trim()) {
      return { isValid: false, error: 'Please select a musical key.' };
    }
    
    if (!inputs.bpm || !inputs.bpm.trim()) {
      return { isValid: false, error: 'Please enter a BPM value.' };
    }
    
    return { isValid: true, error: '' };
  };

  return {
    audioUpload,
    setAudioUpload,
    loading,
    uploadError,
    uploadAudio,
    setInputs,
    inputs,
    validateForm
  };
}

export default useUploadFiles;
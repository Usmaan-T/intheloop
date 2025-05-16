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

    try {
      // 1. Upload the audio file
      const audioStorageRef = ref(storage, `audio/${audioUpload.name}_${uuidv4()}`);
      const audioSnapshot = await uploadBytes(audioStorageRef, audioUpload);
      const audioDownloadURL = await getDownloadURL(audioSnapshot.ref);
      
      // 2. Upload the cover image if provided
      let coverImageUrl = null;
      if (inputs.coverImage) {
        try {
          const imageId = uuidv4();
          const imageFileName = `cover_${imageId}_${inputs.coverImage.name}`;
          const imageStorageRef = ref(storage, `covers/${imageFileName}`);
          const imageSnapshot = await uploadBytes(imageStorageRef, inputs.coverImage);
          coverImageUrl = await getDownloadURL(imageSnapshot.ref);
          console.log('Cover image uploaded successfully:', coverImageUrl);
        } catch (imageError) {
          console.error('Error uploading cover image: ', imageError);
          // Continue without the cover image
        }
      }

      // 3. Create a post object with additional fields
      const post = {
        userId: user.uid,
        audioUrl: audioDownloadURL,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: [],
        bpm: inputs.bpm,
        key: inputs.key,
        name: inputs.name,
        tags: inputs.key ? [...(inputs.tags || []), inputs.key] : inputs.tags || []
      };
      
      // Add cover image URL if we have one
      if (coverImageUrl) {
        post.coverImage = coverImageUrl;
      }

      // 4. Save the post object in Firestore under the "posts" collection
      await addDoc(collection(firestore, 'posts'), post);
      
      // 5. Update the user's streak after successful upload
      await updateStreakOnUpload();
      
      console.log('Post saved successfully!', post);
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
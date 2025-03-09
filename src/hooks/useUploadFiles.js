import React from 'react'
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage, firestore } from '../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const useUploadFiles = () => {
  const [audioUpload, setAudioUpload] = useState(null);
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [inputs, setInputs] = useState({
    name: '',
    key: '',
    bpm: ''
  });

  const uploadAudio = async () => {
    if (!audioUpload) {
      setUploadError('No audio selected.');
      return;
    }
    if (!user) {
      setUploadError('User is not authenticated.');
      return;
    }

    setLoading(true);
    setUploadError('');

    const storageRef = ref(storage, `audio/${audioUpload.name}_${uuidv4()}`);
    try {
      // Upload the file
      const snapshot = await uploadBytes(storageRef, audioUpload);
      // Get the download URL of the uploaded file
      const downloadURL = await getDownloadURL(snapshot.ref);

    if (!inputs.name || !inputs.key || !inputs.bpm) {
        setUploadError('Please fill in all fields.');
        return;
    }
      // Create a post object with additional fields
      const post = {
        userId: user.uid,
        audioUrl: downloadURL,
        createdAt: serverTimestamp(),
        likes: 0,
        comments: [],
        bpm: inputs.bpm,
        key: inputs.key,
        name: inputs.name
      };

      // Save the post object in Firestore under the "posts" collection
      await addDoc(collection(firestore, 'posts'), post);
      console.log('Post saved successfully!');
    } catch (error) {
      console.error('Error uploading audio: ', error);
      setUploadError('Failed to upload audio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    audioUpload,
    setAudioUpload,
    loading,
    uploadError,
    uploadAudio,
    setInputs,
    inputs
  };
}

export default useUploadFiles;
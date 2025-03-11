import React from 'react'
import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage, firestore } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const useCreatePlaylist = () => {
  const [user] = useAuthState(auth);
  const [inputs, setInputs] = useState({ name: '', description: '', privacy: 'public' });
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const createPlaylist = async () => {
    if (!user) {
      setUploadError('You must be logged in to create a playlist');
      return false;
    }

    if (!inputs.name) {
      setUploadError('Playlist name is required');
      return false;
    }

    try {
      setLoading(true);
      setUploadError(null);

      // Prepare playlist data
      const playlistData = {
        name: inputs.name,
        description: inputs.description || '',
        userId: user.uid,
        createdAt: serverTimestamp(),
        privacy: inputs.privacy || 'public',
        colorCode: ['#8A2BE2', '#4A90E2', '#50C878', '#FF6347', '#FFD700'][
          Math.floor(Math.random() * 5)
        ],
        tracks: []
      };

      // Handle cover image upload if provided
      if (inputs.coverImage) {
        // Generate unique filename for the image
        const imageFileName = `playlists/${user.uid}_${Date.now()}_${inputs.coverImage.name}`;
        const storageRef = ref(storage, imageFileName);
        
        // Upload the image
        await uploadBytes(storageRef, inputs.coverImage);
        
        // Get the image URL
        const imageUrl = await getDownloadURL(storageRef);
        
        // Add the image URL to playlist data
        playlistData.coverImage = imageUrl;
      }

      // Add to Firestore
      const playlistRef = await addDoc(collection(firestore, 'playlists'), playlistData);
      console.log('Playlist created with ID:', playlistRef.id);
      
      // Reset form
      setInputs({ name: '', description: '', privacy: 'public' });
      setLoading(false);
      return true;
    } catch (error) {
      console.error('Error creating playlist:', error);
      setUploadError(error.message);
      setLoading(false);
      return false;
    }
  };

  return { inputs, setInputs, loading, uploadError, createPlaylist };
};

export default useCreatePlaylist;
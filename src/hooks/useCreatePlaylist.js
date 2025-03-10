import React from 'react'
import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, storage, firestore } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const useCreatePlaylist = () => {
    const [inputs, setInputs] = useState({
        name: '',
        description: '',
      });
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(false);
    const [uploadError, setUploadError] = useState('');

    const createPlaylist = async () => {
        if (!user) {
            setUploadError('User is not authenticated.');
            return;
        }
        if (!inputs.name || !inputs.description) {
            setUploadError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        setUploadError('');

        const playlist = {
            userId: user.uid,
            name: inputs.name,
            description: inputs.description,
            createdAt: serverTimestamp(),
            tracks: [],
        };
        try {
            await addDoc(collection(firestore, 'playlists'), playlist);
            console.log('Playlist saved successfully!');
        }
        catch (error) {
            console.error('Error creating playlist: ', error);
        } finally {
            setLoading(false);
        }
        }
    return (
        { inputs, setInputs, loading, uploadError, createPlaylist }
    );
}

export default useCreatePlaylist;
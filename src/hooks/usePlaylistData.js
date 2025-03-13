import { useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { useToast } from '@chakra-ui/react';

const usePlaylistData = () => {
    const [playlistData, setPlaylistData] = useState(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [user] = useAuthState(auth); // Get user directly in the hook
    const toast = useToast();

    const addToPlaylist = async (track, playlist) => {
        if (!user) {
            toast({
                title: 'Authentication required',
                description: 'Please log in to add tracks to playlists',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return false;
        }

        if (!playlist || !playlist.id) {
            toast({
                title: 'Invalid playlist',
                description: 'The selected playlist is invalid',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return false;
        }

        // Validate track data
        if (!track || !track.id || !track.audioUrl) {
            toast({
                title: 'Invalid track data',
                description: 'The track data is incomplete',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return false;
        }

        setIsAdding(true);
        try {
            // First, get the latest playlist data
            const playlistRef = doc(firestore, 'playlists', playlist.id);
            const playlistDoc = await getDoc(playlistRef);
            
            if (!playlistDoc.exists()) {
                throw new Error('Playlist not found');
            }
            
            const currentData = playlistDoc.data();
            
            // Ensure tracks array exists
            const currentTracks = currentData.tracks || [];
            
            // Sanitize track data (remove any undefined values)
            const cleanTrack = {};
            Object.keys(track).forEach(key => {
                if (track[key] !== undefined) {
                    cleanTrack[key] = track[key];
                }
            });
            
            // Add default values for critical fields if missing
            if (!cleanTrack.name) cleanTrack.name = 'Untitled Track';
            
            // Update the playlist
            await updateDoc(playlistRef, {
                tracks: [...currentTracks, cleanTrack]
            });

            toast({
                title: 'Track added to playlist',
                status: 'success',
                duration: 3000,
                isClosable: true
            });
            
            return true;
        } catch (error) {
            console.error('Error adding track to playlist:', error);
            toast({
                title: 'Error adding track to playlist',
                description: error.message,
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return false;
        } finally {
            setIsAdding(false);
        }
    };

    return { 
        playlistData, 
        isAdding, 
        isLoading, 
        addToPlaylist
    };
};

export default usePlaylistData;
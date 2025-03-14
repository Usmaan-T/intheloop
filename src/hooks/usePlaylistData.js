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
    const [user] = useAuthState(auth);
    const toast = useToast();

    const addToPlaylist = async (track, playlist) => {
        // Basic validation
        if (!user) {
            toast({
                title: 'Please login',
                description: 'You need to be logged in to add tracks',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return false;
        }
        
        if (!playlist?.id) {
            toast({
                title: 'Error',
                description: 'Invalid playlist selected',
                status: 'error',
                duration: 3000,
                isClosable: true
            });
            return false;
        }

        setIsAdding(true);
        
        try {
            // First get fresh playlist data
            const playlistRef = doc(firestore, 'playlists', playlist.id);
            const playlistSnap = await getDoc(playlistRef);
            
            if (!playlistSnap.exists()) {
                throw new Error('Playlist not found');
            }
            
            const playlistData = playlistSnap.data();
            
            // Ensure tracks array exists
            const currentTracks = playlistData.tracks || [];
            
            // Check if track already exists
            const isDuplicate = currentTracks.some(t => t.id === track.id);
            if (isDuplicate) {
                toast({
                    title: 'Already added',
                    description: 'This track is already in the playlist',
                    status: 'info',
                    duration: 3000,
                    isClosable: true
                });
                setIsAdding(false);
                return false;
            }
            
            // Sanitize the track object to avoid undefined values
            const safeTrack = {
                id: track.id,
                name: track.name || 'Untitled Track',
                audioUrl: track.audioUrl,
                key: track.key || 'Unknown',
                bpm: track.bpm || 0,
                addedAt: new Date(),
                userId: track.userId || 'unknown'
            };
            
            // Add coverImage only if it exists
            if (track.coverImage) {
                safeTrack.coverImage = track.coverImage;
            }
            
            // Add tags only if they exist and are an array
            if (Array.isArray(track.tags)) {
                safeTrack.tags = [...track.tags];
            } else {
                safeTrack.tags = []; // Ensure we always have a tags array
            }
            
            // Update the playlist document
            await updateDoc(playlistRef, {
                tracks: [...currentTracks, safeTrack]
            });
            
            toast({
                title: 'Track added',
                description: 'Track was added to your playlist',
                status: 'success',
                duration: 3000,
                isClosable: true
            });
            
            return true;
        } catch (error) {
            console.error('Error adding to playlist:', error);
            toast({
                title: 'Error',
                description: 'Failed to add track to playlist',
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
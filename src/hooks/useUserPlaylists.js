import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

const useUserPlaylists = (userId, refreshTrigger = 0) => {
    const [playlists, setPlaylists] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setPlaylists([]);
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const playlistsQuery = query(
                collection(firestore, 'playlists'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(
                playlistsQuery,
                (snapshot) => {
                    const playlistData = snapshot.docs.map(doc => ({ 
                        id: doc.id, 
                        ...doc.data(),
                        // Convert Firestore Timestamp to JS Date
                        createdAt: doc.data().createdAt?.toDate?.() || new Date()
                    }));
                    console.log("Fetched playlists:", playlistData);
                    setPlaylists(playlistData);
                    setIsLoading(false);
                },
                (err) => {
                    console.error("Error fetching playlists:", err);
                    setError(err);
                    setIsLoading(false);
                }
            );

            return () => unsubscribe();
        } catch (err) {
            console.error("Failed to set up playlist listener:", err);
            setError(err);
            setIsLoading(false);
        }
    }, [userId, refreshTrigger]);

    return { playlists, isLoading, error };
};

export default useUserPlaylists;
import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Hook to fetch a user's tracks with pagination and sorting options
 * 
 * @param {string} userId - The user's ID
 * @param {string} sortBy - Sort option ('newest' or 'popular')
 * @param {number} pageSize - Number of items per page
 * @returns {Object} - Tracks, loading state, error state, and load more function
 */
const useUserPaginatedTracks = (userId, sortBy = 'newest', pageSize = 3) => {
  const [tracks, setTracks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Determine the sort field and direction based on sortBy
  const getSortParams = useCallback(() => {
    switch (sortBy) {
      case 'popular':
        return { field: 'likes', direction: 'desc' };
      case 'newest':
      default:
        return { field: 'createdAt', direction: 'desc' };
    }
  }, [sortBy]);

  // Initial load of tracks
  useEffect(() => {
    const fetchInitialTracks = async () => {
      if (!userId) return;

      setIsLoading(true);
      setError(null);
      
      try {
        const sortParams = getSortParams();
        
        const tracksQuery = query(
          collection(firestore, 'posts'),
          where('userId', '==', userId),
          orderBy(sortParams.field, sortParams.direction),
          limit(pageSize)
        );
        
        const snapshot = await getDocs(tracksQuery);
        
        if (snapshot.empty) {
          setTracks([]);
          setHasMore(false);
        } else {
          const fetchedTracks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setTracks(fetchedTracks);
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length === pageSize);
        }
      } catch (err) {
        console.error('Error fetching tracks:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    setTracks([]);
    setLastVisible(null);
    setHasMore(true);
    fetchInitialTracks();
  }, [userId, sortBy, pageSize, getSortParams]);

  // Function to load more tracks
  const loadMore = useCallback(async () => {
    if (!userId || !hasMore || isLoading || !lastVisible) return;
    
    setIsLoading(true);
    
    try {
      const sortParams = getSortParams();
      
      const tracksQuery = query(
        collection(firestore, 'posts'),
        where('userId', '==', userId),
        orderBy(sortParams.field, sortParams.direction),
        startAfter(lastVisible),
        limit(pageSize)
      );
      
      const snapshot = await getDocs(tracksQuery);
      
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const newTracks = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setTracks(prevTracks => [...prevTracks, ...newTracks]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length === pageSize);
      }
    } catch (err) {
      console.error('Error loading more tracks:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, hasMore, isLoading, lastVisible, pageSize, getSortParams]);

  return {
    tracks,
    isLoading,
    error,
    hasMore,
    loadMore
  };
};

export default useUserPaginatedTracks; 
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter, where } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

const useExploreData = (initialLimit = 10) => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Fisher-Yates shuffle algorithm for randomizing samples
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Function to get initial samples with randomization
  const fetchInitialSamples = async () => {
    setLoading(true);
    try {
      // Generate a random starting point by using a random date constraint
      // This gives us a different subset of samples each time
      const randomStartDate = new Date();
      randomStartDate.setDate(randomStartDate.getDate() - Math.floor(Math.random() * 365)); // Random day within the last year
      
      // Fetch a larger set for better randomization
      const fetchLimit = initialLimit * 2; 
      
      // Option 1: Fetch newer than random date
      const newerQuery = query(
        collection(firestore, 'posts'),
        where('createdAt', '>', randomStartDate),
        limit(fetchLimit)
      );
      
      // Execute query and get documents
      let snapshot = await getDocs(newerQuery);
      
      // If we didn't get enough samples, also fetch older samples
      if (snapshot.docs.length < initialLimit) {
        const olderQuery = query(
          collection(firestore, 'posts'),
          where('createdAt', '<', randomStartDate),
          limit(fetchLimit)
        );
        
        const olderSnapshot = await getDocs(olderQuery);
        snapshot = {
          docs: [...snapshot.docs, ...olderSnapshot.docs]
        };
      }
      
      if (snapshot.docs.length === 0) {
        setSamples([]);
        setHasMore(false);
      } else {
        // Convert to array of sample objects
        const fetchedSamples = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Shuffle the array to randomize the order
        const shuffledSamples = shuffleArray(fetchedSamples);
        
        // Take only the number we need
        const limitedSamples = shuffledSamples.slice(0, initialLimit);
        
        setSamples(limitedSamples);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= initialLimit);
      }
    } catch (err) {
      console.error("Error fetching explore samples:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Modified fetchMoreSamples to add randomization
  const fetchMoreSamples = async () => {
    if (!hasMore || !lastVisible) return;
    
    setLoading(true);
    try {
      // Fetch samples using a different strategy for "more" samples
      // Option 1: Get samples with timestamp less than last visible
      const moreQuery = query(
        collection(firestore, 'posts'),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(initialLimit * 2) // Fetch more for better randomization
      );

      const snapshot = await getDocs(moreQuery);
      
      if (snapshot.empty) {
        setHasMore(false);
      } else {
        const newSamples = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Shuffle the new samples
        const shuffledNewSamples = shuffleArray(newSamples);
        
        // Take only what we need
        const limitedNewSamples = shuffledNewSamples.slice(0, initialLimit);
        
        setSamples(prevSamples => [...prevSamples, ...limitedNewSamples]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= initialLimit);
      }
    } catch (err) {
      console.error("Error fetching more samples:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchInitialSamples();
  }, []);

  return { 
    samples, 
    loading, 
    error, 
    fetchMoreSamples, 
    hasMore,
    refreshSamples: fetchInitialSamples
  };
};

export default useExploreData;

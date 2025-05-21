import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs, startAfter, where } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { SAMPLE_TAGS } from './useSamplesData';

const useExploreData = (initialLimit = 10) => {
  const [user] = useAuthState(auth);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [userTagPreferences, setUserTagPreferences] = useState({});

  // Fisher-Yates shuffle algorithm for randomizing samples
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Calculate user's tag preferences based on their interactions
  const calculateTagPreferences = useCallback(async (userId) => {
    if (!userId) return {};
    
    try {
      // Get user document to analyse likes
      const userDoc = await getDocs(query(collection(firestore, 'users'), where('__name__', '==', userId)));
      
      if (userDoc.empty) {
        return {};
      }
      
      const userData = userDoc.docs[0].data();
      const userLikes = userData.likes || [];
      
      // Fetch user's liked samples to analyse their tags
      const tagCounts = {};
      let totalInteractions = 0;
      
      // Process liked samples to get tags
      if (userLikes.length > 0) {
        // Add randomness when selecting samples to analyze
        const shuffledLikes = [...userLikes].sort(() => Math.random() - 0.5);
        const selectedLikes = shuffledLikes.slice(0, Math.min(10, shuffledLikes.length));
        
        // If we have likes, query them directly
        if (selectedLikes.length > 0) {
          const samplesQuery = query(
            collection(firestore, 'posts'),
            where('__name__', 'in', selectedLikes)
          );
          
          const samplesSnapshot = await getDocs(samplesQuery);
          
          samplesSnapshot.forEach(doc => {
            const sample = doc.data();
            if (sample.tags && Array.isArray(sample.tags)) {
              sample.tags.forEach(tag => {
                // Likes have higher weight
                const randomWeight = 3 + (Math.random() - 0.5);
                tagCounts[tag] = (tagCounts[tag] || 0) + randomWeight;
                totalInteractions += randomWeight;
              });
            }
          });
        }
      }
      
      // Get user interactions from sampleStats collection
      const statsQuery = query(
        collection(firestore, 'sampleStats'),
        where('userId', '==', userId),
        limit(20)
      );
      
      const statsSnapshot = await getDocs(statsQuery);
      
      // Process interactions
      const interactedSampleIds = [];
      statsSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.sampleId && !interactedSampleIds.includes(data.sampleId)) {
          interactedSampleIds.push(data.sampleId);
        }
      });
      
      // Fetch the samples from the interactions
      if (interactedSampleIds.length > 0) {
        for (let i = 0; i < interactedSampleIds.length; i += 10) {
          // Process in batches of 10 due to Firestore limits
          const batch = interactedSampleIds.slice(i, i + 10);
          if (batch.length === 0) continue;
          
          const batchQuery = query(
            collection(firestore, 'posts'),
            where('__name__', 'in', batch)
          );
          
          const batchSnapshot = await getDocs(batchQuery);
          
          batchSnapshot.forEach(doc => {
            const sample = doc.data();
            if (sample.tags && Array.isArray(sample.tags)) {
              sample.tags.forEach(tag => {
                const weight = 1 + (Math.random() * 0.5); // Slight randomness
                tagCounts[tag] = (tagCounts[tag] || 0) + weight;
                totalInteractions += weight;
              });
            }
          });
        }
      }
      
      // Convert counts to preferences (normalized to 0-1 range)
      const preferences = {};
      Object.keys(tagCounts).forEach(tag => {
        // Add randomness factor
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 range
        preferences[tag] = totalInteractions > 0 ? 
          (tagCounts[tag] / totalInteractions) * randomFactor : 
          Math.random() * 0.2; // Small random preference for tags with no interaction
      });
      
      return {
        preferences,
        likedSampleIds: userLikes || []
      };
    } catch (error) {
      console.error('Error calculating tag preferences:', error);
      return { preferences: {}, likedSampleIds: [] };
    }
  }, [refreshCounter]);

  // Fetch personalized recommendations for logged-in user
  const fetchPersonalizedSamples = useCallback(async () => {
    setLoading(true);
    try {
      // Calculate user's tag preferences
      const { preferences, likedSampleIds } = await calculateTagPreferences(user.uid);
      setUserTagPreferences(preferences);
      
      // Exclude samples user has already liked
      const excludeIds = [...new Set(likedSampleIds || [])];
      
      // If we don't have enough preference data, fetch trending samples instead
      if (Object.keys(preferences).length < 2) {
        await fetchRandomSamples();
        return;
      }
      
      // Get top tags based on user preferences
      const sortedTags = Object.entries(preferences)
        .sort(([, valueA], [, valueB]) => valueB - valueA)
        .slice(0, 5)
        .map(([tag]) => tag);
        
      // Shuffle and pick a subset of tags
      const shuffledTags = [...sortedTags].sort(() => Math.random() - 0.5);
      
      // Sometimes include a random tag for discovery
      if (Math.random() < 0.3) {
        const allTags = Object.values(SAMPLE_TAGS).flat();
        const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
        if (!shuffledTags.includes(randomTag)) {
          shuffledTags.push(randomTag);
        }
      }
      
      const selectedTags = shuffledTags.slice(0, Math.min(3, shuffledTags.length));
      
      // Fetch samples with preferred tags
      let recommendedSamples = [];
      const seenIds = new Set();
      
      for (const tag of selectedTags) {
        if (recommendedSamples.length >= initialLimit * 2) break;
        
        // Randomly select order field for variety
        const orderFields = ['createdAt', 'popularityScores.allTime', 'popularityScores.weekly'];
        const randomOrderIdx = Math.floor(Math.random() * orderFields.length);
        const orderField = orderFields[randomOrderIdx];
        
        const tagQuery = query(
          collection(firestore, 'posts'),
          where('tags', 'array-contains', tag),
          orderBy(orderField, 'desc'),
          limit(initialLimit * 2)
        );
        
        const tagSnapshot = await getDocs(tagQuery);
        
        tagSnapshot.forEach(doc => {
          if (seenIds.has(doc.id) || excludeIds.includes(doc.id)) return;
          
          const sample = doc.data();
          let relevanceScore = 0;
          
          if (sample.tags && Array.isArray(sample.tags)) {
            sample.tags.forEach(sampleTag => {
              if (preferences[sampleTag]) {
                relevanceScore += preferences[sampleTag];
              }
            });
          }
          
          // Add randomness to relevance score
          const randomFactor = 0.8 + (Math.random() * 0.4);
          relevanceScore *= randomFactor;
          
          recommendedSamples.push({
            id: doc.id,
            ...sample,
            relevanceScore,
            recommendationReason: `Based on your interest in ${tag}`
          });
          
          seenIds.add(doc.id);
        });
      }
      
      // With some probability, randomize the order
      if (Math.random() < 0.2) {
        recommendedSamples = shuffleArray(recommendedSamples);
      } else {
        recommendedSamples = recommendedSamples
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
      }
      
      // Take top results but sometimes include some discovery samples
      if (recommendedSamples.length > initialLimit * 1.5 && Math.random() < 0.4) {
        const topCount = Math.floor(initialLimit * 0.7);
        const topSamples = recommendedSamples.slice(0, topCount);
        
        const remainingSamples = recommendedSamples.slice(topCount);
        const discoveryCount = initialLimit - topCount;
        
        const shuffledRemaining = shuffleArray(remainingSamples);
        const discoverySamples = shuffledRemaining.slice(0, discoveryCount);
        
        recommendedSamples = [...topSamples, ...discoverySamples];
      } else {
        recommendedSamples = recommendedSamples.slice(0, initialLimit);
      }
      
      // If still not enough, get trending samples
      if (recommendedSamples.length < initialLimit) {
        const randomOffset = Math.floor(Math.random() * 5);
        const orderOptions = ['createdAt', 'popularityScores.weekly', 'popularityScores.allTime'];
        const randomOrderField = orderOptions[Math.floor(Math.random() * orderOptions.length)];
        
        const trendingQuery = query(
          collection(firestore, 'posts'),
          orderBy(randomOrderField, 'desc'),
          limit(initialLimit * 2)
        );
        
        const trendingSnapshot = await getDocs(trendingQuery);
        const trendingSamples = trendingSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            recommendationReason: 'trending',
            relevanceScore: Math.random() * 0.5
          }))
          .filter(sample => !seenIds.has(sample.id) && !excludeIds.includes(sample.id))
          .sort(() => Math.random() - 0.5)
          .slice(0, initialLimit - recommendedSamples.length);
          
        recommendedSamples = [...recommendedSamples, ...trendingSamples];
      }
      
      setSamples(recommendedSamples);
      setLastVisible(null); // For personalized, we'll refetch each time
      setHasMore(true); // Always allow loading more
      
    } catch (err) {
      console.error("Error fetching personalized samples:", err);
      setError(err);
      // Fallback to random samples if personalization fails
      await fetchRandomSamples();
    } finally {
      setLoading(false);
    }
  }, [user, initialLimit, refreshCounter]);

  // Function to get initial samples with randomization (for anonymous users)
  const fetchRandomSamples = async () => {
    setLoading(true);
    try {
      // Generate a random starting point by using a random date constraint
      const randomStartDate = new Date();
      randomStartDate.setDate(randomStartDate.getDate() - Math.floor(Math.random() * 365));
      
      // Fetch a larger set for better randomization
      const fetchLimit = initialLimit * 2; 
      
      // Fetch newer than random date
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
      console.error("Error fetching random samples:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch initial samples based on user status
  const fetchInitialSamples = useCallback(async () => {
    if (user) {
      await fetchPersonalizedSamples();
    } else {
      await fetchRandomSamples();
    }
  }, [user, fetchPersonalizedSamples]);

  // Modified fetchMoreSamples to add personalisation or randomisation
  const fetchMoreSamples = async () => {
    if (!hasMore) return;
    
    setLoading(true);
    try {
      if (user) {
        // For logged-in users, fetch more personalised samples
        // This is simplified; in a real app, you might want more sophisticated pagination
        setRefreshCounter(prev => prev + 1);
        await fetchPersonalizedSamples();
      } else {
        // For anonymous users, use the original random approach
        if (!lastVisible) return;
        
        // Get samples with timestamp less than last visible
        const moreQuery = query(
          collection(firestore, 'posts'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(initialLimit * 2)
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
      }
    } catch (err) {
      console.error("Error fetching more samples:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh samples
  const refreshSamples = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
    fetchInitialSamples();
  }, [fetchInitialSamples]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchInitialSamples();
  }, [fetchInitialSamples]);

  return { 
    samples, 
    loading, 
    error, 
    fetchMoreSamples, 
    hasMore,
    refreshSamples,
    isPersonalized: !!user
  };
};

export default useExploreData;

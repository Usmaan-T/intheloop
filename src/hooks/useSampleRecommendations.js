import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, getDocs, limit, orderBy, doc, getDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '../firebase/firebase';
import { SAMPLE_TAGS } from './useSamplesData';

/**
 * Custom hook for generating personalized sample recommendations
 * based on user's tag preferences derived from their interactions
 */
const useSampleRecommendations = (limitCount = 10) => {
  const [user] = useAuthState(auth);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userTagPreferences, setUserTagPreferences] = useState({});
  const [refreshCounter, setRefreshCounter] = useState(0);
  // Track current recommendation IDs to avoid dependency on full recommendations object
  const [currentRecommendationIds, setCurrentRecommendationIds] = useState([]);
  
  // Use refs to track the internal state without causing dependency updates
  const internalState = useRef({
    hasInitiallyLoaded: false,
    lastRefreshTime: 0
  });
  
  // Calculate user's tag preferences based on their interactions
  const calculateTagPreferences = useCallback(async (userId) => {
    if (!userId) return { preferences: {}, likedSampleIds: [] };
    
    try {
      // Get user document to analyze likes
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      
      if (!userDoc.exists()) {
        return { preferences: {}, likedSampleIds: [] };
      }
      
      const userData = userDoc.data();
      const userLikes = userData.likes || [];
      
      // Fetch user's liked samples to analyze their tags
      const tagCounts = {};
      let totalInteractions = 0;
      
      // Process liked samples to get tags
      if (userLikes.length > 0) {
        // Add randomness when selecting samples to analyze
        const shuffledLikes = [...userLikes].sort(() => Math.random() - 0.5);
        const selectedLikes = shuffledLikes.slice(0, Math.min(10, shuffledLikes.length));
        
        const samplesQuery = query(
          collection(firestore, 'posts'),
          where('__name__', 'in', selectedLikes) // Firestore limits 'in' queries to 10 items
        );
        
        const samplesSnapshot = await getDocs(samplesQuery);
        
        samplesSnapshot.forEach(doc => {
          const sample = doc.data();
          if (sample.tags && Array.isArray(sample.tags)) {
            sample.tags.forEach(tag => {
              // Use fixed weights to reduce randomness that might cause re-renders
              const weight = 3;
              tagCounts[tag] = (tagCounts[tag] || 0) + weight;
              totalInteractions += weight;
            });
          }
        });
      }
      
      // Get user interactions from sampleStats collection to analyze views and downloads
      // Limit to fewer items to reduce Firebase reads
      const statsQuery = query(
        collection(firestore, 'sampleStats'),
        where('userInteractions', 'array-contains', userId),
        limit(10)
      );
      
      const statsSnapshot = await getDocs(statsQuery);
      
      // Fetch the complete sample data for each interaction to get tags
      const interactedSampleIds = statsSnapshot.docs.map(doc => doc.id);
      
      if (interactedSampleIds.length > 0) {
        for (let i = 0; i < interactedSampleIds.length; i += 10) {
          // Process in batches of 10 due to Firestore limits
          const batch = interactedSampleIds.slice(i, i + 10);
          const batchQuery = query(
            collection(firestore, 'posts'),
            where('__name__', 'in', batch)
          );
          
          const batchSnapshot = await getDocs(batchQuery);
          
          batchSnapshot.forEach(doc => {
            const sample = doc.data();
            if (sample.tags && Array.isArray(sample.tags)) {
              sample.tags.forEach(tag => {
                // Downloads (weight: 2), Views (weight: 1)
                const weight = sample.downloadedBy?.includes(userId) ? 2 : 1;
                tagCounts[tag] = (tagCounts[tag] || 0) + weight;
                totalInteractions += weight;
              });
            }
          });
        }
      }
      
      // Convert counts to preferences (normalized to 0-1 range)
      // Use a stable seed for randomness on refresh
      const seed = refreshCounter;
      const preferences = {};
      Object.keys(tagCounts).forEach(tag => {
        // Use pseudo-random factor based on tag and seed to ensure consistency
        const randomFactor = 0.9 + (((tag.charCodeAt(0) + seed) % 10) / 20); 
        preferences[tag] = totalInteractions > 0 ? 
          (tagCounts[tag] / totalInteractions) * randomFactor : 
          0.1; // Small baseline preference for tags with no interaction
      });
      
      return {
        preferences,
        likedSampleIds: userLikes
      };
    } catch (error) {
      console.error('Error calculating tag preferences:', error);
      return { preferences: {}, likedSampleIds: [] };
    }
  }, [refreshCounter]); // We need refreshCounter to recalculate when user requests it

  // Fetch recommendations based on user's tag preferences
  const fetchRecommendations = useCallback(async () => {
    // Check for debounce - don't allow refreshes more than once every 2 seconds
    const now = Date.now();
    if (now - internalState.current.lastRefreshTime < 2000 && internalState.current.hasInitiallyLoaded) {
      console.log('Debouncing recommendation refresh');
      return;
    }
    
    internalState.current.lastRefreshTime = now;
    
    if (!user) {
      setRecommendations([]);
      setCurrentRecommendationIds([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate user's tag preferences
      const { preferences, likedSampleIds } = await calculateTagPreferences(user.uid);
      setUserTagPreferences(preferences);
      
      // Create exclude IDs list
      const excludeIds = [...likedSampleIds];
      
      // If refreshing, make sure to exclude current recommendations for more variety
      // But with 25% chance, allow some current recommendations to remain for continuity
      const shouldAllowSomeRepeats = Math.random() < 0.25;
      if (!shouldAllowSomeRepeats && currentRecommendationIds.length > 0) {
        excludeIds.push(...currentRecommendationIds);
      }
      
      // If we don't have enough preference data, fetch trending samples instead
      if (Object.keys(preferences).length < 2) {
        // Use trending query with less randomness
        const trendingQuery = query(
          collection(firestore, 'posts'),
          orderBy('popularityScores.weekly', 'desc'),
          limit(limitCount * 2) // Fetch extra to allow filtering
        );
        
        const trendingSnapshot = await getDocs(trendingQuery);
        const trendingSamples = trendingSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            recommendationReason: 'trending',
            relevanceScore: 0.5 // Fixed relevance to avoid rerenders
          }))
          .filter(sample => !excludeIds.includes(sample.id))
          .slice(0, limitCount);
        
        setRecommendations(trendingSamples);
        setCurrentRecommendationIds(trendingSamples.map(sample => sample.id));
        internalState.current.hasInitiallyLoaded = true;
        setLoading(false);
        return;
      }
      
      // Get most preferred tags (top 5)
      const sortedTags = Object.entries(preferences)
        .sort(([, valueA], [, valueB]) => valueB - valueA)
        .slice(0, 5)
        .map(([tag]) => tag);
        
      // Add some randomness by shuffling and picking a subset of tags
      // This ensures more variety when refreshing
      const shuffledTags = [...sortedTags].sort(() => Math.random() - 0.5);
      const selectedTags = shuffledTags.slice(0, Math.min(3, shuffledTags.length));
      
      // Fetch samples with preferred tags
      // We'll use multiple queries since Firestore can't do OR conditions with array-contains
      let recommendedSamples = [];
      const seenIds = new Set(); // To avoid duplicates
      
      for (const tag of selectedTags) {
        if (recommendedSamples.length >= limitCount * 2) break;
        
        const tagQuery = query(
          collection(firestore, 'posts'),
          where('tags', 'array-contains', tag),
          orderBy('popularityScores.allTime', 'desc'),
          limit(limitCount)
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
          
          recommendedSamples.push({
            id: doc.id,
            ...sample,
            relevanceScore,
            recommendationReason: `Based on your interest in ${tag}`
          });
          
          seenIds.add(doc.id);
        });
      }
      
      // If we didn't get enough recommendations, add trending samples
      if (recommendedSamples.length < limitCount) {
        const trendingQuery = query(
          collection(firestore, 'posts'),
          orderBy('popularityScores.weekly', 'desc'),
          limit(limitCount * 2)
        );
        
        const trendingSnapshot = await getDocs(trendingQuery);
        const trendingSamples = trendingSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            recommendationReason: 'trending',
            relevanceScore: 0.3 // Lower score so they appear after personalized items
          }))
          .filter(sample => !seenIds.has(sample.id) && !excludeIds.includes(sample.id))
          .slice(0, limitCount - recommendedSamples.length);
          
        recommendedSamples = [...recommendedSamples, ...trendingSamples];
      }
      
      // Sort by relevance score and limit to requested count
      recommendedSamples = recommendedSamples
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limitCount);
      
      // Update the recommendations and current IDs
      setRecommendations(recommendedSamples);
      setCurrentRecommendationIds(recommendedSamples.map(sample => sample.id));
      internalState.current.hasInitiallyLoaded = true;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user, limitCount, calculateTagPreferences, currentRecommendationIds]);

  // Initial fetch when component mounts or user changes
  useEffect(() => {
    // Only fetch if user exists and recommendations are empty
    if (user && !internalState.current.hasInitiallyLoaded) {
      fetchRecommendations();
    }
  }, [user]); // Intentionally NOT including fetchRecommendations here

  // Handle refresh requests
  useEffect(() => {
    if (refreshCounter > 0) {
      fetchRecommendations();
    }
  }, [refreshCounter]); // Intentionally NOT including fetchRecommendations here to prevent infinite re-renders

  // Function to refresh recommendations
  const refreshRecommendations = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  return {
    recommendations,
    loading,
    error,
    refreshRecommendations,
    userTagPreferences
  };
};

export default useSampleRecommendations; 
import { useState, useEffect, useCallback } from 'react';
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

  // Calculate user's tag preferences based on their interactions
  const calculateTagPreferences = useCallback(async (userId) => {
    if (!userId) return {};
    
    try {
      // Get user document to analyze likes
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      
      if (!userDoc.exists()) {
        return {};
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
              // Add slight randomness to weight for variety (±0.5)
              const randomWeight = 3 + (Math.random() - 0.5);
              tagCounts[tag] = (tagCounts[tag] || 0) + randomWeight;
              totalInteractions += randomWeight;
            });
          }
        });
      }
      
      // Get user interactions from sampleStats collection to analyze views and downloads
      const statsQuery = query(
        collection(firestore, 'sampleStats'),
        where('userInteractions', 'array-contains', userId),
        limit(20)
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
      const preferences = {};
      Object.keys(tagCounts).forEach(tag => {
        // Add randomness factor that changes on each refresh
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2 range
        preferences[tag] = totalInteractions > 0 ? 
          (tagCounts[tag] / totalInteractions) * randomFactor : 
          Math.random() * 0.2; // Small random preference for tags with no interaction
      });
      
      return {
        preferences,
        likedSampleIds: userLikes
      };
    } catch (error) {
      console.error('Error calculating tag preferences:', error);
      return { preferences: {}, likedSampleIds: [] };
    }
  }, [refreshCounter]); // Add refreshCounter as dependency to recalculate on refresh

  // Fetch recommendations based on user's tag preferences
  const fetchRecommendations = useCallback(async () => {
    if (!user) {
      setRecommendations([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Calculate user's tag preferences
      const { preferences, likedSampleIds } = await calculateTagPreferences(user.uid);
      setUserTagPreferences(preferences);
      
      // Get current recommendations to exclude without creating a dependency cycle
      const currentRecommendationIds = recommendations.map(sample => sample.id);
      
      // If refreshing, make sure to exclude current recommendations for more variety
      // But with 25% chance, allow some current recommendations to remain for continuity
      const shouldAllowSomeRepeats = Math.random() < 0.25;
      
      let excludeIds = [...new Set([...likedSampleIds])];
      if (!shouldAllowSomeRepeats) {
        excludeIds = [...excludeIds, ...currentRecommendationIds];
      }
      
      // If we don't have enough preference data, fetch trending samples instead
      if (Object.keys(preferences).length < 2) {
        // Use more randomness in trending queries
        const randomOffset = Math.floor(Math.random() * 20);
        const orderOptions = ['recentPlays', 'popularityScores.weekly', 'popularityScores.allTime'];
        const randomOrderField = orderOptions[Math.floor(Math.random() * orderOptions.length)];
        
        const trendingQuery = query(
          collection(firestore, 'posts'),
          orderBy(randomOrderField, 'desc'),
          limit(limitCount + randomOffset + 10) // Fetch more than needed to allow filtering
        );
        
        const trendingSnapshot = await getDocs(trendingQuery);
        let trendingSamples = trendingSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            recommendationReason: 'trending',
            // Add random relevance score to shuffle order slightly
            relevanceScore: Math.random() * 0.3
          }))
          .filter(sample => !excludeIds.includes(sample.id))
          .sort(() => Math.random() - 0.5) // Shuffle results
          .slice(0, limitCount);
        
        setRecommendations(trendingSamples);
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
      
      // Sometimes include a completely random tag from all available tags for discovery
      if (Math.random() < 0.3) { // 30% chance to include a random tag
        const allTags = Object.values(SAMPLE_TAGS).flat();
        const randomTag = allTags[Math.floor(Math.random() * allTags.length)];
        // Only add if not already in tags
        if (!shuffledTags.includes(randomTag)) {
          shuffledTags.push(randomTag);
        }
      }
      
      const selectedTags = shuffledTags.slice(0, Math.min(3, shuffledTags.length));
      
      // Fetch samples with preferred tags
      // We'll use multiple queries since Firestore can't do OR conditions with array-contains
      let recommendedSamples = [];
      const seenIds = new Set(); // To avoid duplicates
      
      for (const tag of selectedTags) {
        if (recommendedSamples.length >= limitCount * 2) break;
        
        // Randomly select order field to introduce variety
        const orderFields = ['createdAt', 'popularityScores.allTime', 'popularityScores.weekly'];
        const randomOrderIdx = Math.floor(Math.random() * orderFields.length);
        const orderField = orderFields[randomOrderIdx];
        
        const tagQuery = query(
          collection(firestore, 'posts'),
          where('tags', 'array-contains', tag),
          orderBy(orderField, 'desc'),
          limit(limitCount * 2) // Get more to account for filtering
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
          
          // Add significant randomness to relevance score (±20%)
          const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
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
      
      // If we didn't get enough recommendations, try other tags
      if (recommendedSamples.length < limitCount) {
        // Get all eligible tags (from preferences but not already used)
        const remainingTags = Object.keys(preferences)
          .filter(tag => !selectedTags.includes(tag))
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
          
        for (const tag of remainingTags) {
          if (recommendedSamples.length >= limitCount * 2) break;
          
          const tagQuery = query(
            collection(firestore, 'posts'),
            where('tags', 'array-contains', tag),
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
            
            // Add higher randomness for discovery items (±30%)
            relevanceScore = relevanceScore * (0.7 + (Math.random() * 0.6));
            
            recommendedSamples.push({
              id: doc.id,
              ...sample,
              relevanceScore,
              recommendationReason: `Based on your interest in ${tag}`
            });
            
            seenIds.add(doc.id);
          });
        }
      }
      
      // With some probability, introduce completely random sorting
      if (Math.random() < 0.2) { // 20% chance for random ordering
        recommendedSamples = recommendedSamples.sort(() => Math.random() - 0.5);
      } else {
        // Otherwise, sort by relevance score and limit to requested count
        recommendedSamples = recommendedSamples
          .sort((a, b) => b.relevanceScore - a.relevanceScore);
      }
      
      // Take top results, but sometimes pull in a few from later in the list
      // This helps avoid local maxima and enables discovery
      if (recommendedSamples.length > limitCount * 1.5 && Math.random() < 0.4) {
        // Select 70% from top results
        const topCount = Math.floor(limitCount * 0.7);
        const topSamples = recommendedSamples.slice(0, topCount);
        
        // Select 30% from further down the list for discovery
        const remainingSamples = recommendedSamples.slice(topCount);
        const discoveryCount = limitCount - topCount;
        
        // Pick random samples from remaining list
        const shuffledRemaining = remainingSamples.sort(() => Math.random() - 0.5);
        const discoverySamples = shuffledRemaining.slice(0, discoveryCount);
        
        recommendedSamples = [...topSamples, ...discoverySamples];
      } else {
        // Just take the top results
        recommendedSamples = recommendedSamples.slice(0, limitCount);
      }
      
      // If still not enough, add some trending samples
      if (recommendedSamples.length < limitCount) {
        // Add random offset and random ordering
        const randomOffset = Math.floor(Math.random() * 5);
        const orderOptions = ['createdAt', 'popularityScores.weekly', 'popularityScores.allTime'];
        const randomOrderField = orderOptions[Math.floor(Math.random() * orderOptions.length)];
        
        const trendingQuery = query(
          collection(firestore, 'posts'),
          orderBy(randomOrderField, 'desc'),
          limit(limitCount * 2 + randomOffset)
        );
        
        const trendingSnapshot = await getDocs(trendingQuery);
        // Add significant randomness to trending samples order
        const trendingSamples = trendingSnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            recommendationReason: 'trending',
            relevanceScore: Math.random() * 0.5 // Random relevance for variety
          }))
          .filter(sample => !seenIds.has(sample.id) && !excludeIds.includes(sample.id))
          .sort(() => Math.random() - 0.5) // Shuffle
          .slice(randomOffset, randomOffset + (limitCount - recommendedSamples.length));
          
        recommendedSamples = [...recommendedSamples, ...trendingSamples]
          .slice(0, limitCount);
      }
      
      setRecommendations(recommendedSamples);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [user, limitCount, calculateTagPreferences, refreshCounter, recommendations]);

  // Initial fetch of recommendations
  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

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
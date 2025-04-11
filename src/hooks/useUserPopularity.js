import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  runTransaction 
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import COLLECTIONS from '../firebase/collections';

/**
 * Calculates and updates a user's popularity score based on all their tracks
 * @param {string} userId - The user ID to calculate popularity for
 * @returns {Promise<{success: boolean, popularityScore: number}>} Result of the calculation
 */
export const calculateUserPopularity = async (userId) => {
  if (!userId) return { success: false, error: 'No user ID provided' };
  
  try {
    // Query all samples by this user
    const samplesQuery = query(
      collection(firestore, COLLECTIONS.POSTS),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(samplesQuery);
    
    // Calculate total popularity across all time periods
    let totalPopularity = {
      daily: 0,
      weekly: 0,
      monthly: 0,
      allTime: 0
    };
    
    // Sum up popularity scores from all tracks
    snapshot.forEach((doc) => {
      const trackData = doc.data();
      const scores = trackData.popularityScores || {};
      
      // Add the popularity score for each time period
      totalPopularity.daily += scores.daily || 0;
      totalPopularity.weekly += scores.weekly || 0;
      totalPopularity.monthly += scores.monthly || 0;
      totalPopularity.allTime += scores.allTime || 0;
    });
    
    // Update the user document with the calculated popularity scores
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      popularityScores: totalPopularity,
      lastPopularityUpdate: new Date()
    });
    
    return { 
      success: true, 
      popularityScore: totalPopularity
    };
  } catch (error) {
    console.error('Error calculating user popularity:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
};

/**
 * Hook to get and update a user's popularity score
 * @param {string} userId - The user ID to get popularity for
 * @param {boolean} autoUpdate - Whether to automatically update the score
 * @returns {Object} The popularity score data and update function
 */
const useUserPopularity = (userId, autoUpdate = false) => {
  const [popularityScore, setPopularityScore] = useState({
    daily: 0,
    weekly: 0,
    monthly: 0,
    allTime: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Function to update the popularity score
  const updatePopularityScore = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const result = await calculateUserPopularity(userId);
      if (result.success) {
        setPopularityScore(result.popularityScore);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Initially fetch and optionally set up auto-update
  useEffect(() => {
    if (!userId) return;
    
    // Initial fetch
    updatePopularityScore();
    
    // Auto-update on interval if enabled
    let intervalId;
    if (autoUpdate) {
      intervalId = setInterval(updatePopularityScore, 1000 * 60 * 60); // Update hourly
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [userId, autoUpdate]);
  
  return {
    popularityScore,
    loading,
    error,
    updatePopularityScore
  };
};

export default useUserPopularity; 
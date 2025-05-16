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
    
    // Get current date info for filtering
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekNumber = getWeekNumber(now);
    const weekString = `${now.getFullYear()}-W${weekNumber}`;
    const monthString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Sum up popularity scores from all tracks with proper time filtering
    snapshot.forEach((doc) => {
      const trackData = doc.data();
      const scores = trackData.popularityScores || {};
      const stats = trackData.stats || { 
        views: 0, 
        likes: 0, 
        downloads: 0, 
        dailyStats: {}, 
        weeklyStats: {}, 
        monthlyStats: {} 
      };
      
      // Always add all-time score
      totalPopularity.allTime += scores.allTime || 0;
      
      // Only count today's stats for daily score
      const dailyStats = stats.dailyStats?.[today] || { views: 0, likes: 0, downloads: 0 };
      totalPopularity.daily += calculateScore(dailyStats);
      
      // Only count current week's stats for weekly score
      let weeklyScore = 0;
      Object.keys(stats.weeklyStats || {}).forEach(key => {
        if (key === weekString) {
          weeklyScore += calculateScore(stats.weeklyStats[key]);
        }
      });
      totalPopularity.weekly += weeklyScore;
      
      // Only count current month's stats for monthly score
      let monthlyScore = 0;
      Object.keys(stats.monthlyStats || {}).forEach(key => {
        if (key === monthString) {
          monthlyScore += calculateScore(stats.monthlyStats[key]);
        }
      });
      totalPopularity.monthly += monthlyScore;
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
 * Helper function to calculate a score from stats
 */
const calculateScore = (stats) => {
  const likes = stats.likes || 0;
  const downloads = stats.downloads || 0;
  const views = stats.views || 0;
  
  return (likes * 5) + (downloads * 3) + views;
};

/**
 * Helper function to get ISO week number
 */
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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
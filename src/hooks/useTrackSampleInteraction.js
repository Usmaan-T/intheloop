import { 
  doc, 
  runTransaction, 
  serverTimestamp, 
  increment
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';
import COLLECTIONS from '../firebase/collections';

/**
 * Tracks an interaction with a sample (view, like, download)
 * Updates both real-time counters and time-based popularity stats
 */
export const trackSampleInteraction = async (sampleId, interactionType, userId = null, isRemoval = false) => {
  if (!sampleId) return;
  
  try {
    const incrementValue = isRemoval ? -1 : 1;
    
    // Get current date information for time-based stats
    const now = new Date();
    const dateString = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const weekNumber = getWeekNumber(now);
    const weekString = `${now.getFullYear()}-W${weekNumber}`;
    const monthString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    
    await runTransaction(firestore, async (transaction) => {
      // Reference to the sample document
      const sampleRef = doc(firestore, COLLECTIONS.POSTS, sampleId);
      
      // Initialize stats object structure if it doesn't exist
      const sampleSnap = await transaction.get(sampleRef);
      if (!sampleSnap.exists()) {
        throw new Error("Sample not found");
      }
      
      const sampleData = sampleSnap.data();
      if (!sampleData.stats) {
        transaction.update(sampleRef, {
          stats: {
            views: 0,
            likes: 0,
            downloads: 0,
            dailyStats: {},
            weeklyStats: {},
            monthlyStats: {}
          }
        });
      }
      
      // Update total count
      transaction.update(sampleRef, {
        [`stats.${interactionType}s`]: increment(incrementValue)
      });
      
      // Update time-based stats
      transaction.update(sampleRef, {
        [`stats.dailyStats.${dateString}.${interactionType}s`]: increment(incrementValue),
        [`stats.weeklyStats.${weekString}.${interactionType}s`]: increment(incrementValue),
        [`stats.monthlyStats.${monthString}.${interactionType}s`]: increment(incrementValue),
      });
      
      // If this is a user-specific interaction (like or download by a logged-in user)
      if (userId) {
        // Track in user document for likes
        if (interactionType === 'like') {
          // This part is already handled by useLikeSample hook
          // Just leaving this comment here for completeness
        }
        
        // Log the interaction in sample stats collection
        const statId = `${sampleId}_${interactionType}_${userId}`;
        const statRef = doc(firestore, COLLECTIONS.SAMPLE_STATS, statId);
        
        transaction.set(statRef, {
          sampleId,
          userId,
          type: interactionType,
          isRemoval,
          timestamp: serverTimestamp()
        }, { merge: true });
      }
    });
    
    // Update popularity scores after interaction
    await updatePopularityScores(sampleId);
    
  } catch (error) {
    console.error(`Error tracking ${interactionType}:`, error);
    throw error;
  }
};

/**
 * Updates popularity scores for a sample based on its stats
 */
const updatePopularityScores = async (sampleId) => {
  try {
    const sampleRef = doc(firestore, COLLECTIONS.POSTS, sampleId);
    
    await runTransaction(firestore, async (transaction) => {
      const sampleDoc = await transaction.get(sampleRef);
      
      if (!sampleDoc.exists()) {
        throw new Error('Sample not found');
      }
      
      const data = sampleDoc.data();
      const stats = data.stats || {
        views: 0,
        likes: 0,
        downloads: 0,
        dailyStats: {},
        weeklyStats: {},
        monthlyStats: {}
      };
      
      // Get current date info
      const now = new Date();
      const dateString = now.toISOString().split('T')[0];
      const weekNumber = getWeekNumber(now);
      const weekString = `${now.getFullYear()}-W${weekNumber}`;
      const monthString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Calculate scores for different time periods
      const dailyStats = stats.dailyStats?.[dateString] || { views: 0, likes: 0, downloads: 0 };
      const weeklyStats = stats.weeklyStats?.[weekString] || { views: 0, likes: 0, downloads: 0 };
      const monthlyStats = stats.monthlyStats?.[monthString] || { views: 0, likes: 0, downloads: 0 };
      
      transaction.update(sampleRef, {
        popularityScores: {
          daily: calculateScore(dailyStats),
          weekly: calculateScore(weeklyStats),
          monthly: calculateScore(monthlyStats),
          allTime: calculateScore(stats),
          lastCalculated: serverTimestamp()
        }
      });
    });
  } catch (error) {
    console.error('Error updating popularity scores:', error);
  }
};

/**
 * Helper function to calculate popularity score from stats
 * Weights: likes (5), downloads (3), views (1)
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

export default trackSampleInteraction;

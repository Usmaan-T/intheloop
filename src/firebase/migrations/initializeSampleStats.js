import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  writeBatch 
} from 'firebase/firestore';
import { firestore } from '../firebase';
import COLLECTIONS from '../collections';

/**
 * Run this function once to initialize stats for existing samples
 * Call this from an admin page or directly in the console
 */
export const initializeSampleStats = async () => {
  try {
    console.log('Starting sample stats initialization...');
    const samplesRef = collection(firestore, COLLECTIONS.POSTS);
    const snapshot = await getDocs(samplesRef);
    
    // Use batched writes for better performance
    const batchSize = 500; // Firestore batch limit is 500
    let batch = writeBatch(firestore);
    let operationCount = 0;
    let totalSamples = 0;
    
    for (const sampleDoc of snapshot.docs) {
      const sampleRef = doc(firestore, COLLECTIONS.POSTS, sampleDoc.id);
      const data = sampleDoc.data();
      
      // Initialize stats structure if it doesn't exist
      if (!data.stats) {
        // Keep any existing counts
        const likes = data.likes || 0;
        
        // Set up the stats structure
        batch.update(sampleRef, {
          stats: {
            views: 0,
            downloads: 0,
            likes: likes,
            dailyStats: {},
            weeklyStats: {},
            monthlyStats: {}
          },
          popularityScores: {
            daily: 0,
            weekly: 0,
            monthly: 0,
            allTime: likes * 5 // initial all-time score based on likes
          }
        });
        
        operationCount++;
        totalSamples++;
      }
      
      // Commit batch if we're at the limit
      if (operationCount >= batchSize) {
        await batch.commit();
        console.log(`Processed ${operationCount} samples`);
        batch = writeBatch(firestore);
        operationCount = 0;
      }
    }
    
    // Commit any remaining operations
    if (operationCount > 0) {
      await batch.commit();
    }
    
    console.log(`Initialization complete! Updated ${totalSamples} samples.`);
    return {
      success: true,
      totalSamples
    };
  } catch (error) {
    console.error('Error initializing sample stats:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default initializeSampleStats;

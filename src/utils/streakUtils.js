import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Utility to reset streakUpdatedToday flag for all users
 * This would typically be run via a scheduled cloud function
 * @returns {Promise<void>}
 */
export async function resetDailyStreakFlags() {
  const usersCollection = collection(firestore, 'users');
  const q = query(usersCollection, where('streakUpdatedToday', '==', true));
  
  try {
    const querySnapshot = await getDocs(q);
    
    // Create a batch of update operations
    const updatePromises = [];
    
    querySnapshot.forEach((userDoc) => {
      const userRef = doc(firestore, 'users', userDoc.id);
      updatePromises.push(updateDoc(userRef, { streakUpdatedToday: false }));
    });
    
    // Execute all updates in parallel
    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`Reset streak flags for ${updatePromises.length} users`);
    }
  } catch (error) {
    console.error('Error resetting streak flags:', error);
  }
}

/**
 * Calculate if the user's streak is at risk (last upload was yesterday)
 * @param {Date|null} lastUploadDate - The user's last upload date
 * @returns {boolean} Whether the streak is at risk
 */
export function isStreakAtRisk(lastUploadDate) {
  if (!lastUploadDate) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastUploadDay = new Date(lastUploadDate);
  lastUploadDay.setHours(0, 0, 0, 0);
  
  // Streak is at risk if last upload was yesterday (need to upload today)
  return lastUploadDay.getTime() === yesterday.getTime();
}

/**
 * Get a motivational message based on streak length
 * @param {number} currentStreak - The user's current streak
 * @returns {string} A motivational message
 */
export function getStreakMessage(currentStreak) {
  if (currentStreak === 0) {
    return "Upload your first sample to start your streak!";
  } else if (currentStreak === 1) {
    return "Great start! Upload again tomorrow to keep your streak going.";
  } else if (currentStreak < 5) {
    return `You're on a ${currentStreak}-day streak! Keep it up!`;
  } else if (currentStreak < 10) {
    return `Impressive ${currentStreak}-day streak! You're building a habit!`;
  } else if (currentStreak < 30) {
    return `Amazing ${currentStreak}-day streak! Your consistency is paying off!`;
  } else {
    return `Incredible ${currentStreak}-day streak! You're a true champion!`;
  }
} 
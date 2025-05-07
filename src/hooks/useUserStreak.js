import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Hook for managing user streaks
 * @param {string} userId - The user ID
 * @returns {Object} Streak information and functions
 */
const useUserStreak = (userId) => {
  const [streakData, setStreakData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    lastUploadDate: null,
    streakUpdatedToday: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch streak data
  useEffect(() => {
    const fetchStreakData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userDocRef = doc(firestore, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setStreakData({
            currentStreak: userData.currentStreak || 0,
            longestStreak: userData.longestStreak || 0,
            lastUploadDate: userData.lastUploadDate ? userData.lastUploadDate.toDate() : null,
            streakUpdatedToday: userData.streakUpdatedToday || false
          });
        }
      } catch (err) {
        console.error('Error fetching streak data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStreakData();
  }, [userId]);

  /**
   * Updates user streak after an upload
   * @returns {Promise<boolean>} Success status
   */
  const updateStreakOnUpload = async () => {
    if (!userId) return false;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to start of day
      
      const userDocRef = doc(firestore, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) return false;
      
      const userData = userDoc.data();
      let { currentStreak = 0, longestStreak = 0, lastUploadDate, streakUpdatedToday = false } = userData;
      
      // Convert Firestore timestamp to Date if it exists
      const lastUpload = lastUploadDate ? lastUploadDate.toDate() : null;
      
      // Normalize last upload to start of day
      if (lastUpload) {
        lastUpload.setHours(0, 0, 0, 0);
      }
      
      // Calculate days difference
      const dayDiff = lastUpload 
        ? Math.floor((today - lastUpload) / (1000 * 60 * 60 * 24)) 
        : null;
        
      const updates = {};
      
      // First upload ever
      if (!lastUpload) {
        updates.currentStreak = 1;
        updates.longestStreak = 1;
        updates.streakUpdatedToday = true;
      } 
      // Already uploaded today
      else if (dayDiff === 0 && streakUpdatedToday) {
        // Don't increment streak if already updated today
        return true;
      }
      // Upload on consecutive day (streak continues)
      else if (dayDiff === 1) {
        updates.currentStreak = currentStreak + 1;
        updates.longestStreak = Math.max(longestStreak, currentStreak + 1);
        updates.streakUpdatedToday = true;
      } 
      // Gap in uploads, reset streak
      else if (dayDiff > 1) {
        updates.currentStreak = 1; // Reset to 1 for today's upload
        updates.streakUpdatedToday = true;
      }
      // Same day but first upload today
      else if (dayDiff === 0 && !streakUpdatedToday) {
        updates.streakUpdatedToday = true;
      }
      
      // Always update last upload date
      updates.lastUploadDate = today;
      
      // Apply updates to Firestore
      await updateDoc(userDocRef, updates);
      
      // Update local state
      setStreakData({
        currentStreak: updates.currentStreak !== undefined ? updates.currentStreak : currentStreak,
        longestStreak: updates.longestStreak !== undefined ? updates.longestStreak : longestStreak,
        lastUploadDate: today,
        streakUpdatedToday: true
      });
      
      return true;
    } catch (err) {
      console.error('Error updating streak:', err);
      setError(err.message);
      return false;
    }
  };

  /**
   * Reset the streakUpdatedToday flag at the start of a new day
   * This should be called when app initializes
   */
  const resetDailyStreak = async () => {
    if (!userId || !streakData.streakUpdatedToday) return;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const lastUpload = streakData.lastUploadDate;
      if (!lastUpload) return;
      
      // Set hours to beginning of day for comparison
      const lastUploadDay = new Date(lastUpload);
      lastUploadDay.setHours(0, 0, 0, 0);
      
      // If last upload was before today, reset the daily flag
      if (lastUploadDay < today) {
        const userDocRef = doc(firestore, 'users', userId);
        await updateDoc(userDocRef, {
          streakUpdatedToday: false
        });
        
        setStreakData(prev => ({
          ...prev,
          streakUpdatedToday: false
        }));
      }
    } catch (err) {
      console.error('Error resetting daily streak flag:', err);
    }
  };

  return { 
    streakData, 
    loading, 
    error, 
    updateStreakOnUpload,
    resetDailyStreak
  };
};

export default useUserStreak; 
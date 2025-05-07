import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import trackSampleInteraction from './useTrackSampleInteraction';

/**
 * Hook to track when a sample is viewed
 * Uses localStorage to avoid counting multiple views from the same user
 */
const useTrackSampleView = (sampleId) => {
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [user] = useAuthState(auth);
  
  useEffect(() => {
    const trackView = async () => {
      if (!sampleId) return;
      
      // Create a unique key that includes the user ID if available
      const userId = user?.uid || 'anonymous';
      const storageKey = `view_${sampleId}_${userId}`;
      
      // Check if this view was already tracked for this user
      const viewTracked = localStorage.getItem(storageKey);
      
      if (viewTracked) {
        setHasTrackedView(true);
        return;
      }
      
      try {
        // Track the view
        await trackSampleInteraction(
          sampleId,
          'view',
          user?.uid || null,
          false
        );
        
        // Mark this view as tracked for this user permanently
        localStorage.setItem(storageKey, 'true');
        setHasTrackedView(true);
      } catch (error) {
        console.error('Error tracking sample view:', error);
      }
    };
    
    trackView();
    
    // Cleanup function not needed, view is tracked only once
  }, [sampleId, user]);
  
  return { hasTrackedView };
};

export default useTrackSampleView;

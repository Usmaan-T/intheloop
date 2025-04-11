import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import trackSampleInteraction from './useTrackSampleInteraction';

/**
 * Hook to track when a sample is viewed
 * Uses sessionStorage to avoid counting multiple views in the same session
 */
const useTrackSampleView = (sampleId) => {
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [user] = useAuthState(auth);
  
  useEffect(() => {
    const trackView = async () => {
      if (!sampleId) return;
      
      // Check if this view was already tracked in this session
      const sessionKey = `view_${sampleId}`;
      const viewTracked = sessionStorage.getItem(sessionKey);
      
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
        
        // Mark this view as tracked in this session
        sessionStorage.setItem(sessionKey, 'true');
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

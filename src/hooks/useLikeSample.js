import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '../firebase/firebase';
import { 
  doc, 
  updateDoc, 
  increment, 
  getDoc,
  arrayUnion,
  arrayRemove,
  runTransaction
} from 'firebase/firestore';
import { useToast } from '@chakra-ui/react';

/**
 * Custom hook for liking/unliking samples with proper two-way tracking
 * @param {string} sampleId - The ID of the sample 
 * @returns {Object} - Methods and state for sample liking functionality
 */
const useLikeSample = (sampleId) => {
  const [user] = useAuthState(auth);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Check if the user has liked this sample and get current like count
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user || !sampleId) return;
      
      try {
        // Get user data to check likes array
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userLikes = userData.likes || [];
          setIsLiked(userLikes.includes(sampleId));
        }
        
        // Get sample data to display like count
        const sampleDoc = await getDoc(doc(firestore, 'posts', sampleId));
        if (sampleDoc.exists()) {
          const sampleData = sampleDoc.data();
          setLikeCount(sampleData.likes || 0);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [user, sampleId]);

  // Toggle like status
  const toggleLike = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like samples",
        status: "warning",
        duration: 3000,
        isClosable: true
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use transaction to ensure atomicity
      await runTransaction(firestore, async (transaction) => {
        // Get the sample document
        const sampleRef = doc(firestore, 'posts', sampleId);
        const sampleSnap = await transaction.get(sampleRef);
        
        if (!sampleSnap.exists()) {
          throw "Sample does not exist";
        }
        
        // Get the user document
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await transaction.get(userRef);
        
        if (!userSnap.exists()) {
          throw "User document does not exist";
        }
        
        const userData = userSnap.data();
        const userLikes = userData.likes || [];
        
        // Update like status and count
        if (userLikes.includes(sampleId)) {
          // User already liked this sample - unlike it
          transaction.update(sampleRef, { likes: increment(-1) });
          transaction.update(userRef, { 
            likes: arrayRemove(sampleId) 
          });
          setLikeCount(prev => prev - 1);
          setIsLiked(false);
        } else {
          // User has not liked this sample - like it
          transaction.update(sampleRef, { likes: increment(1) });
          transaction.update(userRef, { 
            likes: arrayUnion(sampleId)
          });
          setLikeCount(prev => prev + 1);
          setIsLiked(true);
        }
      });
      
    } catch (error) {
      console.error('Error updating like status:', error);
      toast({
        title: "Error",
        description: "Failed to update like status",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLiked, likeCount, toggleLike, isLoading };
};

export default useLikeSample;

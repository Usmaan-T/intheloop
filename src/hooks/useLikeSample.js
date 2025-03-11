import { useState, useEffect } from 'react';
import { doc, updateDoc, increment, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { firestore, auth } from '../firebase/firebase';

const useLikeSample = (sampleId) => {
  const [user] = useAuthState(auth);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has already liked this sample
  useEffect(() => {
    if (!user || !sampleId) return;

    const checkIfLiked = async () => {
      try {
        // Check user's likes collection
        const likeRef = doc(firestore, 'users', user.uid, 'likes', sampleId);
        const likeDoc = await getDoc(likeRef);
        
        setIsLiked(likeDoc.exists());
        
        // Get current like count from the sample
        const sampleRef = doc(firestore, 'posts', sampleId);
        const sampleDoc = await getDoc(sampleRef);
        
        if (sampleDoc.exists()) {
          setLikeCount(sampleDoc.data().likes || 0);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkIfLiked();
  }, [user, sampleId]);

  // Toggle like status
  const toggleLike = async () => {
    if (!user || !sampleId) {
      console.log('User must be logged in to like samples');
      return;
    }

    setIsLoading(true);
    try {
      const sampleRef = doc(firestore, 'posts', sampleId);
      const userLikeRef = doc(firestore, 'users', user.uid, 'likes', sampleId);

      if (isLiked) {
        // Unlike: decrement like counter and remove from user's likes
        await updateDoc(sampleRef, {
          likes: increment(-1)
        });
        await deleteDoc(userLikeRef);
        setLikeCount(prev => Math.max(0, prev - 1));
        setIsLiked(false);
      } else {
        // Like: increment like counter and add to user's likes
        await updateDoc(sampleRef, {
          likes: increment(1)
        });
        await setDoc(userLikeRef, {
          sampleId,
          likedAt: new Date()
        });
        setLikeCount(prev => prev + 1);
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return { isLiked, likeCount, toggleLike, isLoading };
};

export default useLikeSample;

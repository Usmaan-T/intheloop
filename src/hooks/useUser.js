import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@chakra-ui/react';

/**
 * Combined hook for user data fetching and profile management
 * 
 * @param {string|object} userIdOrObject - Either a user ID string or a user object from Firebase Auth
 * @param {object} options - Optional configuration
 * @param {boolean} options.enableUpdates - Whether to include update functionality (default: false)
 * @param {boolean} options.enableToasts - Whether to show toast notifications (default: false)
 * @returns {object} User data, loading states, and update function if enabled
 */
const useUser = (userIdOrObject, options = {}) => {
  const { enableUpdates = false, enableToasts = false } = options;
  
  // Determine if we have a user object or just an ID
  const isUserObject = userIdOrObject && typeof userIdOrObject === 'object';
  const userId = isUserObject ? userIdOrObject.uid : userIdOrObject;
  const authUser = isUserObject ? userIdOrObject : null;
  
  // State
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  
  // Only create toast if needed
  const toast = enableToasts ? useToast() : null;

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        
        if (!userDoc.exists()) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        // Create a merged user object with both Firestore data and Auth data if available
        const firestoreData = userDoc.data();
        
        if (authUser) {
          // When we have auth user, merge with Firestore data
          setUserData({
            id: userId,
            ...firestoreData,
            displayName: authUser.displayName || firestoreData.username,
            email: authUser.email,
            // Use Firestore photo if available, otherwise fall back to Auth
            photoURL: firestoreData.photoURL || firestoreData.profilePicURL || authUser.photoURL
          });
        } else {
          // Just use Firestore data
          setUserData({
            id: userDoc.id,
            ...firestoreData
          });
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, authUser]);

  // Update profile data function - only defined if enableUpdates is true
  const updateUserData = enableUpdates ? async (updates, imageFile) => {
    if (!userId) return false;
    
    setUpdating(true);
    try {
      // Handle profile image upload
      if (imageFile) {
        const storageRef = ref(storage, `profileImages/${userId}`);
        await uploadBytes(storageRef, imageFile);
        const photoURL = await getDownloadURL(storageRef);
        
        // Update photoURL fields
        updates.photoURL = photoURL;
        updates.profilePicURL = photoURL;
        
        // Update Firebase Auth profile if available
        if (authUser) {
          await updateProfile(authUser, { 
            displayName: updates.username || authUser.displayName,
            photoURL: photoURL
          });
        }
      } else if (updates.username && authUser && updates.username !== authUser.displayName) {
        // Update display name in Firebase Auth if only that changed
        await updateProfile(authUser, { displayName: updates.username });
      }
      
      // Update user document if there are changes
      const userDocRef = doc(firestore, 'users', userId);
      await updateDoc(userDocRef, updates);
      
      // Update local state
      setUserData(prev => ({
        ...prev,
        ...updates
      }));
      
      if (enableToasts && toast) {
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      setUpdating(false);
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (enableToasts && toast) {
        toast({
          title: 'Error updating profile',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
      
      setError(error.message);
      setUpdating(false);
      return false;
    }
  } : null;

  return { 
    userData, 
    loading, 
    error, 
    updating, 
    updateUserData 
  };
};

export default useUser; 
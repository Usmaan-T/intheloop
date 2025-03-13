import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../firebase/firebase';
import { updateProfile } from 'firebase/auth';
import { useToast } from '@chakra-ui/react';

export default function useProfileData(user) {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  // Fetch profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          setProfileData(userDoc.data());
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching profile data:", error);
        setIsLoading(false);
      }
    };
    
    fetchProfileData();
  }, [user]);

  // Update profile data
  const updateProfileData = async (updates, imageFile) => {
    if (!user) return false;
    
    setIsUpdating(true);
    try {
      // Handle profile image upload
      if (imageFile) {
        const storageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(storageRef, imageFile);
        const photoURL = await getDownloadURL(storageRef);
        
        // Update photoURL fields
        updates.photoURL = photoURL;
        updates.profilePicURL = photoURL;
        
        // Update Firebase Auth profile
        await updateProfile(user, { 
          displayName: updates.username || user.displayName,
          photoURL: photoURL
        });
      } else if (updates.username && updates.username !== user.displayName) {
        // Update display name in Firebase Auth if only that changed
        await updateProfile(user, { displayName: updates.username });
      }
      
      // Update user document if there are changes
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, updates);
      
      // Update local state
      setProfileData(prev => ({
        ...prev,
        ...updates
      }));
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      setIsUpdating(false);
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error updating profile',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      setIsUpdating(false);
      return false;
    }
  };

  return { profileData, isLoading, isUpdating, updateProfileData };
}

import React, { useState, useEffect } from 'react';
import { Button } from '@chakra-ui/react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import useFollowUser from '../../hooks/useFollowUser';

const FollowButton = ({ userId, currentUser, size = "md" }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const { followUser, loading } = useFollowUser();
  
  // Check if current user is following target user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser || !userId || currentUser.uid === userId) return;
      
      try {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const following = userData.following || [];
          setIsFollowing(following.includes(userId));
        }
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    };
    
    checkFollowStatus();
  }, [currentUser, userId]);
  
  // Handle follow/unfollow action
  const handleFollowClick = async () => {
    if (isFollowing) return; // Prevent duplicate follow
    
    await followUser(userId);
    setIsFollowing(true);
  };

  // Don't render if no current user or if viewing own profile
  if (!currentUser || currentUser.uid === userId) {
    return null;
  }
  
  return (
    <Button 
      colorScheme="red" 
      size={size}
      onClick={handleFollowClick}
      isLoading={loading}
      loadingText="Following..."
      isDisabled={isFollowing}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
};

export default FollowButton;

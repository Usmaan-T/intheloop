import React, { useState, useEffect } from 'react';
import { Button } from '@chakra-ui/react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import useFollowUser from '../../hooks/useFollowUser';

// Add onFollowChange callback prop to notify parent components of follow state changes
const FollowButton = ({ 
  userId, 
  currentUser, 
  size = "md", 
  onFollowChange = null // Add this new callback prop
}) => {
  const [isUserFollowing, setIsUserFollowing] = useState(false);
  const { followUser, unfollowUser, loading } = useFollowUser();
  
  // Check if current user is following target user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!currentUser || !userId || currentUser.uid === userId) return;
      
      try {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const following = userData.following || [];
          setIsUserFollowing(following.includes(userId));
        }
      } catch (err) {
        console.error('Error checking follow status:', err);
      }
    };
    
    checkFollowStatus();
  }, [currentUser, userId]);
  
  // Handle follow/unfollow action
  const handleFollowClick = async () => {
    if (isUserFollowing) {
      const success = await unfollowUser(userId);
      if (success) {
        setIsUserFollowing(false);
        // Notify parent component that follower count decreased
        if (onFollowChange) onFollowChange(-1);
      }
    } else {
      const success = await followUser(userId);
      if (success) {
        setIsUserFollowing(true);
        // Notify parent component that follower count increased
        if (onFollowChange) onFollowChange(1);
      }
    }
  };

  // Don't render if no current user or if viewing own profile
  if (!currentUser || currentUser.uid === userId) {
    return null;
  }
  
  return (
    <Button 
      colorScheme="red" 
      variant={isUserFollowing ? "outline" : "solid"}
      size={size}
      onClick={handleFollowClick}
      isLoading={loading}
      loadingText={isUserFollowing ? "Unfollowing..." : "Following..."}
      // Add custom styling for better contrast when in "unfollow" state
      borderColor={isUserFollowing ? "red.500" : undefined}
      borderWidth={isUserFollowing ? "1px" : undefined}
      color={isUserFollowing ? "red.400" : undefined}
      _hover={{
        bg: isUserFollowing ? "rgba(229, 62, 62, 0.15)" : undefined,
        borderColor: isUserFollowing ? "red.400" : undefined,
        color: isUserFollowing ? "red.300" : undefined
      }}
    >
      {isUserFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
};

export default FollowButton;

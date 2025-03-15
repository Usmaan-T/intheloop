import React from 'react';
import { Text } from '@chakra-ui/react';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore } from '../../../firebase/firebase';

const ArtistInfo = ({ userId }) => {
  const userDocRef = doc(firestore, 'users', userId);
  const [userDoc, userLoading, userError] = useDocument(userDocRef);
  const userData = userDoc?.data();

  let artistName = 'Unknown Artist';
  if (userLoading) artistName = 'Loading...';
  else if (userError) artistName = 'Error loading user';
  else if (userData?.username) artistName = userData.username;
  
  return (
    <Text fontSize="sm" color="gray.400" noOfLines={1}>
      by {artistName}
    </Text>
  );
};

export default ArtistInfo;

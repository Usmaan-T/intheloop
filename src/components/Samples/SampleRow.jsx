// SampleRow.jsx
import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore } from '../../firebase/firebase';
import Waveform from '../Waveform/Waveform'; // Correct import
import WaveformWithControls from '../Waveform/WaveformWithControls';

const SampleRow = ({ track }) => {
  const borderColor = useColorModeValue('gray.300', 'gray.600');
  const textColorSecondary = useColorModeValue('gray.500', 'gray.400');

  // Fetch user details from 'users' collection
  const userDocRef = doc(firestore, 'users', track.userId);
  const [userDoc, userLoading, userError] = useDocument(userDocRef);
  const userData = userDoc?.data();

  let artistName = 'Unknown Artist';
  if (userLoading) artistName = 'Loading...';
  else if (userError) artistName = 'Error loading user';
  else if (userData?.username) artistName = userData.username;

  console.log("Audio URL:", track.audioUrl); // Debug log

  return (
    <Box
      borderBottom="1px"
      borderColor={borderColor}
      py={4}
      _last={{ borderBottom: 'none' }}
    >
      <Flex
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={4}
      >
        {/* Artwork / Placeholder */}
        <Box
          w="60px"
          h="60px"
          borderRadius="md"
          bg={useColorModeValue('gray.200', 'gray.600')}
          flex="0 0 auto"
        >
          {/* Artwork if available */}
        </Box>

        {/* Track Title & Artist Name */}
        <Box flex="1">
          <Text fontWeight="bold" fontSize="md">
            {track.name}
          </Text>
          <Text fontSize="sm" color={textColorSecondary}>
            {artistName}
          </Text>
        </Box>

        {/* Waveform Display */}
        <Box flex="2" minW="200px">
          <Waveform audioUrl={track.audioUrl} />
        </Box>

        {/* BPM & Key on the right */}
        <Box textAlign="right" flex="0 0 auto" minW="80px">
          <Text fontWeight="medium">{track.bpm} bpm</Text>
          <Text fontSize="sm" color={textColorSecondary}>
            {track.key}
          </Text>
        </Box>

        {/* Example "Add" Button */}
        <Button
          variant="outline"
          colorScheme="red"
          size="sm"
          flex="0 0 auto"
        >
          +
        </Button>
      </Flex>
    </Box>
  );
};

export default SampleRow;

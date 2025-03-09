// ProfilePage.jsx
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import SampleRow from '../../components/Samples/SampleRow';
import NavBar from '../../components/Navbar/NavBar';

const ProfilePage = () => {
  const [user] = useAuthState(auth);

  if (!user) {
    return (
      <Container maxW="container.md" py={10}>
        <Heading as="h2" size="xl" mb={6}>
          My Tracks
        </Heading>
        <Text>Please log in to view your tracks.</Text>
      </Container>
    );
  }

  // Query tracks (posts) where userId equals the current user's UID, ordering by creation time.
  const tracksQuery = query(
    collection(firestore, 'posts'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  const [tracksSnapshot, loading, error] = useCollection(tracksQuery);

  if (loading) return <Text>Loading tracks...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  const tracks = tracksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  return (
    <>
    <NavBar />
    <Box bgColor={'blackAlpha.900'} minH="100vh" py={10}>
    <Container maxW="container.xl"  py={10}>
      <Heading as="h2" size="xl" mb={6} color={'white'}>
        My Tracks
      </Heading>
      {tracks.length === 0 ? (
        <Text>You haven't uploaded any tracks yet.</Text>
      ) : (
        <Box
          bg={useColorModeValue('gray.100', 'gray.700')}
          p={4}
          borderRadius="lg"
          boxShadow="md"
        >
          {tracks.map(track => (
            <SampleRow key={track.id} track={track} />
          ))}
        </Box>
      )}
    </Container>
    </Box>
    </>
  );
};

export default ProfilePage;

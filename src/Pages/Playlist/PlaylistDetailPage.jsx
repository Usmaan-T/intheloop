import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Image,
  Badge,
  HStack,
  VStack,
  Icon,
  Button,
  Flex,
  Spinner,
  useToast,
  Divider,
  Avatar,
} from '@chakra-ui/react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import NavBar from '../../components/Navbar/NavBar';
import { MdMusicNote, MdPlayArrow, MdPause, MdPlaylistPlay } from 'react-icons/md';
import { FaPlay, FaClock } from 'react-icons/fa';
import PlaylistTrackItem from '../../components/Playlist/PlaylistTrackItem';
import Footer from '../../components/footer/Footer';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';

const PlaylistDetailPage = () => {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creator, setCreator] = useState(null);
  const [user] = useAuthState(auth);
  const toast = useToast();

  // Fetch playlist data
  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const playlistRef = doc(firestore, 'playlists', id);
        const playlistSnapshot = await getDoc(playlistRef);
        
        if (!playlistSnapshot.exists()) {
          setError('Playlist not found');
          return;
        }

        if (playlistSnapshot.data().privacy === 'private' && user.uid !== playlistSnapshot.data().userId) {
          setError('Playlist is private');
          return;

        }
        
        const playlistData = {
          id: playlistSnapshot.id,
          ...playlistSnapshot.data()
        };
        
        setPlaylist(playlistData);
        
        // Fetch creator data if userId exists
        if (playlistData.userId) {
          const creatorRef = doc(firestore, 'users', playlistData.userId);
          const creatorSnapshot = await getDoc(creatorRef);
          
          if (creatorSnapshot.exists()) {
            setCreator(creatorSnapshot.data());
          }
        }
      } catch (err) {
        console.error('Error fetching playlist:', err);
        setError('Failed to load playlist data');
        
        toast({
          title: 'Error',
          description: 'Failed to load playlist data',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlaylist();
  }, [id, toast]);

  // Generate background color from playlist name
  const generateColor = (name) => {
    if (!name) return '#8A2BE2';
    
    const colors = ['#8A2BE2', '#4A90E2', '#50C878', '#FF6347', '#FFD700'];
    let sum = 0;
    
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    
    return colors[sum % colors.length];
  };
  
  // Loading state
  if (loading) {
    return (
      <>
        <NavBar />
        <Flex height="calc(100vh - 80px)" justify="center" align="center">
          <VStack spacing={4}>
            <Spinner size="xl" color="purple.500" thickness="4px" />
            <Text color="white">Loading playlist...</Text>
          </VStack>
        </Flex>
      </>
    );
  }
  
  // Error state
  if (error) {
    return (
      <>
        <NavBar />
        <Container maxW="container.xl" py={10}>
          <VStack spacing={4} align="center">
            <Heading color="red.500">{error}</Heading>
            <Button as={Link} to="/" colorScheme="purple">
              Return Home
            </Button>
          </VStack>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Box minH="calc(100vh - 80px)" bg="gray.900">
        {/* Hero section with playlist details */}
        <Box 
          bgGradient={`linear(to-b, ${generateColor(playlist?.name)}33, gray.900)`} 
          pt={10} 
          pb={6}
          px={{ base: 4, md: 10 }}
        >
          <Container maxW="container.xl">
            <Flex 
              direction={{ base: 'column', md: 'row' }} 
              align={{ base: 'center', md: 'flex-start' }}
              gap={6}
            >
              {/* Playlist cover */}
              <Box 
                width={{ base: '200px', md: '250px' }}
                height={{ base: '200px', md: '250px' }}
                borderRadius="lg"
                boxShadow="2xl"
                overflow="hidden"
              >
                {playlist?.coverImage ? (
                  <Image 
                    src={playlist.coverImage}
                    alt={playlist?.name}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                  />
                ) : (
                  <Flex 
                    bg={generateColor(playlist?.name)}
                    width="100%"
                    height="100%"
                    align="center"
                    justify="center"
                  >
                    <Icon as={MdPlaylistPlay} fontSize="8xl" color="white" />
                  </Flex>
                )}
              </Box>
              
              {/* Playlist info */}
              <VStack 
                align={{ base: 'center', md: 'flex-start' }} 
                spacing={3}
                flex="1"
                py={{ base: 2, md: 6 }}
                textAlign={{ base: 'center', md: 'left' }}
              >
                <Badge colorScheme={playlist?.privacy === 'private' ? 'red' : 'green'}>
                  {playlist?.privacy === 'private' ? 'Private' : 'Public'}
                </Badge>
                
                <Heading as="h1" size="2xl" color="white">
                  {playlist?.name || 'Untitled Playlist'}
                </Heading>
                
                {playlist?.description && (
                  <Text color="gray.300" fontSize="md">
                    {playlist.description}
                  </Text>
                )}
                
                <HStack spacing={3} pt={1}>
                  {creator && (
                    <HStack>
                      <Avatar size="xs" src={creator?.photoURL} />
                      <Text color="gray.300" fontSize="sm">
                        {creator?.username || 'Unknown User'}
                      </Text>
                    </HStack>
                  )}
                  
                  <Text color="gray.400" fontSize="sm">
                    {playlist?.tracks?.length || 0} tracks
                  </Text>
                </HStack>
                
                <Button 
                  mt={4}
                  leftIcon={<FaPlay />}
                  colorScheme="purple"
                  size="lg"
                  isDisabled={!playlist?.tracks?.length}
                >
                  Play All
                </Button>
              </VStack>
            </Flex>
          </Container>
        </Box>
        
        {/* Playlist tracks */}
        <Container maxW="container.xl" py={8}>
          {playlist?.tracks?.length > 0 ? (
            <>
              <Heading as="h3" size="md" color="white" mb={4}>
                Tracks
              </Heading>
              
              <VStack 
                spacing={1} 
                align="stretch" 
                divider={<Divider borderColor="whiteAlpha.100" />}
                bg="gray.800"
                borderRadius="lg"
                overflow="hidden"
              >
                {playlist.tracks.map((track, index) => (
                  <PlaylistTrackItem 
                    key={`${track.id}-${index}`} 
                    track={track} 
                    index={index} 
                    playlistId={id}
                  />
                ))}
              </VStack>
            </>
          ) : (
            <VStack spacing={6} py={10} align="center">
              <Icon as={MdMusicNote} fontSize="5xl" color="gray.500" />
              <Heading as="h3" size="md" color="gray.400">
                This playlist is empty
              </Heading>
              <Text color="gray.500">
                Add tracks to get started
              </Text>
              <Button 
                as={Link}
                to="/explore"
                colorScheme="purple"
                variant="outline"
              >
                Discover Tracks
              </Button>
            </VStack>
          )}
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default PlaylistDetailPage;

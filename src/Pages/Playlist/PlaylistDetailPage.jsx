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
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import NavBar from '../../components/Navbar/NavBar';
import { MdMusicNote, MdPlayArrow, MdPause, MdPlaylistPlay, MdDelete } from 'react-icons/md';
import { FaPlay, FaClock, FaTrash } from 'react-icons/fa';
import Footer from '../../components/footer/Footer';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import SampleRow from '../../components/Samples/SampleRow';
import usePlaylistData from '../../hooks/usePlaylistData';

const PlaylistDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creator, setCreator] = useState(null);
  const [user] = useAuthState(auth);
  const toast = useToast();
  const { deletePlaylist, isDeleting } = usePlaylistData();
  
  // For delete confirmation dialog
  const { isOpen: isDeleteDialogOpen, onOpen: onOpenDeleteDialog, onClose: onCloseDeleteDialog } = useDisclosure();
  const cancelRef = React.useRef();

  // Handle deleting the entire playlist
  const handleDeletePlaylist = async () => {
    try {
      const success = await deletePlaylist(id);
      
      if (success) {
        // Navigate back to profile or homepage after deletion
        navigate('/profilepage');
      }
    } catch (error) {
      console.error("Error deleting playlist:", error);
    }
  };

  // Handle track deletion from collection
  const handleDeleteTrack = async (trackId) => {
    try {
      if (!user || !collection) return;
      
      // Only the collection owner should be able to remove tracks
      if (user.uid !== collection.userId) {
        toast({
          title: "Permission Denied",
          description: "You can only remove tracks from your own playlists",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Get fresh collection data first
      const collectionRef = doc(firestore, 'playlists', id);
      const collectionSnapshot = await getDoc(collectionRef);
      
      if (!collectionSnapshot.exists()) {
        throw new Error("Playlist not found");
      }
      
      const playlistData = collectionSnapshot.data();
      
      // Filter out the track to remove
      const updatedTracks = (playlistData.tracks || []).filter(track => track.id !== trackId);
      
      // Update the document in Firestore
      await updateDoc(collectionRef, {
        tracks: updatedTracks
      });
      
      // Update local state to reflect changes
      setCollection(prev => ({
        ...prev,
        tracks: updatedTracks
      }));
      
      toast({
        title: "Track removed",
        description: "The track has been removed from your playlist",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error removing track:", error);
      toast({
        title: "Error",
        description: "Failed to remove the track. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Fetch collection data
  useEffect(() => {
    const fetchCollection = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const collectionRef = doc(firestore, 'playlists', id);
        const collectionSnapshot = await getDoc(collectionRef);
        
        if (!collectionSnapshot.exists()) {
          setError('Collection not found');
          return;
        }

        if (collectionSnapshot.data().privacy === 'private' && user.uid !== collectionSnapshot.data().userId) {
          setError('Collection is private');
          return;

        }
        
        const collectionData = {
          id: collectionSnapshot.id,
          ...collectionSnapshot.data()
        };
        
        setCollection(collectionData);
        
        // Fetch creator data if userId exists
        if (collectionData.userId) {
          const creatorRef = doc(firestore, 'users', collectionData.userId);
          const creatorSnapshot = await getDoc(creatorRef);
          
          if (creatorSnapshot.exists()) {
            setCreator(creatorSnapshot.data());
          }
        }
      } catch (err) {
        console.error('Error fetching collection:', err);
        setError('Failed to load collection data');
        
        toast({
          title: 'Error',
          description: 'Failed to load collection data',
          status: 'error',
          duration: 3000,
          isClosable: true
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCollection();
  }, [id, toast]);

  // Generate background color from collection name
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
            <Spinner size="xl" color="red.500" thickness="4px" />
            <Text color="white">Loading collection...</Text>
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
      <Box minH="calc(100vh - 80px)" bg="blackAlpha.900">
        {/* Hero section with collection details */}
        <Box 
          bg="rgba(20, 20, 30, 0.8)"
          py={10} 
          borderBottom="1px solid"
          borderColor="whiteAlpha.200"
          px={{ base: 4, lg: 8 }}
        >
          <Container maxW="container.xl">
            <Flex 
              direction={{ base: 'column', md: 'row' }} 
              align={{ base: 'center', md: 'flex-start' }}
              gap={6}
            >
              {/* Collection cover */}
              <Box 
                width={{ base: '200px', md: '250px' }}
                height={{ base: '200px', md: '250px' }}
                borderRadius="lg"
                boxShadow="2xl"
                overflow="hidden"
              >
                {collection?.coverImage ? (
                  <Image 
                    src={collection.coverImage}
                    alt={collection?.name}
                    objectFit="cover"
                    w="100%"
                    h="100%"
                  />
                ) : (
                  <Flex 
                    bg={generateColor(collection?.name)}
                    width="100%"
                    height="100%"
                    align="center"
                    justify="center"
                  >
                    <Icon as={MdPlaylistPlay} fontSize="8xl" color="white" />
                  </Flex>
                )}
              </Box>
              
              {/* Collection info */}
              <VStack 
                align={{ base: 'center', md: 'flex-start' }} 
                spacing={3}
                flex="1"
                py={{ base: 2, md: 6 }}
                textAlign={{ base: 'center', md: 'left' }}
              >
                <Badge colorScheme={collection?.privacy === 'private' ? 'red' : 'green'}>
                  {collection?.privacy === 'private' ? 'Private' : 'Public'}
                </Badge>
                
                <Heading as="h1" size="2xl" color="white">
                  {collection?.name || 'Untitled Collection'}
                </Heading>
                
                {collection?.description && (
                  <Text color="gray.300" fontSize="md">
                    {collection.description}
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
                    {collection?.tracks?.length || 0} tracks
                  </Text>
                </HStack>
                
                {/* Action buttons */}
                <HStack spacing={4} mt={4}>
                  <Button 
                    leftIcon={<FaPlay />}
                    colorScheme="red"
                    size="lg"
                    isDisabled={!collection?.tracks?.length}
                  >
                    Play All
                  </Button>
                  
                  {/* Only show delete button if user owns this playlist */}
                  {user && collection && user.uid === collection.userId && (
                    <Tooltip label="Delete playlist">
                      <IconButton
                        icon={<FaTrash />}
                        aria-label="Delete playlist"
                        colorScheme="red"
                        variant="outline"
                        onClick={onOpenDeleteDialog}
                      />
                    </Tooltip>
                  )}
                </HStack>
              </VStack>
            </Flex>
          </Container>
        </Box>
        
        {/* Collection tracks */}
        <Container maxW="container.xl" py={8} px={{ base: 4, lg: 8 }}>
          {collection?.tracks?.length > 0 ? (
            <>
              <Heading as="h3" size="md" color="white" mb={4}>
                Tracks
              </Heading>
              
              <Box
                bg="rgba(20, 20, 30, 0.8)"
                borderRadius="lg"
                border="1px solid"
                borderColor="whiteAlpha.200"
                overflow="hidden"
                p={{ base: 4, md: 6 }}
              >
                {/* Replace PlaylistTrackItem with SampleRow */}
                {collection.tracks.map((track) => (
                  <SampleRow 
                    key={track.id || `track-${Math.random()}`} 
                    track={track}
                    onDelete={handleDeleteTrack} 
                  />
                ))}
              </Box>
            </>
          ) : (
            <VStack 
              spacing={6} 
              py={10} 
              align="center"
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="lg"
              border="1px solid"
              borderColor="whiteAlpha.200"
              p={8}
            >
              <Icon as={MdMusicNote} fontSize="5xl" color="gray.500" />
              <Heading as="h3" size="md" color="gray.400">
                This collection is empty
              </Heading>
              <Text color="gray.500">
                Add tracks to get started
              </Text>
              <Button 
                as={Link}
                to="/explore"
                colorScheme="red"
                variant="outline"
              >
                Discover Tracks
              </Button>
            </VStack>
          )}
        </Container>
      </Box>
      <Footer />
      
      {/* Delete Playlist Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent 
            bg="rgba(20, 20, 30, 0.95)"
            backdropFilter="blur(10px)"
            borderColor="whiteAlpha.200"
            color="white"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.6)"
          >
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Playlist
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{collection?.name}"? This action cannot be undone and will permanently remove this playlist and its references.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={onCloseDeleteDialog} 
                variant="outline"
                _hover={{ bg: "whiteAlpha.100" }}
                _active={{ bg: "whiteAlpha.200" }}
              >
                Cancel
              </Button>
              <Button 
                bgGradient="linear(to-r, red.500, red.600)"
                _hover={{ 
                  bgGradient: "linear(to-r, red.600, red.700)",
                  transform: "translateY(-2px)"
                }}
                onClick={handleDeletePlaylist} 
                ml={3}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default PlaylistDetailPage;

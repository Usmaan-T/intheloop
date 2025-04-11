import React, { useState, useRef } from 'react';
import {
  Box, 
  Flex, 
  Text, 
  Image, 
  Icon, 
  IconButton,
  VStack,
  HStack,
  Avatar,
  Tag,
  Wrap,
  WrapItem,
  Badge,
  useDisclosure, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  ModalCloseButton, 
  Button, 
  List, 
  ListItem,
  Spinner,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { FaHeart, FaPlay, FaPause, FaPlus, FaTrash } from 'react-icons/fa';
import { MdMusicNote } from 'react-icons/md';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore, auth } from '../../firebase/firebase';
import useLikeSample from '../../hooks/useLikeSample';
import { useAuthState } from 'react-firebase-hooks/auth';
import useUserPlaylists from '../../hooks/useUserPlaylists';
import usePlaylistData from '../../hooks/usePlaylistData';
import useDeleteSample from '../../hooks/useDeleteSample';
import { useNavigate } from 'react-router-dom';

// Generate color from name function
const generateColorFromName = (name) => {
  const colors = ['#8A2BE2', '#4A90E2', '#50C878', '#FF6347', '#FFD700'];
  if (!name) return colors[0];
  
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum += name.charCodeAt(i);
  }
  return colors[sum % colors.length];
};

const SampleCard = ({ sample, onNext }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  const { isLiked, likeCount, toggleLike } = useLikeSample(sample.id);
  const navigate = useNavigate();
  
  // Fetch user details
  const userDocRef = doc(firestore, 'users', sample.userId);
  const [userDoc] = useDocument(userDocRef);
  const userData = userDoc?.data();
  const artistName = userData?.username || 'Unknown Artist';
  
  // Add auth state to get current user
  const [user] = useAuthState(auth);
  
  // Add playlist-related hooks
  const { playlists, isLoading: playlistsLoading } = useUserPlaylists(user?.uid);
  const { addToPlaylist, isAdding } = usePlaylistData();
  
  // Add delete sample hook
  const { deleteSample, isDeleting } = useDeleteSample();
  
  // Add modal disclosure
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  // Add delete confirmation dialog
  const { 
    isOpen: isDeleteDialogOpen, 
    onOpen: onOpenDeleteDialog, 
    onClose: onCloseDeleteDialog 
  } = useDisclosure();
  const cancelRef = useRef();

  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  // Handle when audio finishes playing
  const handleAudioEnd = () => {
    setIsPlaying(false);
    if (onNext) {
      setTimeout(onNext, 1500); // Auto advance after a short delay
    }
  };

  // Handle adding to playlist
  const handleAddToPlaylist = async (playlist) => {
    try {
      // Make sure sample has required fields
      if (!sample || !sample.id || !sample.audioUrl) {
        console.error("Invalid sample data:", sample);
        return;
      }
      
      // Create a track object with essential properties
      const trackToAdd = {
        id: sample.id,
        name: sample.name || 'Untitled Track',
        audioUrl: sample.audioUrl,
        // Include optional fields only if they exist
        ...(sample.coverImage ? { coverImage: sample.coverImage } : {}),
        ...(sample.key ? { key: sample.key } : {}),
        ...(sample.bpm ? { bpm: sample.bpm } : {}),
        // Include tags with a fallback to empty array
        tags: Array.isArray(sample.tags) ? [...sample.tags] : [],
        // Metadata
        userId: sample.userId,
        addedBy: user?.uid,
        addedAt: new Date()
      };
      
      // Add the track using the hook
      const success = await addToPlaylist(trackToAdd, playlist);
      
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error in handleAddToPlaylist:", error);
    }
  };
  
  // Handle sample deletion
  const handleDeleteSample = async () => {
    if (!user || !sample) return;
    
    const success = await deleteSample(
      sample.id,
      sample.audioUrl,
      sample.coverImage,
      user.uid,
      sample.userId
    );
    
    if (success && onNext) {
      onCloseDeleteDialog();
      onNext(); // Move to the next sample after deletion
    } else if (success) {
      // If we're in a context where there's no next sample, navigate away
      onCloseDeleteDialog();
      navigate('/explore');
    }
  };
  
  // Check if current user is the owner
  const isOwner = user && sample.userId === user.uid;

  return (
    <Box 
      height="100%" 
      width="100%"
      position="relative"
      bg="gray.900"
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Background image or color */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={0}
        opacity={0.6}
        filter="blur(8px)"
        bgImage={sample.coverImage ? `url(${sample.coverImage})` : 'none'}
        bgColor={!sample.coverImage ? generateColorFromName(sample.name) : 'transparent'}
        bgSize="cover"
        bgPosition="center"
      />
      
      {/* Content overlay */}
      <Flex
        direction="column"
        height="100%"
        width="100%"
        position="relative"
        zIndex={1}
        p={{ base: 3, md: 6 }}
        justifyContent="space-between"
        bg="rgba(0, 0, 0, 0.5)"
      >
        {/* Top section - Sample details */}
        <Flex 
          justifyContent="space-between" 
          width="100%"
          mb={4}
        >
          <VStack align="flex-start" spacing={1} maxW="60%">
            <Text 
              fontSize={{ base: "xl", md: "2xl" }} 
              fontWeight="bold" 
              color="white"
              noOfLines={1}
              textShadow="0px 1px 2px rgba(0,0,0,0.8)"
            >
              {sample.name}
            </Text>
            <HStack>
              <Avatar size="sm" src={userData?.photoURL} name={artistName} />
              <Text 
                color="white" 
                noOfLines={1}
                fontSize="sm"
                textShadow="0px 1px 2px rgba(0,0,0,0.8)"
              >
                {artistName}
              </Text>
            </HStack>
          </VStack>
          
          {/* Sample metadata */}
          <VStack align="flex-end" spacing={2}>
            <Badge colorScheme="red" px={2} py={1} borderRadius="full">
              {sample.bpm} BPM
            </Badge>
            <Badge colorScheme="blue" px={2} py={1} borderRadius="full">
              {sample.key}
            </Badge>
          </VStack>
        </Flex>
        
        {/* Center section - Play button and image */}
        <Flex 
          justifyContent="center" 
          alignItems="center" 
          flex={1}
          position="relative"
          my={4}
        >
          <Box
            width={{ base: "200px", md: "240px" }}
            height={{ base: "200px", md: "240px" }}
            borderRadius="xl"
            overflow="hidden"
            border="4px solid"
            borderColor="whiteAlpha.300"
            position="relative"
            boxShadow="0 8px 32px rgba(0,0,0,0.5)"
            transition="all 0.3s ease"
            _hover={{ 
              transform: 'scale(1.02)',
              boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
              borderColor: "whiteAlpha.400"
            }}
          >
            {sample.coverImage ? (
              <Image
                src={sample.coverImage}
                alt={sample.name}
                objectFit="cover"
                width="100%"
                height="100%"
              />
            ) : (
              <Flex
                bg={generateColorFromName(sample.name)}
                width="100%"
                height="100%"
                justifyContent="center"
                alignItems="center"
              >
                <Icon as={MdMusicNote} fontSize="6xl" color="white" />
              </Flex>
            )}
          </Box>
          
          <IconButton
            position="absolute"
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            size="lg"
            rounded="full"
            colorScheme="red"
            onClick={handlePlayToggle}
            boxShadow="0 0 24px rgba(229, 62, 62, 0.6)"
            width="64px"
            height="64px"
            fontSize="24px"
            _hover={{
              transform: 'scale(1.1)',
              boxShadow: '0 0 32px rgba(229, 62, 62, 0.8)'
            }}
            _active={{
              transform: 'scale(0.95)'
            }}
            transition="all 0.2s ease"
          />
          
          <audio
            ref={audioRef}
            src={sample.audioUrl}
            onEnded={handleAudioEnd}
            preload="auto"
          />
        </Flex>
        
        {/* Tags section */}
        {sample.tags && sample.tags.length > 0 && (
          <Box width="100%" maxW="500px" mx="auto" mb={4}>
            <Wrap justify="center" spacing={2}>
              {sample.tags.map(tag => (
                <WrapItem key={tag}>
                  <Tag 
                    size="md" 
                    colorScheme="red" 
                    variant="subtle"
                    borderRadius="full"
                    px={3}
                    py={1}
                  >
                    {tag}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
          </Box>
        )}
        
        {/* Bottom section - Actions */}
        <HStack spacing={4} justifyContent="center" pt={4}>
          <IconButton
            icon={<FaHeart />}
            aria-label="Like"
            rounded="full"
            colorScheme={isLiked ? "red" : "whiteAlpha"}
            onClick={toggleLike}
            size="lg"
            variant={isLiked ? "solid" : "outline"}
            _hover={{ transform: 'scale(1.1)' }}
            _active={{ transform: 'scale(0.95)' }}
          />
          
          {user && (
            <IconButton
              icon={<FaPlus />}
              aria-label="Add to playlist"
              rounded="full"
              colorScheme="blue"
              onClick={onOpen}
              size="lg"
              _hover={{ transform: 'scale(1.1)' }}
              _active={{ transform: 'scale(0.95)' }}
            />
          )}
          
          {/* Delete button - only shown to the owner */}
          {isOwner && (
            <Tooltip label="Delete Sample" hasArrow placement="top">
              <IconButton
                icon={<FaTrash />}
                aria-label="Delete sample"
                rounded="full"
                colorScheme="red"
                variant="outline"
                onClick={onOpenDeleteDialog}
                size="lg"
                isLoading={isDeleting}
                _hover={{ transform: 'scale(1.1)', bg: 'red.600', color: 'white' }}
                _active={{ transform: 'scale(0.95)' }}
              />
            </Tooltip>
          )}
        </HStack>
      </Flex>
      
      {/* Playlist modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="sm">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg="gray.900" color="white">
          <ModalHeader>Add to Playlist</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {playlistsLoading ? (
              <Text textAlign="center" py={4}>Loading playlists...</Text>
            ) : playlists && playlists.length > 0 ? (
              <List spacing={2}>
                {playlists.map(playlist => (
                  <ListItem 
                    key={playlist.id} 
                    p={2} 
                    bg="whiteAlpha.100"
                    _hover={{ bg: "whiteAlpha.200" }}
                    borderRadius="md"
                    cursor={isAdding ? "not-allowed" : "pointer"}
                    onClick={isAdding ? null : () => handleAddToPlaylist(playlist)}
                    display="flex"
                    alignItems="center"
                    position="relative"
                    opacity={isAdding ? 0.7 : 1}
                  >
                    {isAdding && (
                      <Box 
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bg="blackAlpha.700"
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        borderRadius="md"
                        zIndex={2}
                      >
                        <Spinner size="sm" color="white" mr={2} />
                        <Text fontSize="sm">Adding...</Text>
                      </Box>
                    )}
                    
                    {playlist.coverImage ? (
                      <Image 
                        src={playlist.coverImage}
                        alt={playlist.name}
                        boxSize="40px"
                        borderRadius="md"
                        mr={3}
                      />
                    ) : (
                      <Box
                        w="40px"
                        h="40px"
                        bg={playlist.colorCode || "purple.500"}
                        borderRadius="md"
                        mr={3}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Icon as={MdMusicNote} color="white" />
                      </Box>
                    )}
                    <Text>{playlist.name}</Text>
                  </ListItem>
                ))}
              </List>
            ) : (
              <VStack spacing={3} py={4}>
                <Text>You don't have any playlists yet</Text>
                <Button colorScheme="red" size="sm" as="a" href="/createplaylist">
                  Create Playlist
                </Button>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete confirmation dialog */}
      <AlertDialog
        isOpen={isDeleteDialogOpen}
        leastDestructiveRef={cancelRef}
        onClose={onCloseDeleteDialog}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Sample
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{sample.name}"? This action cannot be undone.
              All files and data associated with this sample will be permanently removed.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseDeleteDialog}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDeleteSample} 
                ml={3}
                isLoading={isDeleting}
                loadingText="Deleting..."
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default SampleCard;
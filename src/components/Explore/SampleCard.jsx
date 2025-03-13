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
  useColorModeValue,
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
  Menu,
  MenuButton,
  MenuList,
  MenuItem
} from '@chakra-ui/react';
import { FaHeart, FaPlay, FaPause, FaPlus, FaChevronDown } from 'react-icons/fa';
import { MdMusicNote } from 'react-icons/md';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore, auth } from '../../firebase/firebase';
import useLikeSample from '../../hooks/useLikeSample';
import useUserPlaylists from '../../hooks/useUserPlaylists';
import usePlaylistData from '../../hooks/usePlaylistData';
import { useAuthState } from 'react-firebase-hooks/auth';

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
  
  // Add modal disclosure
  const { isOpen, onOpen, onClose } = useDisclosure();
  
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
    // Check if playlist has tracks array and initialize if not
    if (!playlist.tracks) {
      playlist.tracks = [];
    }
    
    // Create a sanitized track object with no undefined values
    const trackToAdd = {
      id: sample.id || `track-${Date.now()}`,
      name: sample.name || 'Untitled Track',
      audioUrl: sample.audioUrl || '',
      // Only add these if they exist
      ...(sample.coverImage ? { coverImage: sample.coverImage } : {}),
      ...(sample.key ? { key: sample.key } : {}),
      ...(sample.bpm ? { bpm: sample.bpm } : {}),
      addedAt: new Date(),
      userId: sample.userId || user?.uid || 'unknown',
    };
    
    // Show loading state on the button
    const success = await addToPlaylist(trackToAdd, playlist);
    if (success) {
      onClose();
    }
  };

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
        p={{ base: 3, md: 6 }} // Responsive padding
        justifyContent="space-between"
        bg="rgba(0, 0, 0, 0.5)" // Add semi-transparent background for better text contrast
      >
        {/* Top section - Sample details with better spacing */}
        <Flex 
          justifyContent="space-between" 
          width="100%"
          mb={4} // Add margin-bottom for separation
        >
          <VStack align="flex-start" spacing={1} maxW="60%"> {/* Limit width to prevent overflow */}
            <Text 
              fontSize={{ base: "xl", md: "2xl" }} 
              fontWeight="bold" 
              color="white"
              noOfLines={1} // Limit to 1 line with ellipsis
              textShadow="0px 1px 2px rgba(0,0,0,0.8)" // Add text shadow for readability
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
          
          {/* Sample metadata with better positioning */}
          <VStack align="flex-end" spacing={2}>
            <Badge colorScheme="purple" px={2} py={1} borderRadius="full">
              {sample.bpm} BPM
            </Badge>
            <Badge colorScheme="blue" px={2} py={1} borderRadius="full">
              {sample.key}
            </Badge>
          </VStack>
        </Flex>
        
        {/* Center section - Cover image and play button with better spacing */}
        <Flex 
          justifyContent="center" 
          alignItems="center" 
          flex={1}
          position="relative"
          my={{ base: 2, md: 4 }} // Add vertical margin
        >
          <Box
            width="200px"
            height="200px"
            borderRadius="lg"
            overflow="hidden"
            border="4px solid"
            borderColor="whiteAlpha.500"
            position="relative"
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
          
          {/* Play/pause button */}
          <IconButton
            position="absolute"
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            size="lg"
            rounded="full"
            colorScheme="purple"
            onClick={handlePlayToggle}
            boxShadow="xl"
            width="60px"
            height="60px"
            fontSize="24px"
          />
          
          {/* Hidden audio element */}
          <audio 
            ref={audioRef} 
            src={sample.audioUrl}
            onEnded={handleAudioEnd}
            preload="auto"
          />
        </Flex>
        
        {/* Bottom section - Tags and actions with improved layout */}
        <VStack spacing={4} width="100%" mt={4}>
          {/* Tags with limited width and scrolling */}
          {sample.tags && sample.tags.length > 0 && (
            <Box width="100%" maxW="400px" mx="auto" overflow="hidden">
              <Wrap justify="center" spacing={2}>
                {sample.tags.map(tag => (
                  <WrapItem key={tag}>
                    <Tag 
                      size="md" 
                      colorScheme="purple" 
                      variant="solid"
                      borderRadius="full"
                    >
                      {tag}
                    </Tag>
                  </WrapItem>
                ))}
              </Wrap>
            </Box>
          )}
          
          {/* Action buttons with better spacing */}
          <HStack spacing={{ base: 6, md: 8 }} justifyContent="center">
            <VStack spacing={1}>
              <IconButton
                icon={<FaHeart />}
                aria-label="Like"
                rounded="full"
                colorScheme={isLiked ? "red" : "whiteAlpha"}
                onClick={toggleLike}
              />
              <Text 
                color="white" 
                fontWeight="bold"
                textShadow="0px 1px 2px rgba(0,0,0,0.8)"
              >
                {likeCount}
              </Text>
            </VStack>
            
            <VStack spacing={1}>
              <IconButton
                icon={<FaPlus />}
                aria-label="Add to playlist"
                rounded="full"
                colorScheme="purple" // Changed from whiteAlpha to purple for more visibility
                onClick={user ? onOpen : null}
                isDisabled={!user}
                size="md"
                boxShadow="0px 0px 10px rgba(159, 122, 234, 0.5)" // Add glow effect
                _hover={{ 
                  transform: 'scale(1.1)',
                  boxShadow: '0px 0px 15px rgba(159, 122, 234, 0.8)'
                }}
              />
              <Text 
                color="white"
                textShadow="0px 1px 2px rgba(0,0,0,0.8)"
                fontWeight="bold" // Make text bolder
              >
                Add
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Flex>
      
      {/* Add Playlist Selection Modal */}
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
                    cursor="pointer"
                    onClick={() => handleAddToPlaylist(playlist)}
                    display="flex"
                    alignItems="center"
                  >
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
                <Button colorScheme="purple" size="sm" as="a" href="/createplaylist">
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
    </Box>
  );
};

export default SampleCard;

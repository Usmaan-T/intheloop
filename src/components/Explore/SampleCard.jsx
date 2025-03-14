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
  Spinner
} from '@chakra-ui/react';
import { FaHeart, FaPlay, FaPause, FaPlus } from 'react-icons/fa';
import { MdMusicNote } from 'react-icons/md';
import { doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';
import { firestore, auth } from '../../firebase/firebase';
import useLikeSample from '../../hooks/useLikeSample';
import { useAuthState } from 'react-firebase-hooks/auth';
import useUserPlaylists from '../../hooks/useUserPlaylists';
import usePlaylistData from '../../hooks/usePlaylistData';

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
            <Badge colorScheme="purple" px={2} py={1} borderRadius="full">
              {sample.bpm} BPM
            </Badge>
            <Badge colorScheme="blue" px={2} py={1} borderRadius="full">
              {sample.key}
            </Badge>
          </VStack>
        </Flex>
        
        {/* Center section - Cover image and play button */}
        <Flex 
          justifyContent="center" 
          alignItems="center" 
          flex={1}
          position="relative"
          my={{ base: 2, md: 4 }}
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
        
        {/* Bottom section - Tags and actions */}
        <VStack spacing={4} width="100%" mt={4}>
          {/* Tags section */}
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
          
          {/* Action buttons */}
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
                colorScheme="purple"
                onClick={user ? onOpen : null}
                isDisabled={!user}
                size="md"
                boxShadow="0px 0px 10px rgba(159, 122, 234, 0.5)"
                _hover={{ 
                  transform: 'scale(1.1)',
                  boxShadow: '0px 0px 15px rgba(159, 122, 234, 0.8)'
                }}
              />
              <Text 
                color="white"
                textShadow="0px 1px 2px rgba(0,0,0,0.8)"
                fontWeight="bold"
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

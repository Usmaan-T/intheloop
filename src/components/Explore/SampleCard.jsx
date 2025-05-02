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
import { FaHeart, FaPlay, FaPause, FaPlus, FaTrash, FaThumbsUp, FaFire } from 'react-icons/fa';
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

const SampleCard = ({ 
  sample, 
  onNext, 
  isCompact = false, 
  showRecommendationReason = false 
}) => {
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

  // Get recommendation display info
  const showRecommendation = showRecommendationReason && sample.recommendationReason;
  const isTrending = sample.recommendationReason === 'trending';

  return (
    <Box 
      height={isCompact ? "auto" : "100%"} 
      width="100%"
      position="relative"
      bg="gray.900"
      borderRadius="lg"
      overflow="hidden"
      transition="transform 0.2s, box-shadow 0.2s"
      _hover={isCompact ? {
        transform: "translateY(-5px)",
        boxShadow: "lg"
      } : {}}
      cursor={isCompact ? "pointer" : "default"}
      onClick={isCompact ? () => navigate(`/samples/${sample.id}`) : undefined}
    >
      {/* Recommendation reason banner */}
      {showRecommendation && (
        <Flex
          position="absolute"
          top={0}
          left={0}
          right={0}
          zIndex={5}
          bg={isTrending ? "orange.600" : "blue.600"}
          py={1}
          px={3}
          alignItems="center"
          borderBottom="1px solid"
          borderColor={isTrending ? "orange.800" : "blue.800"}
          boxShadow="0 2px 8px rgba(0,0,0,0.2)"
        >
          <Icon 
            as={isTrending ? FaFire : FaThumbsUp} 
            color="white" 
            mr={2} 
            boxSize={3} 
          />
          <Text fontSize="xs" fontWeight="medium" color="white">
            {isTrending ? "Trending Now" : sample.recommendationReason}
          </Text>
        </Flex>
      )}
      
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
        p={{ base: isCompact ? 3 : 3, md: isCompact ? 4 : 6 }}
        justifyContent="space-between"
        bg="rgba(0, 0, 0, 0.5)"
        pt={showRecommendation ? 8 : undefined}
      >
        {/* Top section - Sample details */}
        <Flex 
          justifyContent="space-between" 
          width="100%"
          mb={isCompact ? 2 : 4}
        >
          <VStack align="flex-start" spacing={1} maxW="60%">
            <Text 
              fontSize={{ base: isCompact ? "lg" : "xl", md: isCompact ? "xl" : "2xl" }} 
              fontWeight="bold" 
              color="white"
              noOfLines={1}
              textShadow="0px 1px 2px rgba(0,0,0,0.8)"
            >
              {sample.name}
            </Text>
            <HStack>
              <Avatar size={isCompact ? "xs" : "sm"} src={userData?.photoURL} name={artistName} />
              <Text 
                color="white" 
                noOfLines={1}
                fontSize={isCompact ? "xs" : "sm"}
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
          my={isCompact ? 2 : 4}
        >
          <Box
            width={{ 
              base: isCompact ? "120px" : "200px", 
              md: isCompact ? "160px" : "240px" 
            }}
            height={{ 
              base: isCompact ? "120px" : "200px", 
              md: isCompact ? "160px" : "240px" 
            }}
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
            size={isCompact ? "md" : "lg"}
            rounded="full"
            colorScheme="red"
            onClick={(e) => {
              e.stopPropagation(); // Prevent navigation in compact mode
              handlePlayToggle();
            }}
            boxShadow="0 0 24px rgba(229, 62, 62, 0.6)"
            width={isCompact ? "48px" : "64px"}
            height={isCompact ? "48px" : "64px"}
            fontSize={isCompact ? "18px" : "24px"}
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
          <Box width="100%" maxW="500px" mx="auto" mb={isCompact ? 2 : 4}>
            <Wrap justify="center" spacing={isCompact ? 1 : 2}>
              {sample.tags.slice(0, isCompact ? 3 : undefined).map(tag => (
                <WrapItem key={tag}>
                  <Tag 
                    size={isCompact ? "sm" : "md"} 
                    colorScheme="red" 
                    variant="subtle"
                    borderRadius="full"
                    px={isCompact ? 2 : 3}
                    py={isCompact ? 0.5 : 1}
                  >
                    {tag}
                  </Tag>
                </WrapItem>
              ))}
              {isCompact && sample.tags.length > 3 && (
                <WrapItem>
                  <Tag
                    size="sm"
                    colorScheme="gray"
                    variant="subtle"
                    borderRadius="full"
                  >
                    +{sample.tags.length - 3} more
                  </Tag>
                </WrapItem>
              )}
            </Wrap>
          </Box>
        )}
        
        {/* Bottom section - Actions */}
        <HStack spacing={4} justifyContent="center" pt={isCompact ? 2 : 4}>
          <IconButton
            icon={<FaHeart />}
            aria-label="Like"
            rounded="full"
            colorScheme={isLiked ? "red" : "whiteAlpha"}
            onClick={(e) => {
              e.stopPropagation(); // Prevent navigation in compact mode
              toggleLike();
            }}
            size={isCompact ? "md" : "lg"}
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
              onClick={(e) => {
                e.stopPropagation(); // Prevent navigation in compact mode
                onOpen();
              }}
              size={isCompact ? "md" : "lg"}
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
                onClick={(e) => {
                  e.stopPropagation(); // Prevent navigation in compact mode
                  onOpenDeleteDialog();
                }}
                size={isCompact ? "md" : "lg"}
                isLoading={isDeleting}
                _hover={{ transform: 'scale(1.1)', bg: 'red.600', color: 'white' }}
                _active={{ transform: 'scale(0.95)' }}
              />
            </Tooltip>
          )}
        </HStack>
      </Flex>
      
      {/* Playlist modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay backdropFilter="blur(10px)" />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader fontSize="xl" fontWeight="bold">Add to Playlist</ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={6}>
            {playlistsLoading ? (
              <Flex justify="center" py={4}>
                <Spinner color="red.500" />
              </Flex>
            ) : playlists && playlists.length > 0 ? (
              <List spacing={3}>
                {playlists.map(playlist => (
                  <ListItem key={playlist.id}>
                    <Button
                      variant="ghost"
                      justifyContent="flex-start"
                      width="100%"
                      py={2}
                      px={3}
                      onClick={() => handleAddToPlaylist(playlist)}
                      isLoading={isAdding}
                      _hover={{ bg: "whiteAlpha.200" }}
                      color="white"
                    >
                      <HStack spacing={3} width="100%">
                        <Box
                          width="40px"
                          height="40px"
                          borderRadius="md"
                          bg={playlist.coverImage ? "transparent" : "red.500"}
                          overflow="hidden"
                        >
                          {playlist.coverImage ? (
                            <Image 
                              src={playlist.coverImage} 
                              alt={playlist.name} 
                              width="100%" 
                              height="100%" 
                              objectFit="cover"
                            />
                          ) : (
                            <Flex
                              width="100%"
                              height="100%"
                              justifyContent="center"
                              alignItems="center"
                            >
                              <MdMusicNote color="white" size={24} />
                            </Flex>
                          )}
                        </Box>
                        <VStack align="start" spacing={0} flex={1}>
                          <Text fontWeight="medium" color="white">{playlist.name}</Text>
                          <Text fontSize="xs" color="gray.300">
                            {playlist.tracks?.length || 0} tracks
                          </Text>
                        </VStack>
                      </HStack>
                    </Button>
                  </ListItem>
                ))}
              </List>
            ) : (
              <VStack spacing={3} py={4}>
                <Text color="white">You don't have any playlists yet</Text>
                <Button colorScheme="red" size="sm" as="a" href="/createplaylist">
                  Create Playlist
                </Button>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" colorScheme="red" onClick={onClose}>
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
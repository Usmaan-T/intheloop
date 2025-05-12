import React from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  Tooltip,
  Badge,
  IconButton,
  HStack,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  List,
  ListItem,
  VStack,
  Image,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { FaPlus, FaHeart, FaPlay, FaPause, FaDownload, FaEye, FaTrash } from 'react-icons/fa';
import { MdMusicNote, MdPlaylistAdd, MdPlaylistPlay } from 'react-icons/md';
import { motion } from 'framer-motion';
import Waveform from '../Waveform/Waveform';
import useLikeSample from '../../hooks/useLikeSample';
import useAudioPlayback from '../../hooks/useAudioPlayback';
import useDownloadTrack from '../../hooks/useDownloadTrack';
import useTrackSampleView from '../../hooks/useTrackSampleView';
import useDeleteSample from '../../hooks/useDeleteSample';
import useUserPlaylists from '../../hooks/useUserPlaylists';
import usePlaylistData from '../../hooks/usePlaylistData';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import ArtistInfo from './SampleRow/ArtistInfo';
import SampleCover from './SampleRow/SampleCover';
import TagsList from './SampleRow/TagsList';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionIconButton = motion(IconButton);

const SampleRow = ({ track, onDelete }) => {
  const navigate = useNavigate();
  // Use our custom hooks for audio playback and download
  const { audioRef, isPlaying, handlePlayToggle, handleAudioEnd } = useAudioPlayback(track.audioUrl);
  const { downloadTrack, downloadLoading } = useDownloadTrack();
  const { isLiked, likeCount, toggleLike, isLoading: likeLoading } = useLikeSample(track.id);
  const { deleteSample, isDeleting } = useDeleteSample();
  const [user] = useAuthState(auth);
  
  // For delete confirmation dialog
  const { isOpen: isDeleteDialogOpen, onOpen: onOpenDeleteDialog, onClose: onCloseDeleteDialog } = useDisclosure();
  const cancelRef = React.useRef();
  
  // For playlist modal
  const { isOpen: isPlaylistModalOpen, onOpen: onOpenPlaylistModal, onClose: onClosePlaylistModal } = useDisclosure();
  
  // For playlists functionality
  const { playlists, isLoading: playlistsLoading } = useUserPlaylists(user?.uid);
  const { addToPlaylist, isAdding } = usePlaylistData();
  
  // Track when this sample is viewed
  useTrackSampleView(track.id);
  
  // Get popularity metrics for display
  const viewCount = track.stats?.views || 0;
  const downloadCount = track.stats?.downloads || 0;
  
  // Check if current user is the sample owner
  const isOwner = user && track.userId === user.uid;
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    const success = await deleteSample(
      track.id,
      track.audioUrl,
      track.imageUrl,
      user?.uid,
      track.userId
    );
    
    if (success && onDelete) {
      onDelete(track.id);
    }
    
    onCloseDeleteDialog();
  };
  
  // Handle adding to playlist
  const handleAddToPlaylist = async (playlist) => {
    try {
      console.log("Adding track to collection:", playlist.name);
      
      // If we don't have a trackId, use track UID
      const trackToAdd = {
        id: track.id,
        name: track.name,
        audioUrl: track.audioUrl,
        coverImage: track.coverImage,
        duration: track.duration,
        waveformData: track.waveformData,
        bpm: track.bpm,
        key: track.key,
        addedAt: new Date().toISOString()
      };
      
      // Call the addToPlaylist function from the hook
      const success = await addToPlaylist(trackToAdd, playlist);
      
      if (success) {
        toast({
          title: "Added to collection",
          description: `Track added to ${playlist.name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onClosePlaylistModal();
      }
    } catch (error) {
      console.error("Error in handleAddToPlaylist:", error);
      toast({
        title: "Error",
        description: "Failed to add track to collection",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };
  
  return (
    <MotionBox
      bg="rgba(20, 20, 30, 0.7)"
      backdropFilter="blur(8px)"
      borderRadius="xl"
      overflow="hidden"
      mb={4}
      border="1px solid"
      borderColor="whiteAlpha.200"
      transition="all 0.3s ease"
      whileHover={{ 
        y: -5, 
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
        borderColor: "whiteAlpha.300"
      }}
      position="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Flex
        p={4}
        direction={{ base: 'column', lg: 'row' }}
        alignItems={{ base: 'flex-start', lg: 'center' }}
        justifyContent="space-between"
        gap={4}
      >
        {/* Left section with Play button and artwork */}
        <Flex alignItems="center" gap={4} flex="1">
          {/* Play/Pause button */}
          <MotionIconButton
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            aria-label={isPlaying ? "Pause" : "Play"}
            isRound
            bgGradient={isPlaying ? "linear(to-r, brand.600, brand.500)" : "linear(to-r, brand.500, brand.400)"}
            _hover={{ 
              bgGradient: isPlaying ? "linear(to-r, brand.700, brand.600)" : "linear(to-r, brand.600, brand.500)",
              transform: "scale(1.1)"
            }}
            size="md"
            onClick={handlePlayToggle}
            boxShadow="0 0 15px rgba(214, 34, 34, 0.3)"
            color="white"
            transition="all 0.2s"
            whileTap={{ scale: 0.95 }}
          />
          
          {/* Cover Image - Using our new component */}
          <SampleCover track={track} />

          {/* Track Details */}
          <Box flex="1" minW={0}>
            <Text 
              fontWeight="bold" 
              fontSize="md" 
              color="white" 
              noOfLines={1}
              bgGradient="linear(to-r, white, whiteAlpha.800)"
              bgClip="text"
              letterSpacing="tight"
            >
              {track.name}
            </Text>
            
            {/* Artist Info - Using our new component */}
            <ArtistInfo userId={track.userId} />
            
            {/* Tags - Using our new component */}
            <TagsList tags={track.tags} />
          </Box>
        </Flex>

        {/* Right side actions section */}
        <Flex 
          alignItems="center" 
          gap={4}
          justifyContent="flex-end"
          minW={{ lg: '240px' }}
        >
          {/* Sound properties */}
          <HStack spacing={2}>
            {track.bpm && (
              <Badge 
                bgGradient="linear(to-r, brand.500, accent.pink.500)"
                color="white"
                px={2} 
                py={1} 
                borderRadius="full"
                fontWeight="medium"
                fontSize="xs"
              >
                {track.bpm} BPM
              </Badge>
            )}
            {track.key && (
              <Badge 
                bgGradient="linear(to-r, accent.blue.500, accent.purple.500)"
                color="white"
                px={2} 
                py={1} 
                borderRadius="full"
                fontWeight="medium"
                fontSize="xs"
              >
                {track.key}
              </Badge>
            )}
          </HStack>

          {/* Action buttons */}
          <HStack spacing={2}>
            {/* Like button */}
            <Tooltip label={isLiked ? "Unlike" : "Like"}>
              <MotionIconButton
                icon={<FaHeart />}
                aria-label={isLiked ? "Unlike" : "Like"}
                size="sm"
                isRound
                colorScheme={isLiked ? "red" : "whiteAlpha"}
                variant={isLiked ? "solid" : "ghost"}
                onClick={toggleLike}
                isLoading={likeLoading}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition="all 0.2s"
                color={isLiked ? undefined : "white"}
              />
            </Tooltip>
            
            {/* Add to playlist button */}
            <Tooltip label="Add to collection">
              <IconButton
                aria-label="Add to collection"
                icon={<MdPlaylistAdd />}
                size="md"
                variant="ghost" 
                color="purple.400"
                borderRadius="full"
                mr={1}
                onClick={onOpenPlaylistModal}
                isDisabled={!user}
              />
            </Tooltip>
            
            {/* Download button */}
            <Tooltip label="Download">
              <MotionIconButton
                icon={<FaDownload />}
                aria-label="Download sample"
                size="sm"
                isRound
                colorScheme="whiteAlpha"
                variant="ghost"
                onClick={() => downloadTrack(track)}
                isLoading={downloadLoading}
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                transition="all 0.2s"
                color="white"
              />
            </Tooltip>
            
            {/* Delete button - Only visible to sample owner */}
            {isOwner && (
              <Tooltip label="Delete">
                <MotionIconButton
                  icon={<FaTrash />}
                  aria-label="Delete sample"
                  size="sm"
                  isRound
                  colorScheme="red"
                  variant="ghost"
                  onClick={onOpenDeleteDialog}
                  isLoading={isDeleting}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(229, 62, 62, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  transition="all 0.2s"
                  color="red.400"
                />
              </Tooltip>
            )}
          </HStack>

          {/* Stats indicators - Views, Downloads, Likes */}
          <HStack spacing={4} color="white">
            <Tooltip label={`${viewCount} ${viewCount === 1 ? 'view' : 'views'}`}>
              <Flex align="center">
                <Icon as={FaEye} mr={1} />
                <Text fontSize="xs" fontWeight="medium">{viewCount}</Text>
              </Flex>
            </Tooltip>
            
            <Tooltip label={`${downloadCount} ${downloadCount === 1 ? 'download' : 'downloads'}`}>
              <Flex align="center">
                <Icon as={FaDownload} mr={1} />
                <Text fontSize="xs" fontWeight="medium">{downloadCount}</Text>
              </Flex>
            </Tooltip>
            
            <Tooltip label={`${likeCount} ${likeCount === 1 ? 'like' : 'likes'}`}>
              <Flex align="center">
                <Icon as={FaHeart} mr={1} />
                <Text fontSize="xs" fontWeight="medium">{likeCount}</Text>
              </Flex>
            </Tooltip>
          </HStack>
        </Flex>
      </Flex>
      
      {/* Add popularity metrics display */}
      <Flex px={4} pb={2} justifyContent="flex-end" color="gray.400" fontSize="xs">
        <HStack spacing={4}>


          {track.popularityScores && (
            <Tooltip label="Popularity Score">
              <HStack spacing={1}>
                <Badge 
                  bgGradient="linear(to-r, accent.purple.500, accent.purple.600)" 
                  variant="solid" 
                  fontSize="xs"
                  borderRadius="full"
                  px={2}
                >
                  {Math.round(track.popularityScores.allTime || 0)}
                </Badge>
                {track.popularityScores?.daily && (
                  <Badge 
                    bgGradient="linear(to-r, brand.500, brand.600)" 
                    variant="solid" 
                    fontSize="xs"
                    borderRadius="full"
                    px={2}
                  >
                    +{Math.round(track.popularityScores.weekly)}
                  </Badge>
                )}
              </HStack>
            </Tooltip>
          )}
        </HStack>
      </Flex>
      
      {/* Waveform section - always visible */}
      <Box 
        p={4} 
        pt={0} 
        height="80px"
        bg="rgba(0, 0, 0, 0.2)"
        borderTop="1px solid"
        borderColor="whiteAlpha.100"
      >
        <Waveform 
          audioUrl={track.audioUrl} 
          options={{
            waveColor: 'rgb(255, 255, 255)',
            progressColor: isLiked ? 'rgba(229, 62, 62, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            cursorColor: 'rgba(229, 62, 62, 0.8)',
            barWidth: 2,
            barGap: 3,
            barRadius: 1
          }}
        />
        <audio 
          ref={audioRef}
          src={track.audioUrl}
          onEnded={handleAudioEnd}
          preload="auto"
        />
      </Box>
      
      {/* Delete Confirmation Dialog */}
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
              Delete Sample
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{track.name}"? This action cannot be undone.
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
                bgGradient="linear(to-r, brand.500, brand.600)"
                _hover={{ 
                  bgGradient: "linear(to-r, brand.600, brand.700)",
                  transform: "translateY(-2px)"
                }}
                onClick={handleDeleteConfirm} 
                ml={3}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      
      {/* Playlist modal */}
      <Modal isOpen={isPlaylistModalOpen} onClose={onClosePlaylistModal} size="md">
        <ModalOverlay backdropFilter="blur(5px)" />
        <ModalContent bg="darkBg.800" border="1px solid" borderColor="whiteAlpha.200">
          <ModalHeader fontSize="xl" fontWeight="bold">Add to Collection</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {playlistsLoading ? (
              <Center py={4}>
                <Spinner size="md" color="purple.400" />
              </Center>
            ) : playlists && playlists.length > 0 ? (
              <List spacing={2}>
                {playlists.map(playlist => (
                  <ListItem key={playlist.id}>
                    <Flex 
                      p={3} 
                      borderRadius="md" 
                      alignItems="center" 
                      border="1px solid"
                      borderColor="whiteAlpha.200"
                      cursor="pointer"
                      onClick={() => handleAddToPlaylist(playlist)}
                      _hover={{ bg: "rgba(255, 255, 255, 0.05)" }}
                      transition="all 0.2s ease"
                    >
                      <Box 
                        w="40px" 
                        h="40px" 
                        borderRadius="md" 
                        mr={3}
                        bg={playlist.coverImage ? "transparent" : "purple.500"}
                        overflow="hidden"
                      >
                        {playlist.coverImage ? (
                          <Image 
                            src={playlist.coverImage} 
                            alt={playlist.name} 
                            objectFit="cover"
                            w="full"
                            h="full"
                          />
                        ) : (
                          <Center h="full" color="white" fontSize="lg">
                            <MdPlaylistPlay />
                          </Center>
                        )}
                      </Box>
                      <Box flex="1">
                        <Text fontWeight="medium" color="white">{playlist.name}</Text>
                        <Text fontSize="xs" color="whiteAlpha.700">
                          {playlist.tracks?.length || 0} tracks
                        </Text>
                      </Box>
                    </Flex>
                  </ListItem>
                ))}
              </List>
            ) : (
              <VStack spacing={4} py={4}>
                <Text color="white">You don't have any collections yet</Text>
                <Button 
                  colorScheme="purple" 
                  onClick={() => {
                    onClosePlaylistModal();
                    navigate('/createplaylist');
                  }}
                >
                  Create Collection
                </Button>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" colorScheme="purple" onClick={onClosePlaylistModal}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </MotionBox>
  );
};

export default SampleRow;
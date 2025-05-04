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
} from '@chakra-ui/react';
import { FaPlus, FaHeart, FaPlay, FaPause, FaDownload, FaEye, FaTrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Waveform from '../Waveform/Waveform';
import useLikeSample from '../../hooks/useLikeSample';
import useAudioPlayback from '../../hooks/useAudioPlayback';
import useDownloadTrack from '../../hooks/useDownloadTrack';
import useTrackSampleView from '../../hooks/useTrackSampleView';
import useDeleteSample from '../../hooks/useDeleteSample';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import ArtistInfo from './SampleRow/ArtistInfo';
import SampleCover from './SampleRow/SampleCover';
import TagsList from './SampleRow/TagsList';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionIconButton = motion(IconButton);

const SampleRow = ({ track, onDelete }) => {
  // Use our custom hooks for audio playback and download
  const { audioRef, isPlaying, handlePlayToggle, handleAudioEnd } = useAudioPlayback(track.audioUrl);
  const { downloadTrack, downloadLoading } = useDownloadTrack();
  const { isLiked, likeCount, toggleLike, isLoading: likeLoading } = useLikeSample(track.id);
  const { deleteSample, isDeleting } = useDeleteSample();
  const [user] = useAuthState(auth);
  
  // For delete confirmation dialog
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();
  
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
    
    onClose();
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
              />
            </Tooltip>
            
            {/* Add to playlist button */}
            <Tooltip label="Add to playlist">
              <MotionIconButton
                icon={<FaPlus />}
                aria-label="Add to playlist"
                size="sm"
                isRound
                colorScheme="whiteAlpha"
                variant="ghost"
                whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.95 }}
                transition="all 0.2s"
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
                  onClick={onOpen}
                  isLoading={isDeleting}
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(229, 62, 62, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  transition="all 0.2s"
                />
              </Tooltip>
            )}
          </HStack>
        </Flex>
      </Flex>
      
      {/* Add popularity metrics display */}
      <Flex px={4} pb={2} justifyContent="flex-end" color="gray.400" fontSize="xs">
        <HStack spacing={4}>
          <Tooltip label="Views">
            <HStack spacing={1}>
              <Icon as={FaEye} />
              <Text>{viewCount}</Text>
            </HStack>
          </Tooltip>
          
          <Tooltip label="Downloads">
            <HStack spacing={1}>
              <Icon as={FaDownload} />
              <Text>{downloadCount}</Text>
            </HStack>
          </Tooltip>
          
          <Tooltip label="Likes">
            <HStack spacing={1}>
              <Icon as={FaHeart} color="brand.400" />
              <Text>{likeCount}</Text>
            </HStack>
          </Tooltip>

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
                    +{Math.round(track.popularityScores.daily)}
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
            waveColor: 'rgba(255, 255, 255, 0.4)',
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
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
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
                onClick={onClose} 
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
    </MotionBox>
  );
};

export default SampleRow;
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
} from '@chakra-ui/react';
import { FaPlus, FaHeart, FaPlay, FaPause, FaDownload, FaEye } from 'react-icons/fa';
import Waveform from '../Waveform/Waveform';
import useLikeSample from '../../hooks/useLikeSample';
import useAudioPlayback from '../../hooks/useAudioPlayback';
import useDownloadTrack from '../../hooks/useDownloadTrack';
import useTrackSampleView from '../../hooks/useTrackSampleView'; // Add this import
import ArtistInfo from './SampleRow/ArtistInfo';
import SampleCover from './SampleRow/SampleCover';
import TagsList from './SampleRow/TagsList';

const SampleRow = ({ track }) => {
  // Use our custom hooks for audio playback and download
  const { audioRef, isPlaying, handlePlayToggle, handleAudioEnd } = useAudioPlayback(track.audioUrl);
  const { downloadTrack, downloadLoading } = useDownloadTrack();
  const { isLiked, likeCount, toggleLike, isLoading: likeLoading } = useLikeSample(track.id);
  
  // Track when this sample is viewed
  useTrackSampleView(track.id);
  
  // Get popularity metrics for display
  const viewCount = track.stats?.views || 0;
  const downloadCount = track.stats?.downloads || 0;
  
  return (
    <Box
      bg="rgba(20, 20, 30, 0.8)"
      borderRadius="lg"
      overflow="hidden"
      mb={4}
      border="1px solid"
      borderColor="whiteAlpha.200"
      transition="all 0.2s"
      _hover={{ 
        transform: 'translateY(-2px)', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
        bg: 'rgba(25, 25, 35, 0.8)' 
      }}
      position="relative"
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
          <IconButton
            icon={isPlaying ? <FaPause /> : <FaPlay />}
            aria-label={isPlaying ? "Pause" : "Play"}
            isRound
            colorScheme="red"
            size="md"
            onClick={handlePlayToggle}
            boxShadow="0 0 10px rgba(229, 62, 62, 0.4)"
          />
          
          {/* Cover Image - Using our new component */}
          <SampleCover track={track} />

          {/* Track Details */}
          <Box flex="1" minW={0}>
            <Text fontWeight="bold" fontSize="md" color="white" noOfLines={1}>
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
            <Badge colorScheme="red" px={2} py={1} borderRadius="full">
              {track.bpm} BPM
            </Badge>
            <Badge colorScheme="blue" px={2} py={1} borderRadius="full">
              {track.key}
            </Badge>
          </HStack>

          {/* Action buttons */}
          <HStack spacing={2}>
            {/* Like button */}
            <Tooltip label={isLiked ? "Unlike" : "Like"}>
              <IconButton
                icon={<FaHeart />}
                aria-label={isLiked ? "Unlike" : "Like"}
                size="sm"
                isRound
                colorScheme={isLiked ? "red" : "whiteAlpha"}
                variant={isLiked ? "solid" : "ghost"}
                onClick={toggleLike}
                isLoading={likeLoading}
              />
            </Tooltip>
            
            {/* Add to playlist button */}
            <Tooltip label="Add to playlist">
              <IconButton
                icon={<FaPlus />}
                aria-label="Add to playlist"
                size="sm"
                isRound
                colorScheme="whiteAlpha"
                variant="ghost"
              />
            </Tooltip>
            
            {/* Download button */}
            <Tooltip label="Download">
              <IconButton
                icon={<FaDownload />}
                aria-label="Download sample"
                size="sm"
                isRound
                colorScheme="whiteAlpha"
                variant="ghost"
                onClick={() => downloadTrack(track)}
                isLoading={downloadLoading}
                _hover={{ bg: "whiteAlpha.300" }}
              />
            </Tooltip>
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
              <Icon as={FaHeart} />
              <Text>{likeCount}</Text>
            </HStack>
          </Tooltip>

          {track.popularityScores && (
            <Tooltip label="Popularity Score">
              <HStack spacing={1}>
                <Badge colorScheme="purple" variant="solid" fontSize="xs">
                  {Math.round(track.popularityScores.allTime || 0)}
                </Badge>
                {track.popularityScores?.daily && (
                  <Badge colorScheme="red" variant="solid" fontSize="xs">
                    +{Math.round(track.popularityScores.daily)}
                  </Badge>
                )}
              </HStack>
            </Tooltip>
          )}
        </HStack>
      </Flex>
      
      {/* Waveform section - always visible */}
      <Box p={4} pt={0} height="80px">
        <Waveform audioUrl={track.audioUrl} />
        <audio 
          ref={audioRef}
          src={track.audioUrl}
          onEnded={handleAudioEnd}
          preload="auto"
        />
      </Box>
    </Box>
  );
};

export default SampleRow;
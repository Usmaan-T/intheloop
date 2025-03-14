import React, { useState, useRef } from 'react';
import {
  Box,
  Flex,
  Text,
  Image,
  HStack,
  Icon,
  IconButton,
  Button,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Tooltip,
  Wrap,
  WrapItem,
  Tag,
} from '@chakra-ui/react';
import { MdMusicNote, MdMoreVert, MdDelete, MdFileDownload } from 'react-icons/md';
import { FaPlay, FaPause, FaDownload } from 'react-icons/fa';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import Waveform from '../Waveform/Waveform';
import { useDocument } from 'react-firebase-hooks/firestore';

const PlaylistTrackItem = ({ track, index, playlistId }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const audioRef = useRef(null);
  const toast = useToast();
  
  // Fetch user details for artist name
  const userDocRef = track.userId ? doc(firestore, 'users', track.userId) : null;
  const [userDoc] = useDocument(userDocRef);
  const userData = userDoc?.data();
  const artistName = userData?.username || 'Unknown Artist';
  
  // Generate color from track name
  const generateColor = (name) => {
    if (!name) return '#8A2BE2';
    
    const colors = ['#8A2BE2', '#4A90E2', '#50C878', '#FF6347', '#FFD700'];
    let sum = 0;
    
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    
    return colors[sum % colors.length];
  };
  
  const handlePlayToggle = (e) => {
    e.stopPropagation();
    
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const handleAudioEnd = () => {
    setIsPlaying(false);
  };

  // Remove track from playlist
  const removeTrack = async () => {
    try {
      // Get current playlist
      const playlistRef = doc(firestore, 'playlists', playlistId);
      const playlistSnap = await getDoc(playlistRef);
      
      if (!playlistSnap.exists()) {
        throw new Error('Playlist not found');
      }
      
      const playlistData = playlistSnap.data();
      const currentTracks = playlistData.tracks || [];
      
      // Remove the track at the specified index
      const updatedTracks = currentTracks.filter((_, i) => i !== index);
      
      // Update playlist
      await updateDoc(playlistRef, {
        tracks: updatedTracks
      });
      
      toast({
        title: 'Track removed',
        status: 'success',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error removing track:', error);
      toast({
        title: 'Error removing track',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    }
  };
  
  // Download function
  const handleDownload = () => {
    if (!track.audioUrl) {
      toast({
        title: 'Download Error',
        description: 'Audio URL is not available for this track',
        status: 'error',
        duration: 3000,
      });
      return;
    }
    
    // Create a temporary anchor element to trigger download
    const downloadLink = document.createElement('a');
    downloadLink.href = track.audioUrl;
    
    // Set filename for the download
    const fileName = track.name ? 
      `${track.name.replace(/[^a-zA-Z0-9]/g, '_')}.mp3` : 
      'sample.mp3';
    downloadLink.download = fileName;
    
    // This is needed for Firefox
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast({
      title: 'Download Started',
      status: 'success',
      duration: 2000,
    });
  };
  
  return (
    <Box
      py={4}
      px={3}
      _hover={{ bg: 'whiteAlpha.100' }}
      transition="all 0.2s"
      borderRadius="md"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Flex 
        direction={{ base: 'column', md: 'row' }} 
        alignItems={{ base: 'stretch', md: 'center' }} 
        gap={4}
      >
        {/* Track info section */}
        <Flex flex="1" gap={4} alignItems="center">
          {/* Index / Play button */}
          <Flex w="40px" align="center" justify="center">
            {isHovered ? (
              <IconButton
                icon={isPlaying ? <FaPause /> : <FaPlay />}
                aria-label={isPlaying ? "Pause" : "Play"}
                variant="ghost"
                color="white"
                size="sm"
                isRound
                onClick={handlePlayToggle}
              />
            ) : (
              <Text color="gray.500" fontWeight="medium" fontSize="lg">
                {index + 1}
              </Text>
            )}
          </Flex>
          
          {/* Cover Image */}
          <Box
            w="60px"
            h="60px"
            borderRadius="md"
            overflow="hidden"
          >
            {track.coverImage ? (
              <Image 
                src={track.coverImage} 
                alt={track.name} 
                w="100%" 
                h="100%" 
                objectFit="cover" 
              />
            ) : (
              <Flex
                bg={generateColor(track.name)}
                w="100%"
                h="100%"
                align="center"
                justify="center"
              >
                <Icon as={MdMusicNote} color="white" />
              </Flex>
            )}
          </Box>
          
          {/* Track details */}
          <Box flex="1" minW={0}>
            <Text color="white" fontWeight="medium" noOfLines={1}>
              {track.name || 'Untitled Track'}
            </Text>
            <Text color="gray.400" fontSize="sm" noOfLines={1}>
              {artistName}
            </Text>
            
            {/* Enhanced Tags Display */}
            <Wrap spacing={1} mt={2} mb={1}>
              {track.tags && track.tags.length > 0 ? (
                <>
                  {track.tags.map(tag => (
                    <WrapItem key={tag}>
                      <Tag 
                        size="sm" 
                        colorScheme="purple" 
                        variant="solid"
                        borderRadius="full"
                        boxShadow="0 0 2px rgba(128, 90, 213, 0.6)"
                      >
                        {tag}
                      </Tag>
                    </WrapItem>
                  ))}
                </>
              ) : (
                <Text fontSize="xs" color="gray.500" fontStyle="italic">No tags</Text>
              )}
            </Wrap>
          </Box>
        </Flex>
        
        {/* Metadata section */}
        <Flex 
          alignItems="center" 
          gap={4}
          justifyContent={{ base: 'space-between', md: 'flex-end' }}
          width={{ base: '100%', md: 'auto' }}
        >
          {/* Track info badges */}
          <HStack spacing={2}>
            {track.key && (
              <Badge colorScheme="blue" px={2} py={1} borderRadius="full">
                {track.key}
              </Badge>
            )}
            {track.bpm && (
              <Badge colorScheme="purple" px={2} py={1} borderRadius="full">
                {track.bpm} BPM
              </Badge>
            )}
          </HStack>
          
          {/* Download button */}
          <Tooltip label="Download sample">
            <IconButton
              icon={<FaDownload />}
              aria-label="Download track"
              variant="ghost"
              colorScheme="green"
              onClick={handleDownload}
              size="md"
            />
          </Tooltip>
          
          {/* More options menu */}
          <Menu placement="bottom-end">
            <MenuButton
              as={IconButton}
              icon={<MdMoreVert />}
              variant="ghost"
              size="sm"
              color="gray.400"
              _hover={{ color: 'white' }}
              aria-label="More options"
            />
            <MenuList bg="gray.800" borderColor="gray.700">
              <MenuItem 
                icon={<MdDelete />} 
                onClick={removeTrack}
                bg="transparent"
                _hover={{ bg: "red.700" }}
              >
                Remove from playlist
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
      </Flex>
      
      {/* Waveform section - appears on hover or when playing */}
      {(isHovered || isPlaying) && (
        <Box mt={4} px={4} height="70px">
          <Waveform audioUrl={track.audioUrl} />
        </Box>
      )}
      
      {/* Hidden audio element */}
      <audio 
        ref={audioRef} 
        src={track.audioUrl} 
        onEnded={handleAudioEnd}
        preload="none"
      />
    </Box>
  );
};

export default PlaylistTrackItem;

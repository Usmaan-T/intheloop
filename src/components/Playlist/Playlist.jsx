import { 
  Box, 
  Heading, 
  Image, 
  Text, 
  VStack, 
  Flex, 
  Badge, 
  IconButton,
  Tooltip,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button
} from '@chakra-ui/react';
import React, { useState, useRef } from 'react';
import { MdLibraryMusic, MdLock, MdDelete } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import usePlaylistData from '../../hooks/usePlaylistData';

const Playlist = ({ name, bio, image, color, privacy, id, userId }) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { deletePlaylist, isDeleting } = usePlaylistData();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();
  
  // Use provided color or generate one from name
  const getColorFromName = (name) => {
    if (color) return color;
    
    const colors = ['#8A2BE2', '#4A90E2', '#50C878', '#FF6347', '#FFD700'];
    let sum = 0;
    for (let i = 0; i < name?.length || 0; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  // Handle case where name might be undefined
  const displayName = name || "Untitled Playlist";
  const displayColor = getColorFromName(displayName);
  const isPrivate = privacy === 'private';
  
  // Check if current user is the owner of this playlist
  const isOwner = user && userId && user.uid === userId;
  
  // Handle delete playlist button click
  const handleDelete = (e) => {
    e.preventDefault(); // Prevent navigation to playlist page
    e.stopPropagation();
    onOpen();
  };
  
  // Handle confirmation of playlist deletion
  const handleDeleteConfirm = async () => {
    const success = await deletePlaylist(id);
    if (success) {
      onClose();
      // No need to navigate as the playlist list will update via the useUserPlaylists hook
    }
  };

  return (
    <Box 
      as={id ? Link : 'div'}  // Only use Link if id is defined
      to={id ? `/playlist/${id}` : '#'}  // Safe path with id check
      borderRadius="md" 
      overflow="hidden" 
      bg="blackAlpha.400"
      transition="transform 0.3s, box-shadow 0.3s"
      _hover={{ 
        transform: 'translateY(-5px)', 
        boxShadow: 'xl',
        cursor: 'pointer'
      }}
      height="100%"
      position="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isPrivate && (
        <Badge 
          position="absolute" 
          top={2} 
          right={2} 
          colorScheme="gray"
          px={2}
          py={1}
          borderRadius="md"
          display="flex"
          alignItems="center"
          zIndex={2}
        >
          <MdLock style={{ marginRight: '4px' }} /> Private
        </Badge>
      )}
      
      {/* Delete Button - only visible when hovered and user is owner */}
      {isHovered && isOwner && (
        <Tooltip label="Delete playlist" placement="top">
          <IconButton
            icon={<MdDelete />}
            size="sm"
            colorScheme="red"
            aria-label="Delete playlist"
            position="absolute"
            top={isPrivate ? 10 : 2}
            right={2}
            zIndex={3}
            onClick={handleDelete}
            opacity={0.8}
            _hover={{ opacity: 1 }}
          />
        </Tooltip>
      )}

      {image ? (
        // Show image if available
        <Image 
          src={image} 
          alt={displayName} 
          borderRadius="md" 
          objectFit="cover"
          w="100%"
          h="160px"
          fallback={
            <Flex 
              h="160px" 
              bg={displayColor}
              color="white"
              alignItems="center"
              justifyContent="center"
              fontSize="4xl"
            >
              <MdLibraryMusic />
            </Flex>
          }
        />
      ) : (
        // Show a colored box with icon if no image
        <Flex 
          h="160px" 
          bg={displayColor}
          color="white"
          alignItems="center"
          justifyContent="center"
          fontSize="4xl"
        >
          <MdLibraryMusic />
        </Flex>
      )}
      <VStack align="start" p={4} spacing={1}>
        <Heading size="md" color="white" noOfLines={1}>
          {displayName}
        </Heading>
        {bio && (
          <Text color="gray.300" fontSize="sm" noOfLines={2}>
            {bio}
          </Text>
        )}
      </VStack>
      
      {/* Delete confirmation dialog */}
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
              Delete Playlist
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to delete "{displayName}"? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button 
                ref={cancelRef} 
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }} 
                variant="outline"
                _hover={{ bg: "whiteAlpha.100" }}
                _active={{ bg: "whiteAlpha.200" }}
              >
                Cancel
              </Button>
              <Button 
                colorScheme="red"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConfirm();
                }} 
                ml={3}
                isLoading={isDeleting}
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

export default Playlist;
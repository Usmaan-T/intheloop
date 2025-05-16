import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Spinner, Alert, AlertIcon, Heading, Button, Box, Text } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import PlaylistCard from '../components/PlaylistCard';

const LoggedInHome = () => {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);
  const [playlistsError, setPlaylistsError] = useState(false);

  const horizontalScrollbarStyle = {
    // Add your horizontal scrollbar styles here
  };

  return (
    <Flex justify="center" w="full" py={10}>
      {playlistsLoading ? (
        <Spinner size="xl" color="red.500" thickness="4px" />
      ) : playlistsError ? (
        <Alert status="error" colorScheme="red" variant="left-accent">
          <AlertIcon />
          Error loading collections
        </Alert>
      ) : (
        <>
          {/* Create Playlist Button (only visible when user has data) */}
          <Flex justifyContent="space-between" alignItems="center" mb={4}>
            <Heading as="h2" fontSize="2xl" fontWeight="bold">
              Your Collections
            </Heading>
            <Button
              leftIcon={<FaPlus />}
              colorScheme="red"
              variant="outline"
              onClick={() => navigate('/createplaylist')}
              size="sm"
              _hover={{
                bg: "rgba(229, 62, 62, 0.1)",
                transform: "translateY(-2px)"
              }}
              transition="all 0.2s"
            >
              Create Collection
            </Button>
          </Flex>
          
          {playlists && playlists.length > 0 ? (
            <Flex
              alignItems="stretch"
              overflowX="auto"
              pb={4}
              gap={4}
              className="custom-scrollbar"
              sx={horizontalScrollbarStyle}
            >
              {playlists.slice(0, 8).map(playlist => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  minW="200px"
                  maxW="250px"
                  flexBasis="220px"
                  flexShrink={0}
                />
              ))}
              
              {playlists.length > 8 && (
                <Box
                  p={6}
                  borderRadius="lg"
                  bg="whiteAlpha.100"
                  flexBasis="200px"
                  minW="200px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  flexDirection="column"
                  cursor="pointer"
                  onClick={() => navigate('/profilepage')}
                  transition="all 0.2s"
                  _hover={{
                    bg: "whiteAlpha.200",
                    transform: "translateY(-2px)"
                  }}
                  flexShrink={0}
                >
                  <Heading size="md" mb={2} textAlign="center">View All</Heading>
                  <Text textAlign="center" color="whiteAlpha.800">
                    See all your collections
                  </Text>
                </Box>
              )}
            </Flex>
          ) : (
            <Box 
              p={6} 
              borderRadius="lg" 
              bg="whiteAlpha.100" 
              textAlign="center"
              maxW="container.md"
              mx="auto"
            >
              <Text mb={4} fontSize="lg">
                You haven't created any collections yet
              </Text>
              <Button
                colorScheme="red"
                leftIcon={<FaPlus />}
                onClick={() => navigate('/createplaylist')}
              >
                Create Your First Collection
              </Button>
            </Box>
          )}
        </>
      )}
    </Flex>
  );
};

export default LoggedInHome; 
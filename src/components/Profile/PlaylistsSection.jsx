import React from 'react';
import {
  Box, Flex, Heading, IconButton, Grid, GridItem, Text, Spinner, Center, 
  Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import Playlist from '../Playlist/Playlist';

const PlaylistsSection = ({ playlists = [], isLoading, error, onAddClick }) => {
  // Example playlists with local fallback images instead of external placeholder service
  const examplePlaylists = [
    { 
      id: '1', 
      name: "Workout Mix", 
      bio: "High energy tracks for intense workouts", 
      image: null,
      privacy: 'public' 
    },
    { 
      id: '2', 
      name: "Chill Vibes", 
      bio: "Relaxing music for downtime", 
      image: null,
      privacy: 'public'
    },
    { 
      id: '3', 
      name: "Focus Flow", 
      bio: "Concentration enhancing tracks", 
      image: null,
      privacy: 'private'
    },
    { 
      id: '4', 
      name: "Running Playlist", 
      bio: "Beats to keep you moving", 
      image: null,
      privacy: 'public'
    }
  ];
  
  // Only use example playlists if not loading and no real playlists
  const displayPlaylists = (!isLoading && playlists && playlists.length === 0) ? examplePlaylists : playlists || [];
  
  return (
    <Box mb={10}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h2" size="xl" color="white">
          My Playlists
        </Heading>
        <IconButton
          icon={<AddIcon />}
          colorScheme="purple"
          borderRadius="full"
          aria-label="Create new playlist"
          onClick={onAddClick}
        />
      </Flex>
      
      <Box
        bg="rgba(20, 20, 30, 0.8)"
        borderRadius="lg"
        p={6}
        border="1px solid"
        borderColor="whiteAlpha.200"
      >
        {isLoading ? (
          <Center py={10}>
            <Spinner color="purple.500" size="xl" />
            <Text ml={3} color="gray.300">Loading playlists...</Text>
          </Center>
        ) : error ? (
          <Alert status="error" variant="solid" borderRadius="md">
            <AlertIcon />
            <AlertTitle>Error!</AlertTitle>
            <AlertDescription>Failed to load playlists: {error.message}</AlertDescription>
          </Alert>
        ) : (
          <>
            {displayPlaylists && displayPlaylists.length > 0 ? (
              <Grid 
                templateColumns={{
                  base: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)'
                }}
                gap={4}
                mb={4}
              >
                {displayPlaylists.map(playlist => (
                  <GridItem key={playlist.id}>
                    <Playlist 
                      name={playlist.name}
                      bio={playlist.description || playlist.bio || ''} 
                      image={playlist.coverImage || playlist.image}
                      color={playlist.colorCode}
                      privacy={playlist.privacy}
                    />
                  </GridItem>
                ))}
              </Grid>
            ) : (
              <Center py={10} flexDirection="column">
                <Text color="gray.300" textAlign="center" mb={4}>
                  You haven't created any playlists yet.
                </Text>
                <Button 
                  colorScheme="purple" 
                  leftIcon={<AddIcon />}
                  onClick={onAddClick}
                >
                  Create Your First Playlist
                </Button>
              </Center>
            )}
            
            {!isLoading && playlists && playlists.length === 0 && (
              <Text color="gray.400" fontSize="sm" mt={6} textAlign="center">
                Example playlists shown above. Create your own to get started!
              </Text>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default PlaylistsSection;

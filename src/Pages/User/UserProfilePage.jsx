import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Text,
  Heading,
  Spinner,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import ProfileHeader from '../../components/User/ProfileHeader';
import useUserData from '../../hooks/useUserData';
import useUserStats from '../../hooks/useUserStats';
import useUserTracks from '../../hooks/useUserTracks';
import useUserPlaylists from '../../hooks/useUserPlaylists';
import TracksSection from '../../components/Profile/TracksSection';
import PlaylistsSection from '../../components/Profile/PlaylistsSection';

const UserProfilePage = () => {
  const { userId } = useParams();
  const [currentUser] = useAuthState(auth);
  const { userData: user, loading, error } = useUserData(userId);
  const { stats, loading: statsLoading } = useUserStats(userId);
  const { tracks, isLoading: tracksLoading, error: tracksError } = useUserTracks(userId);
  const { playlists, isLoading: playlistsLoading, error: playlistsError } = useUserPlaylists(userId);
  
  // Add state for follower count that can be updated immediately
  const [followersCount, setFollowersCount] = useState(0);
  
  // Update the followers count when stats are loaded
  useEffect(() => {
    if (stats && !statsLoading) {
      setFollowersCount(stats.followers);
    }
  }, [stats, statsLoading]);
  
  // Handler for follow/unfollow actions
  const handleFollowChange = (change) => {
    setFollowersCount(prev => Math.max(0, prev + change));
  };
  
  // Loading state
  if (loading || statsLoading) {
    return (
      <>
        <NavBar />
        <Flex height="calc(100vh - 80px)" justify="center" align="center">
          <Spinner size="xl" color="red.500" thickness="4px" />
        </Flex>
        <Footer />
      </>
    );
  }
  
  // Error state
  if (error) {
    return (
      <>
        <NavBar />
        <Container maxW="container.lg" py={10}>
          <Box textAlign="center">
            <Heading color="red.500">Error</Heading>
            <Text mt={4}>{error}</Text>
          </Box>
        </Container>
        <Footer />
      </>
    );
  }
  
  // If no user is found
  if (!user) {
    return (
      <>
        <NavBar />
        <Container maxW="container.lg" py={10}>
          <Box textAlign="center">
            <Heading>User Not Found</Heading>
          </Box>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Box bgColor="blackAlpha.900" minH="calc(100vh - 80px)">
        {/* Pass our custom stats with updated follower count */}
        <ProfileHeader 
          user={user} 
          currentUser={currentUser} 
          stats={{
            ...stats,
            followers: followersCount // Use our state-managed count
          }}
          onFollowChange={handleFollowChange} // Add the handler
        />
        
        {/* Rest of the page remains the same */}
        <Container maxW="container.xl" py={10} px={{ base: 4, lg: 8 }}>
          <Tabs colorScheme="red" variant="line">
            <TabList borderBottomColor="whiteAlpha.200">
              <Tab color="gray.300" _selected={{ color: "white", borderColor: "red.500" }}>Samples</Tab>
              <Tab color="gray.300" _selected={{ color: "white", borderColor: "red.500" }}>Playlists</Tab>
              <Tab color="gray.300" _selected={{ color: "white", borderColor: "red.500" }}>Likes</Tab>
            </TabList>
            
            <TabPanels>
              {/* Samples Tab */}
              <TabPanel px={0}>
                <Box
                  bg="rgba(20, 20, 30, 0.8)"
                  borderRadius="lg"
                  p={{ base: 5, md: 8 }}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  {tracksLoading ? (
                    <Flex justify="center" py={10}>
                      <Spinner size="xl" color="red.500" thickness="4px" />
                    </Flex>
                  ) : tracksError ? (
                    <Text color="red.300" textAlign="center">Error loading samples</Text>
                  ) : tracks && tracks.length > 0 ? (
                    <TracksSection 
                      tracks={tracks}
                      isLoading={false}
                      error={null}
                      showHeader={false}
                    />
                  ) : (
                    <Text color="gray.400" textAlign="center">No samples yet</Text>
                  )}
                </Box>
              </TabPanel>
              
              {/* Playlists Tab */}
              <TabPanel px={0}>
                <Box
                  bg="rgba(20, 20, 30, 0.8)"
                  borderRadius="lg"
                  p={{ base: 5, md: 8 }}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  {playlistsLoading ? (
                    <Flex justify="center" py={10}>
                      <Spinner size="xl" color="red.500" thickness="4px" />
                    </Flex>
                  ) : playlistsError ? (
                    <Text color="red.300" textAlign="center">Error loading playlists</Text>
                  ) : playlists && playlists.length > 0 ? (
                    <PlaylistsSection 
                      playlists={playlists}
                      isLoading={false}
                      error={null}
                      onAddClick={null}
                      showHeader={false}
                    />
                  ) : (
                    <Text color="gray.400" textAlign="center">No playlists yet</Text>
                  )}
                </Box>
              </TabPanel>
              
              {/* Likes Tab */}
              <TabPanel px={0}>
                <Box
                  bg="rgba(20, 20, 30, 0.8)"
                  borderRadius="lg"
                  p={{ base: 5, md: 8 }}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  <Text color="gray.400" textAlign="center">No likes yet</Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default UserProfilePage;

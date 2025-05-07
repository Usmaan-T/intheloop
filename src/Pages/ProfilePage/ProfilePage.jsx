import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Text,
  useDisclosure,
  Divider,
  useToast,
  Flex,
  Heading,
  Avatar,
  VStack,
  Button,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Spinner
} from '@chakra-ui/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import CreatePlaylist from '../../components/Playlist/CreatePlaylist';
import EditProfileModal from '../../components/Profile/EditProfileModal';
import PlaylistsSection from '../../components/Profile/PlaylistsSection';
import TracksSection from '../../components/Profile/TracksSection';
import ProfileHeader from '../../components/User/ProfileHeader';
import StreakDisplay from '../../components/Profile/StreakDisplay';
import useProfileData from '../../hooks/useProfileData';
import useUserTracks from '../../hooks/useUserTracks';
import useUserPlaylists from '../../hooks/useUserPlaylists';
import useUserPopularity from '../../hooks/useUserPopularity';
import useUserLikes from '../../hooks/useUserLikes';
import useUserStreak from '../../hooks/useUserStreak';

const ProfilePage = () => {
  // Auth state
  const [user, userLoading] = useAuthState(auth);
  
  // Custom hooks
  const { profileData, isLoading: profileLoading, isUpdating, updateProfileData } = useProfileData(user);
  const { tracks, isLoading: tracksLoading, error: tracksError } = useUserTracks(user?.uid);
  
  // Add streaks hook
  const { streakData, loading: streakLoading, resetDailyStreak } = useUserStreak(user?.uid);
  
  // Add a refreshTrigger state to force refresh after playlist creation
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { playlists, isLoading: playlistsLoading, error: playlistsError } = useUserPlaylists(user?.uid, refreshTrigger);
  
  // Add popularity score hook to match UserProfilePage
  const { popularityScore } = useUserPopularity(user?.uid);
  
  // Add liked samples hook
  const { likedSamples, isLoading: likesLoading, error: likesError } = useUserLikes(user?.uid);
  
  // Disclosure hooks
  const profileDisclosure = useDisclosure();
  const playlistDisclosure = useDisclosure();
  
  // Add toast notification for playlist creation success
  const toast = useToast();
  
  // Create a stats object to match UserProfilePage
  const [userStats, setUserStats] = useState({
    samples: 0,
    playlists: 0,
    followers: 0
  });
  
  // Update stats when data changes
  useEffect(() => {
    if (user && profileData) {
      setUserStats({
        samples: tracks?.length || 0,
        playlists: playlists?.length || 0,
        followers: profileData?.followers?.length || 0,
        likes: likedSamples?.length || 0
      });
    }
  }, [user, profileData, tracks, playlists, likedSamples]);
  
  // Reset streak flag when component mounts
  useEffect(() => {
    if (user?.uid) {
      resetDailyStreak();
    }
  }, [user, resetDailyStreak]);
  
  // Handlers
  const handleEditClick = () => {
    profileDisclosure.onOpen();
  };
  
  const handleSaveProfile = async (updates, imageFile) => {
    const success = await updateProfileData(updates, imageFile);
    if (success) {
      profileDisclosure.onClose();
    }
  };

  // Create a handler for playlist creation success
  const handlePlaylistCreated = () => {
    setRefreshTrigger(prev => prev + 1); // Increment to trigger rerender
    playlistDisclosure.onClose();
    
    toast({
      title: "Playlist Created",
      description: "Your new playlist has been created successfully!",
      status: "success",
      duration: 5000,
      isClosable: true,
      position: "top"
    });
  };
  
  if (userLoading || profileLoading) {
    return (
      <>
        <NavBar />
        <Flex height="calc(100vh - 80px)" justify="center" align="center">
          <Spinner size="xl" color="red.500" thickness="4px" />
        </Flex>
      </>
    );
  }
  
  if (!user) {
    return (
      <>
        <NavBar />
        <Container maxW="container.lg" py={10}>
          <Box textAlign="center">
            <Heading>Please log in to view your profile</Heading>
          </Box>
        </Container>
        <Footer />
      </>
    );
  }

  // Create a user object that matches the expected structure for ProfileHeader
  const userProfileData = {
    id: user.uid,
    ...profileData,
    displayName: user.displayName,
    photoURL: profileData?.photoURL || user.photoURL
  };

  return (
    <>
      <NavBar />
      <Box 
        bgColor={'blackAlpha.900'} 
        minH="100vh" 
        backgroundSize="cover"
        position="relative"
        py={8}
        overflow="hidden"
        backgroundImage="radial-gradient(circle at 10% 10%, rgba(54, 16, 74, 0.2) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(90, 16, 54, 0.2) 0%, transparent 40%)"
      >
        {/* Decorative elements */}
        <Box
          position="absolute"
          top="-200px"
          left="-200px"
          width="500px"
          height="500px"
          bg="purple.900"
          filter="blur(120px)"
          opacity="0.1"
          borderRadius="full"
          zIndex="0"
        />
        
        <Box
          position="absolute"
          bottom="-100px"
          right="-200px"
          width="400px"
          height="400px"
          bg="red.900"
          filter="blur(100px)"
          opacity="0.08"
          borderRadius="full"
          zIndex="0"
        />
        
        <Container maxW="container.xl" px={{ base: 4, md: 6, lg: 8 }} position="relative" zIndex="1">
          {/* Profile Header */}
          <Box mb={8}>
            <ProfileHeader 
              user={userProfileData}
              stats={userStats}
              showFollowButton={false}
              currentUser={user}
              popularityScore={popularityScore}
              onEditClick={handleEditClick}
              loading={profileLoading || userLoading}
            />
          </Box>
          
          {/* Streak Display */}
          <Box mb={8}>
            <StreakDisplay 
              streakData={streakData}
              isLoading={streakLoading}
            />
          </Box>
          
          {/* Tabs Content */}
          <Box>
            <Tabs variant="soft-rounded" colorScheme="purple">
              <TabList borderBottom="1px solid" borderColor="whiteAlpha.200" pb={4} mb={6}>
                <Tab 
                  color="gray.300" 
                  _selected={{ color: "white", bg: "purple.500" }}
                  py={3}
                  px={6}
                  mr={2}
                >
                  Samples
                </Tab>
                <Tab 
                  color="gray.300" 
                  _selected={{ color: "white", bg: "purple.500" }}
                  py={3}
                  px={6}
                  mr={2}
                >
                  Playlists
                </Tab>
                <Tab 
                  color="gray.300" 
                  _selected={{ color: "white", bg: "purple.500" }}
                  py={3}
                  px={6}
                >
                  Liked
                </Tab>
              </TabList>
              
              <TabPanels>
                {/* Samples Tab */}
                <TabPanel px={0}>
                  <Flex justify="flex-end" mb={6}>
                    <Button 
                      as="a" 
                      href="/upload" 
                      colorScheme="purple" 
                      size="md"
                      px={6}
                      py={5}
                      borderRadius="md"
                      _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                      transition="all 0.2s"
                    >
                      Upload Sample
                    </Button>
                  </Flex>
                  
                  <Box
                    bg="rgba(20, 20, 30, 0.8)"
                    borderRadius="xl"
                    p={{ base: 6, md: 8 }}
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
                    position="relative"
                    overflow="hidden"
                  >
                    {/* Add decorative elements */}
                    <Box
                      position="absolute"
                      top="-100px"
                      right="-80px"
                      width="200px"
                      height="200px"
                      bg="purple.900"
                      opacity="0.1"
                      borderRadius="full"
                      zIndex="0"
                    />
                    
                    <Box position="relative" zIndex="1">
                      {tracksLoading ? (
                        <Flex justify="center" py={10}>
                          <Spinner size="xl" color="purple.500" thickness="4px" />
                        </Flex>
                      ) : tracksError ? (
                        <Text color="red.300" textAlign="center" fontSize="lg">
                          Error loading your samples
                        </Text>
                      ) : tracks && tracks.length > 0 ? (
                        <TracksSection 
                          tracks={tracks}
                          isLoading={false}
                          error={null}
                          showHeader={false}
                        />
                      ) : (
                        <Flex 
                          direction="column" 
                          align="center" 
                          justify="center" 
                          py={10}
                          textAlign="center"
                        >
                          <Text color="gray.400" fontSize="lg" mb={4}>
                            No samples uploaded yet
                          </Text>
                          <Text color="gray.600" maxW="400px">
                            Start uploading your samples to build your streak and share your sounds with the world.
                          </Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                </TabPanel>
                
                {/* Playlists Tab */}
                <TabPanel px={0}>
                  <Flex justify="flex-end" mb={6}>
                    <Button 
                      onClick={playlistDisclosure.onOpen} 
                      colorScheme="purple" 
                      size="md"
                      px={6}
                      py={5}
                      borderRadius="md"
                      _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
                      transition="all 0.2s"
                    >
                      Create Playlist
                    </Button>
                  </Flex>
                  
                  <Box
                    bg="rgba(20, 20, 30, 0.8)"
                    borderRadius="xl"
                    p={{ base: 6, md: 8 }}
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
                    position="relative"
                    overflow="hidden"
                  >
                    {/* Add decorative elements */}
                    <Box
                      position="absolute"
                      bottom="-100px"
                      left="-80px"
                      width="200px"
                      height="200px"
                      bg="green.900"
                      opacity="0.1"
                      borderRadius="full"
                      zIndex="0"
                    />
                    
                    <Box position="relative" zIndex="1">
                      {playlistsLoading ? (
                        <Flex justify="center" py={10}>
                          <Spinner size="xl" color="purple.500" thickness="4px" />
                        </Flex>
                      ) : playlistsError ? (
                        <Text color="red.300" textAlign="center" fontSize="lg">
                          Error loading your playlists
                        </Text>
                      ) : playlists && playlists.length > 0 ? (
                        <PlaylistsSection 
                          playlists={playlists}
                          isLoading={false}
                          error={null}
                          onAddClick={null}
                          showHeader={false}
                        />
                      ) : (
                        <Flex 
                          direction="column" 
                          align="center" 
                          justify="center" 
                          py={10}
                          textAlign="center"
                        >
                          <Text color="gray.400" fontSize="lg" mb={4}>
                            No playlists yet
                          </Text>
                          <Text color="gray.600" maxW="400px">
                            Create your first playlist to organize your favorite samples and share them with others.
                          </Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                </TabPanel>
                
                {/* Likes Tab */}
                <TabPanel px={0}>
                  <Box
                    bg="rgba(20, 20, 30, 0.8)"
                    borderRadius="xl"
                    p={{ base: 6, md: 8 }}
                    border="1px solid"
                    borderColor="whiteAlpha.300"
                    boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
                    position="relative"
                    overflow="hidden"
                    minH="300px"
                  >
                    {/* Add decorative elements */}
                    <Box
                      position="absolute"
                      top="-80px"
                      right="-60px"
                      width="180px"
                      height="180px"
                      bg="red.900"
                      opacity="0.1"
                      borderRadius="full"
                      zIndex="0"
                    />
                    
                    <Box position="relative" zIndex="1">
                      {likesLoading ? (
                        <Flex justify="center" py={10}>
                          <Spinner size="xl" color="purple.500" thickness="4px" />
                        </Flex>
                      ) : likesError ? (
                        <Text color="red.300" textAlign="center" fontSize="lg">
                          Error loading your liked samples
                        </Text>
                      ) : likedSamples && likedSamples.length > 0 ? (
                        <TracksSection 
                          tracks={likedSamples}
                          isLoading={false}
                          error={null}
                          showHeader={false}
                        />
                      ) : (
                        <Flex 
                          direction="column" 
                          align="center" 
                          justify="center" 
                          py={10}
                          textAlign="center"
                        >
                          <Text color="gray.400" fontSize="lg" mb={4}>
                            No liked samples yet
                          </Text>
                          <Text color="gray.600" maxW="400px">
                            Explore and like samples to build your collection of favorites.
                          </Text>
                        </Flex>
                      )}
                    </Box>
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Container>
        
        {/* Edit Profile Modal */}
        <EditProfileModal 
          isOpen={profileDisclosure.isOpen}
          onClose={profileDisclosure.onClose}
          initialData={profileData}
          user={user}
          onSave={handleSaveProfile}
          isUpdating={isUpdating}
        />
        
        {/* Create Playlist Modal */}
        <CreatePlaylist 
          isOpen={playlistDisclosure.isOpen}
          onClose={playlistDisclosure.onClose}
          onSuccess={handlePlaylistCreated}
        />
      </Box>
      <Footer />
    </>
  );
};

export default ProfilePage;
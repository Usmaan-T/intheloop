import React, { useState } from 'react';
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
import CreatePlaylist from '../../components/playlist/CreatePlaylist';
import EditProfileModal from '../../components/Profile/EditProfileModal';
import PlaylistsSection from '../../components/Profile/PlaylistsSection';
import TracksSection from '../../components/Profile/TracksSection';
import useProfileData from '../../hooks/useProfileData';
import useUserTracks from '../../hooks/useUserTracks';
import useUserPlaylists from '../../hooks/useUserPlaylists';

const ProfilePage = () => {
  // Auth state
  const [user, userLoading] = useAuthState(auth);
  
  // Custom hooks
  const { profileData, isLoading: profileLoading, isUpdating, updateProfileData } = useProfileData(user);
  const { tracks, isLoading: tracksLoading, error: tracksError } = useUserTracks(user?.uid);
  
  // Add a refreshTrigger state to force refresh after playlist creation
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { playlists, isLoading: playlistsLoading, error: playlistsError } = useUserPlaylists(user?.uid, refreshTrigger);
  
  // Disclosure hooks
  const profileDisclosure = useDisclosure();
  const playlistDisclosure = useDisclosure();
  
  // Add toast notification for playlist creation success
  const toast = useToast();
  
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

  return (
    <>
      <NavBar />
      <Box bgColor="blackAlpha.900" minH="calc(100vh - 80px)">
        {/* Profile Header - Styled like UserProfilePage */}
        <Box bg="rgba(20, 20, 30, 0.8)" py={10} borderBottom="1px solid" borderColor="whiteAlpha.200">
          <Container maxW="container.xl" px={{ base: 4, lg: 8 }}>
            <Flex 
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'center', md: 'flex-start' }}
              gap={8}
            >
              <Avatar 
                size="2xl" 
                name={profileData?.username || user.displayName}
                src={profileData?.photoURL || user.photoURL}
                border="4px solid"
                borderColor="whiteAlpha.300"
              />
              
              <Box flex="1">
                <Heading color="white" size="xl">
                  {profileData?.username || user.displayName || 'Your Profile'}
                </Heading>
                
                {profileData?.bio && (
                  <Text mt={2} color="gray.300">
                    {profileData.bio}
                  </Text>
                )}
                
                <HStack mt={4} spacing={4}>
                  <Text color="gray.400">
                    <Text as="span" fontWeight="bold" color="white">
                      {tracks?.length || 0}
                    </Text> Samples
                  </Text>
                  <Text color="gray.400">
                    <Text as="span" fontWeight="bold" color="white">
                      {playlists?.length || 0}
                    </Text> Playlists
                  </Text>
                </HStack>
                
                <Button mt={4} colorScheme="red" size="md" onClick={handleEditClick}>
                  Edit Profile
                </Button>
              </Box>
            </Flex>
          </Container>
        </Box>
        
        {/* Profile Content - Using Tabs like UserProfilePage */}
        <Container maxW="container.xl" py={10} px={{ base: 4, lg: 8 }}>
          <Tabs colorScheme="red" variant="line">
            <TabList borderBottomColor="whiteAlpha.200">
              <Tab color="gray.300" _selected={{ color: "white", borderColor: "red.500" }}>Samples</Tab>
              <Tab color="gray.300" _selected={{ color: "white", borderColor: "red.500" }}>Playlists</Tab>
              <Tab color="gray.300" _selected={{ color: "white", borderColor: "red.500" }}>Likes</Tab>
            </TabList>
            
            <TabPanels>
              {/* Samples Tab - Now First */}
              <TabPanel px={0}>
                <Box mb={6}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading as="h2" size="md" color="white">
                      Your Samples
                    </Heading>
                    <Button 
                      as="a" 
                      href="/upload" 
                      colorScheme="red" 
                      size="sm"
                    >
                      Upload Sample
                    </Button>
                  </Flex>
                  
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
                      <Text color="red.300" textAlign="center">Error loading your samples</Text>
                    ) : tracks && tracks.length > 0 ? (
                      <TracksSection 
                        tracks={tracks}
                        isLoading={false}
                        error={null}
                        showHeader={false}
                      />
                    ) : (
                      <Text color="gray.400" textAlign="center">No samples uploaded yet</Text>
                    )}
                  </Box>
                </Box>
              </TabPanel>
              
              {/* Playlists Tab - Now Second */}
              <TabPanel px={0}>
                <Box mb={6}>
                  <Flex justify="space-between" align="center" mb={4}>
                    <Heading as="h2" size="md" color="white">
                      Your Playlists
                    </Heading>
                    <Button 
                      onClick={playlistDisclosure.onOpen} 
                      colorScheme="red" 
                      size="sm"
                    >
                      Create Playlist
                    </Button>
                  </Flex>
                  
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
                      <Text color="red.300" textAlign="center">Error loading your playlists</Text>
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
                  <Text color="gray.400" textAlign="center">Liked content will appear here</Text>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Container>
      </Box>

      {/* Edit Profile Modal - Keep existing functionality */}
      <EditProfileModal
        isOpen={profileDisclosure.isOpen}
        onClose={profileDisclosure.onClose}
        initialData={profileData}
        user={user}
        onSave={handleSaveProfile}
        isUpdating={isUpdating}
      />
      
      {/* Create Playlist Modal - Keep existing functionality */}
      <CreatePlaylist 
        isOpen={playlistDisclosure.isOpen} 
        onClose={playlistDisclosure.onClose}
        onSuccess={handlePlaylistCreated}
      />
      
      <Footer />
    </>
  );
};

export default ProfilePage;
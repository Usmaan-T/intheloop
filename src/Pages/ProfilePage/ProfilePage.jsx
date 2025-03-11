import React, { useState } from 'react';
import {
  Box, Container, Text, useDisclosure, Divider, useToast
} from '@chakra-ui/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import NavBar from '../../components/Navbar/NavBar';
import CreatePlaylist from '../../components/playlist/CreatePlaylist';
import ProfileHeader from '../../components/Profile/ProfileHeader';
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
    
    // Show success toast
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
    return <Text>Loading user data...</Text>;
  }
  
  if (!user) {
    return (
      <Container maxW="container.md" py={10}>
        <Text>Please log in to view your profile.</Text>
      </Container>
    );
  }

  return (
    <>
      <NavBar />
      <Box bgColor={'blackAlpha.900'} minH="100vh" py={10}>
        <Container maxW="container.xl" py={10}>
          {/* Profile Header Section */}
          <ProfileHeader 
            profileData={profileData} 
            user={user} 
            onEditClick={handleEditClick} 
          />

          {/* Playlists Section */}
          <PlaylistsSection 
            playlists={playlists}
            isLoading={playlistsLoading}
            error={playlistsError}
            onAddClick={playlistDisclosure.onOpen}
          />

          <Divider my={8} borderColor="whiteAlpha.300" />
          
          {/* Tracks Section */}
          <TracksSection 
            tracks={tracks} 
            isLoading={tracksLoading} 
            error={tracksError}
          />
        </Container>
      </Box>

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
    </>
  );
};

export default ProfilePage;
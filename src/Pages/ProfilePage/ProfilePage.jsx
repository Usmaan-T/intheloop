import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  useColorModeValue,
  Flex,
  Avatar,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useDisclosure,
  VStack,
  HStack,
  useToast,
  IconButton,
  Divider,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, doc, updateDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, auth, storage } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { updateProfile } from 'firebase/auth';
import SampleRow from '../../components/Samples/SampleRow';
import NavBar from '../../components/Navbar/NavBar';
import CreatePlaylist from '../../components/playlist/CreatePlaylist';
import Playlist from '../../components/Playlist/Playlist';

const ProfilePage = () => {
  // 1. AUTH STATE
  const [user, userLoading] = useAuthState(auth);
  
  // 2. DISCLOSURE HOOKS
  // Profile edit modal
  const profileDisclosure = useDisclosure();
  // Playlist creation modal
  const playlistDisclosure = useDisclosure();
  
  // 3. STATE HOOKS
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [profileData, setProfileData] = useState(null);
  
  // 4. REFS
  const fileInputRef = useRef(null);
  
  // 5. CONTEXT/UTILITIES
  const toast = useToast();
  
  // 6. EFFECTS
  useEffect(() => {
    const fetchProfileData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));
          if (userDoc.exists()) {
            setProfileData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      }
    };
    
    fetchProfileData();
  }, [user]);
  
  // 7. HANDLERS (outside of render)
  const handleEditClick = () => {
    if (profileData) {
      setUsername(profileData.username || '');
      setBio(profileData.bio || '');
    }
    profileDisclosure.onOpen();
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSaveProfile = async () => {
    // ...existing profile save logic...
    if (!user) return;
    
    setIsUpdating(true);
    try {
      // Prepare update object
      const updates = {};
      
      // Handle username update
      if (username && (!profileData?.username || username !== profileData.username)) {
        updates.username = username;
      }
      
      // Handle bio update
      if (bio !== profileData?.bio) {
        updates.bio = bio;
      }
      
      // Handle profile image upload
      if (imageFile) {
        const storageRef = ref(storage, `profileImages/${user.uid}`);
        await uploadBytes(storageRef, imageFile);
        const photoURL = await getDownloadURL(storageRef);
        
        // Update both photoURL fields to ensure consistency
        updates.photoURL = photoURL;
        updates.profilePicURL = photoURL;
        
        // Update Firebase Auth profile
        await updateProfile(user, { 
          displayName: username || user.displayName,
          photoURL: photoURL
        });
        
        console.log("Updated photo URL:", photoURL);
      } else if (username && username !== user.displayName) {
        // Update display name in Firebase Auth if only that changed
        await updateProfile(user, { displayName: username });
      }
      
      // Update user document if there are changes
      if (Object.keys(updates).length > 0) {
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, updates);
        
        // Update local state
        setProfileData(prev => ({
          ...prev,
          ...updates
        }));
        
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
      
      // Reset state and close modal
      setImageFile(null);
      profileDisclosure.onClose();
      
      // Force page refresh to show updated profile
      window.location.reload();
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Error updating profile',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // FETCH TRACKS - IMPORTANT: Move this query inside effect 
  // instead of conditionally inside render
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [tracksError, setTracksError] = useState(null);
  
  useEffect(() => {
    if (user) {
      setTracksLoading(true);
      const tracksQuery = query(
        collection(firestore, 'posts'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(
        tracksQuery,
        (snapshot) => {
          const trackData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setTracks(trackData);
          setTracksLoading(false);
        },
        (error) => {
          console.error("Error fetching tracks:", error);
          setTracksError(error);
          setTracksLoading(false);
        }
      );
      
      return () => unsubscribe();
    }
  }, [user]);
  
  // Now we render conditionally using state, not hooks
  if (userLoading) {
    return <Text>Loading user data...</Text>;
  }
  
  if (!user) {
    return (
      <Container maxW="container.md" py={10}>
        <Heading as="h2" size="xl" mb={6}>
          My Tracks
        </Heading>
        <Text>Please log in to view your tracks.</Text>
      </Container>
    );
  }

  return (
    <>
      <NavBar />
      <Box bgColor={'blackAlpha.900'} minH="100vh" py={10}>
        <Container maxW="container.xl" py={10}>
          {/* Profile Header Section */}
          <Box 
            bg="rgba(20, 20, 30, 0.8)"
            backdropFilter="blur(10px)"
            borderRadius="lg"
            p={6}
            mb={8}
            border="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Flex 
              direction={{ base: "column", md: "row" }}
              align="center"
            >
              {/* Profile Image */}
              <Box 
                position="relative" 
                mr={{ base: 0, md: 6 }} 
                mb={{ base: 4, md: 0 }}
                onClick={handleEditClick}
                cursor="pointer"
              >
                
                <Avatar 
                  size="xl" 
                  src={profileData?.photoURL || user?.photoURL} 
                  name={profileData?.username || user?.displayName || user?.email?.charAt(0)}
                  bg="purple.500"
                  boxShadow="lg"
                />
                {/* Hover overlay */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  borderRadius="full"
                  bg="blackAlpha.600"
                  opacity={0}
                  transition="all 0.3s"
                  _hover={{ opacity: 0.7 }}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text fontSize="xs" color="white" fontWeight="bold">
                    Edit
                  </Text>
                </Box>
              </Box>
              
              {/* User Info */}
              <VStack align={{ base: "center", md: "flex-start" }} spacing={1}>
                <Heading as="h3" size="md" color="white">
                  {profileData?.username || user?.displayName || 'User'}
                </Heading>
                <Text color="gray.400" fontSize="sm">
                  {user?.email}
                </Text>
                {profileData?.bio && (
                  <Text color="gray.300" fontSize="sm" mt={1} maxW="400px">
                    {profileData.bio}
                  </Text>
                )}
                <Button 
                  onClick={handleEditClick}
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  mt={2}
                >
                  Edit Profile
                </Button>
              </VStack>
            </Flex>
          </Box>

          {/* Playlists Section */}
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
                onClick={playlistDisclosure.onOpen}
              />
            </Flex>
            
            <Box
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="lg"
              p={6}
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              {/* Grid layout for playlists */}
              <Grid 
                templateColumns={{
                  base: '1fr',              // 1 column on mobile
                  sm: 'repeat(2, 1fr)',     // 2 columns on small screens
                  md: 'repeat(3, 1fr)',     // 3 columns on medium screens
                  lg: 'repeat(4, 1fr)'      // 4 columns on large screens
                }}
                gap={4}
                mb={4}
              >
                {/* Example playlists - you can make this dynamic later */}
                <GridItem>
                  <Playlist 
                    name="Workout Mix" 
                    bio="High energy tracks for intense workouts" 
                    image="/playlist1.png" 
                  />
                </GridItem>
                <GridItem>
                  <Playlist 
                    name="Chill Vibes" 
                    bio="Relaxing music for downtime" 
                    image="https://via.placeholder.com/300?text=Chill" 
                  />
                </GridItem>
                <GridItem>
                  <Playlist 
                    name="Focus Flow" 
                    bio="Concentration enhancing tracks" 
                    image="https://via.placeholder.com/300?text=Focus" 
                  />
                </GridItem>
                <GridItem>
                  <Playlist 
                    name="Running Playlist" 
                    bio="Beats to keep you moving" 
                    image="https://via.placeholder.com/300?text=Running" 
                  />
                </GridItem>
              </Grid>
              
              {/* Message for when no playlists exist - you can conditionally show this */}
              {/* {playlists.length === 0 && (
                <Text color="gray.300">
                  Your playlists will appear here. Click the + button to create a new playlist.
                </Text>
              )} */}
            </Box>
          </Box>

          <Divider my={8} borderColor="whiteAlpha.300" />
          
          {/* Tracks Section */}
          <Heading as="h2" size="xl" mb={6} color={'white'}>
            Most Recent Samples
          </Heading>
          {tracksLoading ? (
            <Text>Loading tracks...</Text>
          ) : tracksError ? (
            <Text>Error: {tracksError.message}</Text>
          ) : tracks.length === 0 ? (
            <Text color="gray.300">You haven't uploaded any tracks yet.</Text>
          ) : (
            <Box
              bg={useColorModeValue('gray.800', 'gray.700')}
              p={4}
              borderRadius="lg"
              boxShadow="md"
            >
              {tracks.map(track => (
                <SampleRow key={track.id} track={track} />
              ))}
            </Box>
          )}
        </Container>
      </Box>

      {/* Edit Profile Modal */}
      <Modal isOpen={profileDisclosure.isOpen} onClose={profileDisclosure.onClose}>
        <ModalOverlay backdropFilter="blur(3px)" />
        <ModalContent bg="gray.900" color="white">
          <ModalHeader>Edit Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              {/* Profile Image Uploader */}
              <Flex direction="column" align="center" w="full">
                <Avatar 
                  size="xl" 
                  mb={4}
                  src={imageFile ? URL.createObjectURL(imageFile) : (profileData?.photoURL || user?.photoURL)}
                  name={username || user?.email?.charAt(0)}
                />
                <Button 
                  size="sm" 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  colorScheme="purple"
                >
                  Choose Image
                </Button>
                <Input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  display="none"
                  onChange={handleFileChange}
                />
              </Flex>
              
              {/* Username Input */}
              <FormControl>
                <FormLabel>Username</FormLabel>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  bg="whiteAlpha.100"
                />
              </FormControl>
              
              {/* Bio Input */}
              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Enter your bio"
                  bg="whiteAlpha.100"
                />
              </FormControl>
              
              {/* Submit Button */}
              <HStack justifyContent="flex-end" w="full" pt={2}>
                <Button variant="outline" mr={3} onClick={profileDisclosure.onClose}>
                  Cancel
                </Button>
                <Button 
                  colorScheme="purple" 
                  onClick={handleSaveProfile}
                  isLoading={isUpdating}
                >
                  Save
                </Button>
              </HStack>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
      
      {/* Create Playlist Modal */}
      <CreatePlaylist 
        isOpen={playlistDisclosure.isOpen} 
        onClose={playlistDisclosure.onClose}
      />
    </>
  );
};

export default ProfilePage;
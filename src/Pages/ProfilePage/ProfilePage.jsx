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
} from '@chakra-ui/react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, auth, storage } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { updateProfile } from 'firebase/auth';
import SampleRow from '../../components/Samples/SampleRow';
import NavBar from '../../components/Navbar/NavBar';

const ProfilePage = () => {
  const [user, userLoading] = useAuthState(auth);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();
  const [profileData, setProfileData] = useState(null);
  
  // Fetch user profile data from Firestore
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

  // Open modal and initialize form with current values
  const handleEditClick = () => {
    if (profileData) {
      setUsername(profileData.username || '');
      setBio(profileData.bio || '');
    }
    onOpen();
  };

  // Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  // Upload profile changes
  const handleSaveProfile = async () => {
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
      onClose();
      
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

  // Query tracks (posts) where userId equals the current user's UID, ordering by creation time.
  const tracksQuery = query(
    collection(firestore, 'posts'),
    where('userId', '==', user.uid),
    orderBy('createdAt', 'desc')
  );

  const [tracksSnapshot, loading, error] = useCollection(tracksQuery);

  if (loading) return <Text>Loading tracks...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  const tracks = tracksSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

          {/* Tracks Section - Existing content */}
          <Heading as="h2" size="xl" mb={6} color={'white'}>
            Most Recent Samples
          </Heading>
          {tracks.length === 0 ? (
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
      <Modal isOpen={isOpen} onClose={onClose}>
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
                <Button variant="outline" mr={3} onClick={onClose}>
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
    </>
  );
};

export default ProfilePage;
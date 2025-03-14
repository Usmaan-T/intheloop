import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Flex,
  Text,
  Heading,
  Avatar,
  VStack,
  Button,
  Spinner,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Divider,
} from '@chakra-ui/react';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import { doc, getDoc } from 'firebase/firestore';
import { firestore, auth } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

const UserProfilePage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser] = useAuthState(auth);
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(firestore, 'users', userId));
        
        if (!userDoc.exists()) {
          setError('User not found');
          return;
        }
        
        setUser({
          id: userDoc.id,
          ...userDoc.data()
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      fetchUserData();
    }
  }, [userId]);
  
  // Loading state
  if (loading) {
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
        {/* Profile Header */}
        <Box bg="rgba(20, 20, 30, 0.8)" py={10} borderBottom="1px solid" borderColor="whiteAlpha.200">
          <Container maxW="container.xl" px={{ base: 4, lg: 8 }}>
            <Flex 
              direction={{ base: 'column', md: 'row' }}
              align={{ base: 'center', md: 'flex-start' }}
              gap={8}
            >
              <Avatar 
                size="2xl" 
                name={user.username || user.displayName}
                src={user.photoURL}
                border="4px solid"
                borderColor="whiteAlpha.300"
              />
              
              <Box flex="1">
                <Heading color="white" size="xl">
                  {user.username || user.displayName || 'User'}
                </Heading>
                
                {user.bio && (
                  <Text mt={2} color="gray.300">
                    {user.bio}
                  </Text>
                )}
                
                <HStack mt={4} spacing={4}>
                  <Text color="gray.400">
                    <Text as="span" fontWeight="bold" color="white">0</Text> Samples
                  </Text>
                  <Text color="gray.400">
                    <Text as="span" fontWeight="bold" color="white">0</Text> Playlists
                  </Text>
                  <Text color="gray.400">
                    <Text as="span" fontWeight="bold" color="white">0</Text> Followers
                  </Text>
                </HStack>
                
                {currentUser && currentUser.uid !== user.id && (
                  <Button mt={4} colorScheme="red" size="md">
                    Follow
                  </Button>
                )}
              </Box>
            </Flex>
          </Container>
        </Box>
        
        {/* Profile Content */}
        <Container maxW="container.xl" py={10} px={{ base: 4, lg: 8 }}>
          <Tabs colorScheme="red" variant="line">
            <TabList borderBottomColor="whiteAlpha.200">
              <Tab color="gray.300" _selected={{ color: "white", borderColor: "red.500" }}>Samples</Tab>
              <Tab color="gray.300" _selected={{ color: "white", borderColor: "red.500" }}>Playlists</Tab>
              <Tab color="gray.300" _selected={{ color: "white", borderColor: "red.500" }}>Likes</Tab>
            </TabList>
            
            <TabPanels>
              <TabPanel>
                <Box
                  bg="rgba(20, 20, 30, 0.8)"
                  borderRadius="lg"
                  p={{ base: 5, md: 8 }}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  <Box textAlign="center" py={10}>
                    <Text color="gray.400">No samples yet</Text>
                  </Box>
                </Box>
              </TabPanel>
              
              <TabPanel>
                <Box
                  bg="rgba(20, 20, 30, 0.8)"
                  borderRadius="lg"
                  p={{ base: 5, md: 8 }}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  <Box textAlign="center" py={10}>
                    <Text color="gray.400">No playlists yet</Text>
                  </Box>
                </Box>
              </TabPanel>
              
              <TabPanel>
                <Box
                  bg="rgba(20, 20, 30, 0.8)"
                  borderRadius="lg"
                  p={{ base: 5, md: 8 }}
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  <Box textAlign="center" py={10}>
                    <Text color="gray.400">No likes yet</Text>
                  </Box>
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

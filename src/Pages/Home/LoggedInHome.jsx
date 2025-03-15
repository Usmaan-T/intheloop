import React from 'react';
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  Flex, 
  SimpleGrid, 
  Button, 
  HStack,
  Spinner,
  Divider,
  VStack
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FaCompass, FaFire, FaChevronRight } from 'react-icons/fa';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import Playlist from '../../components/Playlist/Playlist';
import SampleRow from '../../components/Samples/SampleRow';
import { usePopularSamples } from '../../hooks/usePopularSamples';
import { usePublicPlaylists } from '../../hooks/usePublicPlaylists';

const LoggedInHome = () => {
  // Get popular playlists
  const { 
    playlists, 
    loading: playlistsLoading, 
    error: playlistsError 
  } = usePublicPlaylists(6); // Limit to 6 playlists

  // Get popular samples sorted by likes
  const { 
    samples: popularSamples, 
    loading: samplesLoading, 
    error: samplesError 
  } = usePopularSamples(5); // Limit to top 5 samples by likes

  return (
    <>
      <NavBar />
      
      {/* Main Content - Using dark theme consistent with ProfilePage */}
      <Box bgColor={'blackAlpha.900'} minH="100vh">
        {/* Hero Section - Updated to match site styling */}
        <Box 
          bgGradient="linear(to-r, red.900, #6F0A14, red.900)"  
          color="white"
          py={16}
          px={4}
          textAlign="center"
          borderBottom="1px solid"
          borderColor="whiteAlpha.200"
        >
          <Container maxW="container.xl">
            <Heading as="h1" size="2xl" mb={6} color="white">
              Welcome to the Loop
            </Heading>
            <Text fontSize="xl" maxW="container.md" mx="auto" mb={8} color="gray.300">
              Discover trending samples, explore playlists from the community, and get inspired.
            </Text>
          </Container>
        </Box>
        
        {/* Main Content Sections */}
        <Container maxW="container.xl" py={10}>
          {/* Explore User Playlists Section */}
          <Box mb={10}>
            <Flex alignItems="center" justifyContent="space-between" mb={6}>
              <HStack spacing={3}>
                <FaCompass size={24} color="#9F7AEA" /> {/* Purple color */}
                <Heading as="h2" size="lg" color="white">
                  Explore User Playlists
                </Heading>
              </HStack>
              
              <Button 
                as={Link}
                to="/playlists"
                variant="outline"
                colorScheme="purple"
                rightIcon={<FaChevronRight />}
              >
                View All
              </Button>
            </Flex>
            
            <Box
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="lg"
              p={6}
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              {playlistsLoading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="purple.500" thickness="4px" />
                </Flex>
              ) : playlistsError ? (
                <Box 
                  bg="red.500" 
                  color="white" 
                  p={4} 
                  borderRadius="md" 
                  textAlign="center"
                >
                  Error loading playlists
                </Box>
              ) : (
                <SimpleGrid 
                  columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 6 }} 
                  spacing={6}
                >
                  {playlists.map(playlist => (
                    <Box key={playlist.id}>
                      <Playlist 
                        name={playlist.name}
                        bio={playlist.description} 
                        image={playlist.coverImage}
                        color={playlist.colorCode}
                        privacy={playlist.privacy}
                        id={playlist.id}
                      />
                    </Box>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </Box>
          
          <Divider my={10} borderColor="whiteAlpha.300" />
          
          {/* Popular Samples Section */}
          <Box mb={10}>
            <Flex alignItems="center" justifyContent="space-between" mb={6}>
              <HStack spacing={3}>
                <FaFire size={24} color="#ED8936" /> {/* Orange color */}
                <Heading as="h2" size="lg" color="white">
                  Popular Samples
                </Heading>
              </HStack>
              
              <Button 
                as={Link}
                to="/explore"
                variant="outline"
                colorScheme="purple"
                rightIcon={<FaChevronRight />}
              >
                Explore More
              </Button>
            </Flex>
            
            <Box 
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="lg"
              p={6}
              border="1px solid"
              borderColor="whiteAlpha.200"
            >
              {samplesLoading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="purple.500" thickness="4px" />
                </Flex>
              ) : samplesError ? (
                <Box 
                  bg="red.500" 
                  color="white" 
                  p={4} 
                  borderRadius="md" 
                  textAlign="center"
                >
                  Error loading popular samples
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {popularSamples.map(sample => (
                    <SampleRow key={sample.id} track={sample} />
                  ))}
                  
                  <Button 
                    as={Link} 
                    to="/explore" 
                    colorScheme="purple" 
                    size="lg" 
                    mt={4}
                    alignSelf="center"
                  >
                    Discover More Samples
                  </Button>
                </VStack>
              )}
            </Box>
          </Box>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default LoggedInHome;

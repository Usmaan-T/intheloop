import React, { useState, useEffect } from 'react';
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
  VStack,
  ButtonGroup,
  Icon,
  useBreakpointValue,
  useToast,
  Badge,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FaCompass, FaFire, FaChevronRight, FaChartLine, FaHeart, FaUpload, FaStar } from 'react-icons/fa';
import { motion } from 'framer-motion';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import Playlist from '../../components/Playlist/Playlist';
import SampleRow from '../../components/Samples/SampleRow';
import HotUserCard from '../../components/User/HotUserCard';
import { usePopularSamples } from '../../hooks/usePopularSamples';
import { usePublicPlaylists } from '../../hooks/usePublicPlaylists';
import { useFeaturedPlaylists } from '../../hooks/useFeaturedPlaylists';
import usePopularUsers from '../../hooks/usePopularUsers';
import useFollowedProducersSamples from '../../hooks/useFollowedProducersSamples';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const LoggedInHome = () => {
  const [timeRange, setTimeRange] = useState('weekly');
  const [localPopularSamples, setLocalPopularSamples] = useState([]);
  const toast = useToast();

  const {
    playlists: publicPlaylists,
    loading: publicPlaylistsLoading,
    error: publicPlaylistsError,
  } = usePublicPlaylists(6);
  
  const {
    playlists: featuredPlaylists,
    loading: featuredPlaylistsLoading,
    error: featuredPlaylistsError,
  } = useFeaturedPlaylists(6);

  const {
    samples: popularSamples,
    loading: samplesLoading,
    error: samplesError,
  } = usePopularSamples(5, timeRange);
  
  // Get samples from followed producers
  const {
    samples: followedSamples,
    loading: followedLoading,
    error: followedError
  } = useFollowedProducersSamples(5);
  
  // Update local samples when popularSamples changes
  useEffect(() => {
    if (popularSamples) {
      setLocalPopularSamples(popularSamples);
    }
  }, [popularSamples]);
  
  // Handle sample deletion
  const handleDeleteSample = (sampleId) => {
    setLocalPopularSamples(prevSamples => 
      prevSamples.filter(sample => sample.id !== sampleId)
    );
    
    toast({
      title: "Sample deleted",
      description: "Your sample has been removed",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  // Fetch users with the highest heat scores
  const {
    users: hotUsers,
    loading: usersLoading,
    error: usersError,
  } = usePopularUsers(5);

  const headingSize = useBreakpointValue({ base: 'xl', md: '2xl' });

  return (
    <>
      <NavBar />

      <Box bg="darkBg.800" minH="100vh" position="relative" overflow="hidden">
        {/* Background animated elements */}
        <MotionBox
          position="absolute"
          height="500px"
          width="500px"
          borderRadius="full"
          bgGradient="radial(brand.500, brand.700)"
          filter="blur(120px)"
          opacity="0.15"
          top="-200px"
          right="-100px"
          zIndex={0}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <MotionBox
          position="absolute"
          height="400px"
          width="400px"
          borderRadius="full"
          bgGradient="radial(accent.purple.500, accent.purple.700)"
          filter="blur(100px)"
          opacity="0.1"
          bottom="-100px"
          left="-100px"
          zIndex={0}
          animate={{
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />

        <MotionBox
          as="section"
          bgGradient="linear(to-r, darkBg.900, darkBg.800, darkBg.900)"
          position="relative"
          py={{ base: 16, md: 24 }}
          px={4}
          textAlign="center"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          boxShadow="0 10px 30px -5px rgba(0, 0, 0, 0.3)"
          overflow="hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          {/* Animated gradient line */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            height="4px"
            bgGradient="linear(to-r, transparent, brand.500, accent.pink.500, accent.purple.500, transparent)"
            as={motion.div}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <Container maxW="container.xl" position="relative" zIndex={1}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Heading
                as="h1"
                fontSize={{ base: '4xl', md: '5xl', lg: '6xl' }}
                mb={6}
                fontWeight="bold"
                bgGradient="linear(to-r, white, brand.100)"
                bgClip="text"
                letterSpacing="tight"
                lineHeight="1.1"
              >
                Welcome to <Box as="span" color="brand.400">The Loop</Box>
              </Heading>
            </MotionBox>
            
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              maxW="container.md"
              mx="auto"
            >
              <Text
                fontSize={{ base: 'lg', md: 'xl' }}
                mb={10}
                color="whiteAlpha.800"
                fontWeight="medium"
                lineHeight="1.6"
              >
                Discover trending samples, create unique soundscapes, and connect with producers from around the world. Your next hit starts here.
              </Text>
            </MotionBox>
            
            <MotionBox
              display="flex"
              justifyContent="center"
              gap={5}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            >
              <Button
                as={Link}
                to="/explore"
                size="lg"
                px={8}
                py={6}
                bgGradient="linear(to-r, brand.500, brand.600)"
                _hover={{
                  bgGradient: "linear(to-r, brand.600, brand.700)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 25px -5px rgba(214, 34, 34, 0.4)",
                }}
                rightIcon={<FaCompass />}
                fontWeight="medium"
                fontSize="md"
                transition="all 0.3s"
              >
                Explore Music
              </Button>
              
              <Button
                as={Link}
                to="/upload"
                size="lg"
                px={8}
                py={6}
                variant="outline"
                borderColor="brand.500"
                borderWidth="2px"
                _hover={{
                  bg: "rgba(214, 34, 34, 0.1)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                }}
                rightIcon={<FaUpload />}
                fontWeight="medium"
                fontSize="md"
                transition="all 0.3s"
              >
                Upload Track
              </Button>
            </MotionBox>
          </Container>
        </MotionBox>

        <Container maxW="container.xl" py={{ base: 12, md: 16 }}>
          {/* Hot Users Section */}
          <MotionBox
            mb={10}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Flex
              alignItems="center"
              justifyContent="space-between"
              mb={6}
              flexDirection={{ base: 'column', sm: 'row' }}
              gap={{ base: 4, sm: 0 }}
            >
              <HStack spacing={3}>
                <Icon as={FaFire} color="orange.400" boxSize={6} />
                <Heading as="h2" size="lg" color="white" fontWeight="semibold">
                  Hot Users
                </Heading>
              </HStack>

              <Text color="gray.400" fontSize="sm">
                Artists with the highest weekly heat
              </Text>
            </Flex>

            <Box
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="xl"
              p={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor="whiteAlpha.200"
              boxShadow="0 4px 20px rgba(0,0,0,0.1)"
              overflow="hidden"
              position="relative"
            >
              {usersLoading ? (
                <Flex justify="center" py={8}>
                  <Spinner size="lg" color="orange.500" thickness="4px" />
                </Flex>
              ) : usersError ? (
                <Box bg="red.500" color="white" p={4} borderRadius="md" textAlign="center">
                  Error loading hot users
                </Box>
              ) : hotUsers.length === 0 ? (
                <Text color="gray.400" textAlign="center" py={8}>
                  No hot users to display yet
                </Text>
              ) : (
                <>
                  <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing={4}>
                    {hotUsers.map((user, index) => (
                      <MotionBox
                        key={user.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.4 }}
                      >
                        <HotUserCard user={user} rank={index + 1} />
                      </MotionBox>
                    ))}
                  </SimpleGrid>
                </>
              )}
            </Box>
          </MotionBox>

          <Divider my={10} borderColor="whiteAlpha.300" />

          {/* Popular Samples Section */}
          <MotionBox
            mb={10}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Flex
              alignItems={{ base: 'flex-start', md: 'center' }}
              justifyContent="space-between"
              mb={6}
              flexDirection={{ base: 'column', md: 'row' }}
              gap={4}
            >
              <HStack spacing={3}>
                <Icon as={FaFire} color="red.400" boxSize={6} />
                <Heading as="h2" size="lg" color="white" fontWeight="semibold">
                  Popular Samples
                </Heading>
              </HStack>

              <HStack spacing={4}>
                <ButtonGroup size="sm" isAttached variant="outline">
                  <Button
                    colorScheme={timeRange === 'daily' ? 'red' : 'whiteAlpha'}
                    onClick={() => setTimeRange('daily')}
                    borderColor="whiteAlpha.300"
                    fontWeight="medium"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    Today
                  </Button>
                  <Button
                    colorScheme={timeRange === 'weekly' ? 'red' : 'whiteAlpha'}
                    onClick={() => setTimeRange('weekly')}
                    borderColor="whiteAlpha.300"
                    fontWeight="medium"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    This Week
                  </Button>
                  <Button
                    colorScheme={timeRange === 'monthly' ? 'red' : 'whiteAlpha'}
                    onClick={() => setTimeRange('monthly')}
                    borderColor="whiteAlpha.300"
                    fontWeight="medium"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    This Month
                  </Button>
                  <Button
                    colorScheme={timeRange === 'allTime' ? 'red' : 'whiteAlpha'}
                    onClick={() => setTimeRange('allTime')}
                    borderColor="whiteAlpha.300"
                    fontWeight="medium"
                    _hover={{ bg: 'whiteAlpha.100' }}
                  >
                    All Time
                  </Button>
                </ButtonGroup>

                <Button
                  as={Link}
                  to="/explore"
                  variant="outline"
                  colorScheme="red"
                  rightIcon={<FaChevronRight />}
                  size={{ base: 'sm', md: 'md' }}
                  fontWeight="medium"
                  _hover={{
                    bg: 'whiteAlpha.100',
                    transform: 'translateY(-2px)',
                    shadow: 'md',
                  }}
                  display={{ base: 'none', md: 'flex' }}
                >
                  Explore More
                </Button>
              </HStack>
            </Flex>

            <Box
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="xl"
              p={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor="whiteAlpha.200"
              boxShadow="0 4px 20px rgba(0,0,0,0.1)"
              overflow="hidden"
              position="relative"
            >
              {samplesLoading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="red.500" thickness="4px" />
                </Flex>
              ) : samplesError ? (
                <Box bg="red.500" color="white" p={4} borderRadius="md" textAlign="center">
                  Error loading popular samples
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {localPopularSamples.map((sample, index) => (
                    <MotionBox
                      key={sample.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.4 }}
                    >
                      <SampleRow 
                        track={sample} 
                        onDelete={handleDeleteSample}
                      />
                    </MotionBox>
                  ))}

                  <Button
                    as={Link}
                    to="/explore"
                    colorScheme="red"
                    size="lg"
                    mt={4}
                    alignSelf="center"
                    bgGradient="linear(to-r, red.500, red.600)"
                    _hover={{
                      bgGradient: 'linear(to-r, red.600, red.700)',
                      transform: 'translateY(-2px)',
                      boxShadow: 'lg',
                    }}
                    px={8}
                    fontWeight="medium"
                  >
                    Discover More Samples
                  </Button>
                </VStack>
              )}
            </Box>
          </MotionBox>

          <Divider my={10} borderColor="whiteAlpha.300" />

          {/* Featured Collections Section */}
          <MotionBox
            mb={10}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <Flex
              alignItems="center"
              justifyContent="space-between"
              mb={6}
              flexDirection={{ base: 'column', sm: 'row' }}
              gap={{ base: 4, sm: 0 }}
            >
              <HStack spacing={3}>
                <Icon as={FaStar} color="yellow.400" boxSize={6} />
                <Heading as="h2" size="lg" color="white" fontWeight="semibold">
                  Featured Collections
                </Heading>
              </HStack>

              <Button
                as={Link}
                to="/playlists"
                variant="outline"
                colorScheme="yellow"
                rightIcon={<FaChevronRight />}
                size={{ base: 'md', md: 'md' }}
                fontWeight="medium"
                borderColor="yellow.400"
                _hover={{
                  bg: 'whiteAlpha.100',
                  transform: 'translateY(-2px)',
                  shadow: 'md',
                }}
              >
                View All
              </Button>
            </Flex>

            <Box
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="xl"
              p={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor="whiteAlpha.200"
              boxShadow="0 4px 20px rgba(0,0,0,0.1)"
              overflow="hidden"
              position="relative"
            >
              {featuredPlaylistsLoading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="yellow.500" thickness="4px" />
                </Flex>
              ) : featuredPlaylistsError ? (
                <Box bg="red.500" color="white" p={4} borderRadius="md" textAlign="center">
                  Error loading featured collections
                </Box>
              ) : featuredPlaylists.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={10}>
                  <Text color="gray.400" mb={4}>No featured collections available yet</Text>
                  <Button
                    as={Link}
                    to="/playlists"
                    colorScheme="yellow"
                    variant="outline"
                  >
                    Browse All Collections
                  </Button>
                </Flex>
              ) : (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 6 }} spacing={6}>
                  {featuredPlaylists.map((playlist, index) => (
                    <MotionBox
                      key={playlist.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                      position="relative"
                    >
                      {playlist.isFeatured && (
                        <Badge
                          position="absolute"
                          top={2}
                          left={2}
                          zIndex={2}
                          colorScheme="yellow"
                          fontSize="xs"
                          px={2}
                          py={1}
                          borderRadius="full"
                        >
                          Featured
                        </Badge>
                      )}
                      <Playlist
                        name={playlist.name}
                        bio={playlist.description}
                        image={playlist.coverImage}
                        color={playlist.colorCode}
                        privacy={playlist.privacy}
                        id={playlist.id}
                      />
                    </MotionBox>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </MotionBox>

          {/* Explore User Collections Section - Keep this for now but update heading */}
          <MotionBox
            mb={10}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Flex
              alignItems="center"
              justifyContent="space-between"
              mb={6}
              flexDirection={{ base: 'column', sm: 'row' }}
              gap={{ base: 4, sm: 0 }}
            >
              <HStack spacing={3}>
                <Icon as={FaCompass} color="purple.400" boxSize={6} />
                <Heading as="h2" size="lg" color="white" fontWeight="semibold">
                  Recent Collections
                </Heading>
              </HStack>

              <Button
                as={Link}
                to="/playlists"
                variant="outline"
                colorScheme="purple"
                rightIcon={<FaChevronRight />}
                size={{ base: 'md', md: 'md' }}
                fontWeight="medium"
                borderColor="purple.400"
                _hover={{
                  bg: 'whiteAlpha.100',
                  transform: 'translateY(-2px)',
                  shadow: 'md',
                }}
              >
                View All
              </Button>
            </Flex>

            <Box
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="xl"
              p={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor="whiteAlpha.200"
              boxShadow="0 4px 20px rgba(0,0,0,0.1)"
              overflow="hidden"
              position="relative"
            >
              {publicPlaylistsLoading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="purple.500" thickness="4px" />
                </Flex>
              ) : publicPlaylistsError ? (
                <Box bg="red.500" color="white" p={4} borderRadius="md" textAlign="center">
                  Error loading playlists
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 6 }} spacing={6}>
                  {publicPlaylists.map((playlist, index) => (
                    <MotionBox
                      key={playlist.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.5 }}
                    >
                      <Playlist
                        name={playlist.name}
                        bio={playlist.description}
                        image={playlist.coverImage}
                        color={playlist.colorCode}
                        privacy={playlist.privacy}
                        id={playlist.id}
                      />
                    </MotionBox>
                  ))}
                </SimpleGrid>
              )}
            </Box>
          </MotionBox>

          <MotionBox
            mb={10}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <Flex
              alignItems="center"
              justifyContent="space-between"
              mb={6}
              flexDirection={{ base: 'column', sm: 'row' }}
              gap={{ base: 4, sm: 0 }}
            >
              <HStack spacing={3}>
                <Icon as={FaHeart} color="pink.400" boxSize={6} />
                <Heading as="h2" size="lg" color="white" fontWeight="semibold">
                  From the Producers You Love
                </Heading>
              </HStack>

              <Button
                as={Link}
                to="/community"
                variant="outline"
                colorScheme="pink"
                rightIcon={<FaChevronRight />}
                size={{ base: 'md', md: 'md' }}
                fontWeight="medium"
                _hover={{
                  bg: 'whiteAlpha.100',
                  transform: 'translateY(-2px)',
                  shadow: 'md',
                }}
              >
                View Community
              </Button>
            </Flex>

            <Box
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="xl"
              p={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor="whiteAlpha.200"
              boxShadow="0 4px 20px rgba(0,0,0,0.1)"
            >
              {followedLoading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="pink.500" thickness="4px" />
                </Flex>
              ) : followedError ? (
                <Box bg="red.500" color="white" p={4} borderRadius="md" textAlign="center">
                  Error loading samples: {followedError}
                </Box>
              ) : !followedSamples || followedSamples.length === 0 ? (
                <Box py={10} textAlign="center">
                  <Text color="gray.400" fontSize="lg" mb={4}>
                    You're not following any producers yet, or they haven't uploaded samples.
                  </Text>
                  <Button
                    as={Link}
                    to="/community"
                    colorScheme="pink"
                    size="md"
                    px={8}
                  >
                    Discover Producers to Follow
                  </Button>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {followedSamples.map((sample, index) => (
                    <MotionBox
                      key={sample.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.4 }}
                    >
                      <SampleRow 
                        track={sample} 
                        onDelete={handleDeleteSample}
                      />
                    </MotionBox>
                  ))}
                </VStack>
              )}
            </Box>
          </MotionBox>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default LoggedInHome;

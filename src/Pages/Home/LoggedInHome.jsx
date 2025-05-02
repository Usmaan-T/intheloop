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
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { FaCompass, FaFire, FaChevronRight, FaChartLine, FaHeart } from 'react-icons/fa';
import { motion } from 'framer-motion';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import Playlist from '../../components/Playlist/Playlist';
import SampleRow from '../../components/Samples/SampleRow';
import HotUserCard from '../../components/User/HotUserCard';
import { usePopularSamples } from '../../hooks/usePopularSamples';
import { usePublicPlaylists } from '../../hooks/usePublicPlaylists';
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
    playlists,
    loading: playlistsLoading,
    error: playlistsError,
  } = usePublicPlaylists(6);

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

      <Box bgColor="blackAlpha.900" minH="100vh" position="relative" overflow="hidden">
        <MotionBox
          position="absolute"
          height="400px"
          width="400px"
          borderRadius="full"
          bgGradient="radial(red.600, red.900)"
          filter="blur(90px)"
          opacity="0.2"
          top="-150px"
          right="-100px"
          zIndex={0}
          animate={{
            x: [0, 40, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        <MotionBox
          as="section"
          bgGradient="linear(to-r, red.900, #6F0A14, red.900)"
          backgroundSize="200% 100%"
          borderBottom="1px solid"
          borderColor="whiteAlpha.200"
          position="relative"
          py={{ base: 12, md: 16 }}
          px={4}
          textAlign="center"
          boxShadow="0 4px 20px rgba(0,0,0,0.2)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Container maxW="container.xl">
            <Heading
              as="h1"
              size={headingSize}
              mb={4}
              color="white"
              fontWeight="bold"
              bgGradient="linear(to-r, white, whiteAlpha.800)"
              bgClip="text"
              letterSpacing="-1px"
            >
              Welcome to the Loop
            </Heading>
            <Text
              fontSize={{ base: 'lg', md: 'xl' }}
              maxW="container.md"
              mx="auto"
              mb={8}
              color="gray.300"
              fontWeight="medium"
            >
              Discover trending samples, explore playlists from the community, and get inspired.
            </Text>
          </Container>
        </MotionBox>

        <Container maxW="container.xl" py={{ base: 8, md: 10 }}>
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

          {/* User Playlists Section */}
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
                <Icon as={FaCompass} color="purple.400" boxSize={6} />
                <Heading as="h2" size="lg" color="white" fontWeight="semibold">
                  Explore User Playlists
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
              {playlistsLoading ? (
                <Flex justify="center" py={10}>
                  <Spinner size="xl" color="purple.500" thickness="4px" />
                </Flex>
              ) : playlistsError ? (
                <Box bg="red.500" color="white" p={4} borderRadius="md" textAlign="center">
                  Error loading playlists
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4, xl: 6 }} spacing={6}>
                  {playlists.map((playlist, index) => (
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

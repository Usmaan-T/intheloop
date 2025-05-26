import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Spinner,
  Center,
  useToast,
  Avatar,
  Flex,
  Badge,
  HStack,
  IconButton,
  Button,
  Image,
  useColorModeValue,
  Divider,
  SimpleGrid,
  Icon,
  Tooltip
} from '@chakra-ui/react';
import { format, subDays } from 'date-fns';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc, collection, query, where, getDocs, getDoc, orderBy, setDoc } from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import SampleCard from '../../components/Explore/SampleCard';
import COLLECTIONS from '../../firebase/collections';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import { FaTrophy, FaPlay, FaPause, FaCalendarAlt, FaChartLine, FaHeart, FaDownload, FaEye } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link as RouterLink } from 'react-router-dom';
import useAudioPlayback from '../../hooks/useAudioPlayback';

// Define motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);
const MotionText = motion(Text);
const MotionHeading = motion(Heading);
const MotionImage = motion(Image);
const MotionIconButton = motion(IconButton);

const DailyPage = () => {
  const toast = useToast();
  const [selectedSample, setSelectedSample] = useState(null);
  const [creator, setCreator] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
  const audioRef = useRef(null);
  
  // Get the date from 2 days ago
  const targetDate = subDays(new Date(), 2);
  const dateString = format(targetDate, 'yyyy-MM-dd');
  
  // Reference to the daily sample document
  const dailySampleRef = doc(firestore, 'dailySamples', dateString);
  const [dailySampleDoc, loading, error] = useDocument(dailySampleRef);
  
  // Fallback sample for when no sample is found for the day
  const fallbackSample = {
    sample: {
      id: 'fallback-sample-id',
      name: 'Atmospheric Lofi Beat',
      userId: 'fallback-user-id',
      audioUrl: 'https://cdn.freesound.org/previews/563/563771_12517091-lq.mp3',
      coverImage: 'https://images.unsplash.com/photo-1571330735066-03aaa9429d89?q=80&w=2070&auto=format&fit=crop',
      createdAt: { toDate: () => targetDate },
      bpm: '85',
      key: 'Cm',
      genre: 'Lo-Fi',
      instrument: 'Piano',
      description: 'A relaxing atmospheric lofi beat with smooth piano melodies, perfect for studying or chilling.',
      tags: ['Lo-Fi', 'Chill', 'Piano', 'Beat', 'Atmospheric'],
      stats: {
        likes: 243,
        downloads: 108,
        views: 562
      },
      popularityScores: {
        allTime: 425
      }
    },
    score: 425,
    date: targetDate
  };

  // Fallback creator for when no creator is found
  const fallbackCreator = {
    username: 'MusicMaestro',
    displayName: 'Music Maestro',
    photoURL: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?q=80&w=1000&auto=format&fit=crop',
    bio: 'Producer of chill beats and atmospheric melodies',
    followers: 1289,
    uid: 'fallback-user-id'
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.6 }
    }
  };

  // Fetch creator info when sample data changes
  useEffect(() => {
    const fetchCreator = async () => {
      const sampleData = dailySampleDoc?.data()?.sample || selectedSample?.sample;
      if (sampleData?.userId) {
        try {
          const userDocRef = doc(firestore, COLLECTIONS.USERS, sampleData.userId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setCreator(userDoc.data());
          } else if (sampleData.userId === 'fallback-user-id') {
            // Use fallback creator for our fallback sample
            setCreator(fallbackCreator);
          }
        } catch (err) {
          console.error('Error fetching creator info:', err);
          toast({
            title: 'Error',
            description: 'Could not load creator information',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
          // Use fallback creator on error if we're using the fallback sample
          if (sampleData.userId === 'fallback-user-id') {
            setCreator(fallbackCreator);
          }
        }
      }
    };

    fetchCreator();
  }, [dailySampleDoc, selectedSample, toast]);

  // Fetch and select sample if not already selected
  useEffect(() => {
    const fetchAndSelectSample = async () => {
      try {
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const samplesRef = collection(firestore, COLLECTIONS.POSTS);
        const q = query(
          samplesRef,
          where('createdAt', '>=', startOfDay),
          where('createdAt', '<=', endOfDay),
          orderBy('createdAt')
        );

        const querySnapshot = await getDocs(q);
        console.log(`Found ${querySnapshot.size} samples for ${dateString}`);
        
        if (querySnapshot.size > 0) {
          // Find the sample with the highest popularity score
          let highestScore = -1;
          let bestSample = null;

          querySnapshot.forEach(doc => {
            const sampleData = doc.data();
            const score = sampleData.popularityScores?.allTime || 0;
            
            console.log('Sample score:', {
              id: doc.id,
              name: sampleData.name,
              score: score
            });

            if (score > highestScore) {
              highestScore = score;
              bestSample = {
                ...sampleData,
                id: doc.id
              };
            }
          });

          if (bestSample && !dailySampleDoc?.exists()) {
            console.log('Selected best sample:', bestSample.name, 'with score:', highestScore);
            
            // Store in dailySamples collection
            await setDoc(dailySampleRef, {
              sample: bestSample,
              score: highestScore,
              date: targetDate,
              updatedAt: new Date()
            });

            setSelectedSample({
              sample: bestSample,
              score: highestScore
            });
          }
        }
      } catch (err) {
        console.error('Error fetching samples:', err);
        toast({
          title: 'Error',
          description: `Could not fetch samples: ${err.message}`,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (!dailySampleDoc?.exists()) {
      fetchAndSelectSample();
    }
  }, [dateString, dailySampleDoc, targetDate, toast]);

  const handlePlayToggle = (sample) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(sample.audioUrl);
      audioRef.current.addEventListener('ended', () => {
        setCurrentTrack(prev => prev ? { ...prev, isPlaying: false } : null);
      });
    }
    
    if (currentTrack?.id === sample.id && currentTrack.isPlaying) {
      // Pause current track
      audioRef.current.pause();
      setCurrentTrack(prev => ({ ...prev, isPlaying: false }));
    } else {
      // Play new track or resume current track
      if (currentTrack?.id !== sample.id) {
        // Load new track
        audioRef.current.src = sample.audioUrl;
        setCurrentTrack({
          id: sample.id,
          name: sample.name,
          artist: creator?.username || creator?.displayName || 'Unknown Artist',
          coverImage: sample.coverImage,
          artistId: sample.userId,
          isPlaying: true
        });
      }
      audioRef.current.play()
        .then(() => {
          setCurrentTrack(prev => ({ ...prev, isPlaying: true }));
        })
        .catch(err => {
          console.error('Error playing audio:', err);
          toast({
            title: 'Playback Error',
            description: 'Could not play this sample',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        });
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const SampleOfTheDay = ({ sample, score }) => {
    const isSamplePlaying = currentTrack?.id === sample.id && currentTrack.isPlaying;
      
    // Get counts with fallbacks
    const likeCount = sample.stats?.likes || 0;
    const downloadCount = sample.stats?.downloads || 0;
    const viewCount = sample.stats?.views || 0;
    
    return (
      <MotionBox
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        bgGradient="linear(to-br, rgba(30,30,40,0.8), rgba(50,30,40,0.8))"
        borderRadius="2xl"
        overflow="hidden"
        boxShadow="0 20px 40px rgba(0,0,0,0.3)"
        border="1px solid"
        borderColor="whiteAlpha.200"
        backdropFilter="blur(10px)"
        position="relative"
        maxW="900px"
        mx="auto"
      >
        {/* Background pattern */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgImage="url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PScxMCc+CiAgPHJlY3Qgd2lkdGg9JzEwJyBoZWlnaHQ9JzEwJyBmaWxsPSdub25lJy8+CiAgPGNpcmNsZSBjeD0nMS41JyBjeT0nMS41JyByPScxJyBmaWxsPSdyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpJy8+Cjwvc3ZnPg==')"
          opacity={0.4}
          pointerEvents="none"
        />
        
        {/* Golden accent */}
        <Box
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="8px"
          bgGradient="linear(to-r, yellow.500, orange.400, red.400, purple.500, yellow.500)"
        />
        
        <Flex direction={{ base: "column", md: "row" }} p={6} position="relative">
          {/* Left side - Cover image and play button */}
          <Box 
            flex={{ base: "1", md: "0.4" }} 
            mb={{ base: 6, md: 0 }}
            position="relative"
          >
            <MotionBox
              position="relative"
              borderRadius="xl"
              overflow="hidden"
              boxShadow="xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Image
                src={sample.coverImage || creator?.photoURL || "https://placehold.co/400?text=Sample+of+the+Day"}
                alt={sample.name}
                width="100%"
                height="auto"
                aspectRatio={1}
                objectFit="cover"
              />
              
              <MotionIconButton
                icon={isSamplePlaying ? <FaPause size="24px" /> : <FaPlay size="24px" />}
                aria-label={isSamplePlaying ? "Pause" : "Play"}
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                size="lg"
                isRound
                bgGradient="linear(to-r, red.600, red.400)"
                _hover={{ 
                  bgGradient: "linear(to-r, red.700, red.500)",
                  opacity: 1
                }}
                boxShadow="0 0 30px rgba(0,0,0,0.5)"
                onClick={() => handlePlayToggle(sample)}
                zIndex={2}
                opacity={0.9}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              />
              
              {/* Trophy badge */}
              <Box
                position="absolute"
                top="10px"
                right="10px"
                bg="yellow.400"
                color="gray.900"
                borderRadius="full"
                p={2}
                boxShadow="0 2px 10px rgba(0,0,0,0.3)"
              >
                <FaTrophy />
              </Box>
            </MotionBox>
            
            <SimpleGrid columns={3} gap={4} mt={4}>
              <VStack align="center">
                <HStack color="red.400">
                  <Icon as={FaHeart} />
                  <MotionText
                    fontWeight="bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {likeCount}
                  </MotionText>
                </HStack>
                <Text fontSize="xs" color="gray.400">Likes</Text>
              </VStack>
              
              <VStack align="center">
                <HStack color="blue.400">
                  <Icon as={FaDownload} />
                  <MotionText
                    fontWeight="bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    {downloadCount}
                  </MotionText>
                </HStack>
                <Text fontSize="xs" color="gray.400">Downloads</Text>
              </VStack>
              
              <VStack align="center">
                <HStack color="green.400">
                  <Icon as={FaEye} />
                  <MotionText
                    fontWeight="bold"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {viewCount}
                  </MotionText>
                </HStack>
                <Text fontSize="xs" color="gray.400">Views</Text>
              </VStack>
            </SimpleGrid>
          </Box>
          
          {/* Right side - Sample details */}
          <Box flex={{ base: "1", md: "0.6" }} pl={{ base: 0, md: 8 }}>
            <VStack align="flex-start" spacing={4}>
              <MotionHeading
                as="h2"
                size="xl"
                bgGradient="linear(to-r, yellow.300, red.400)"
                bgClip="text"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                {sample.name}
              </MotionHeading>
              
              <HStack>
                <Icon as={FaCalendarAlt} color="gray.400" />
                <Text color="gray.300">
                  Added on {format(sample.createdAt.toDate(), 'MMM dd, yyyy')}
                </Text>
              </HStack>
              
              <HStack>
                <Icon as={FaChartLine} color="yellow.400" />
                <Text color="yellow.300" fontWeight="medium">
                  Popularity Score: {score.toFixed(0)}
                </Text>
              </HStack>
              
              <Divider borderColor="whiteAlpha.300" />
              
              {/* Sample metadata */}
              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} width="100%">
                {sample.bpm && (
                  <Box>
                    <Text color="gray.400" fontSize="sm">BPM</Text>
                    <Text color="white" fontWeight="bold" fontSize="xl">{sample.bpm}</Text>
                  </Box>
                )}
                
                {sample.key && (
                  <Box>
                    <Text color="gray.400" fontSize="sm">Key</Text>
                    <Text color="white" fontWeight="bold" fontSize="xl">{sample.key}</Text>
                  </Box>
                )}
                
                {sample.genre && (
                  <Box>
                    <Text color="gray.400" fontSize="sm">Genre</Text>
                    <Text color="white" fontWeight="bold">{sample.genre}</Text>
                  </Box>
                )}
                
                {sample.instrument && (
                  <Box>
                    <Text color="gray.400" fontSize="sm">Instrument</Text>
                    <Text color="white" fontWeight="bold">{sample.instrument}</Text>
                  </Box>
                )}
              </SimpleGrid>
              
              {/* Tags */}
              {sample.tags && sample.tags.length > 0 && (
                <Box width="100%">
                  <Text color="gray.400" fontSize="sm" mb={2}>Tags</Text>
                  <Flex flexWrap="wrap" gap={2}>
                    {sample.tags.map((tag, index) => (
                      <MotionBox
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * index + 0.4 }}
                      >
                        <Badge
                          colorScheme="red"
                          variant="solid"
                          borderRadius="full"
                          px={3}
                          py={1}
                        >
                          #{tag}
                        </Badge>
                      </MotionBox>
                    ))}
                  </Flex>
                </Box>
              )}
              
              {/* Description */}
              {sample.description && (
                <Box>
                  <Text color="gray.400" fontSize="sm">Description</Text>
                  <Text color="gray.200">
                    {sample.description}
                  </Text>
                </Box>
              )}
              
              {/* Action buttons */}
              <HStack spacing={4} mt={2}>
                <Button 
                  leftIcon={isSamplePlaying ? <FaPause /> : <FaPlay />}
                  colorScheme="red"
                  onClick={() => handlePlayToggle(sample)}
                >
                  {isSamplePlaying ? "Pause" : "Play"}
                </Button>
                <Button 
                  leftIcon={<FaHeart />}
                  variant="outline" 
                  colorScheme="red"
                >
                  Like
                </Button>
                <Button 
                  leftIcon={<FaDownload />}
                  variant="outline" 
                  colorScheme="blue"
                >
                  Download
                </Button>
              </HStack>
            </VStack>
          </Box>
        </Flex>
      </MotionBox>
    );
  };

  const mainContent = () => {
    if (loading) {
      return (
        <Center minH="calc(100vh - 200px)">
          <VStack spacing={6}>
            <Spinner size="xl" color="red.500" thickness="4px" />
            <MotionText
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              color="gray.300"
            >
              Loading Sample of the Day...
            </MotionText>
          </VStack>
        </Center>
      );
    }

    if (error) {
      return (
        <Center minH="calc(100vh - 200px)">
          <Text color="red.500">Error loading sample of the day: {error.message}</Text>
        </Center>
      );
    }

    // Use the daily sample if it exists, then the selected sample, then fall back to our default
    const sampleData = dailySampleDoc?.exists() ? dailySampleDoc?.data() : 
                       selectedSample ? selectedSample : fallbackSample;

    return (
      <MotionFlex
        direction="column"
        align="center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        py={{ base: 8, md: 16 }}
        px={4}
      >
        {/* Header section */}
        <MotionBox 
          textAlign="center" 
          mb={12} 
          variants={itemVariants}
          width="100%"
          maxW="800px"
        >
          <MotionHeading
            size="2xl"
            mb={6}
            bgGradient="linear(to-r, yellow.300, red.500, purple.500)"
            bgClip="text"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
          >
            Sample of the Day
          </MotionHeading>
          
          <MotionText
            fontSize={{ base: "lg", md: "xl" }}
            color="gray.400"
            mb={10}
            variants={itemVariants}
          >
            Most popular sample from {format(targetDate, 'MMMM d, yyyy')}
          </MotionText>

          {/* Creator showcase section */}
          {sampleData && creator && (
            <MotionFlex
              direction="column"
              align="center"
              bgGradient="linear(to-br, rgba(30,20,50,0.6), rgba(80,20,40,0.6))"
              p={{ base: 6, md: 8 }}
              borderRadius="xl"
              backdropFilter="blur(8px)"
              boxShadow="0 15px 25px rgba(0,0,0,0.3)"
              mb={12}
              border="1px solid"
              borderColor="whiteAlpha.200"
              variants={itemVariants}
              width="100%"
            >
              <HStack spacing={4} mb={6}>
                <MotionBox
                  initial={{ rotate: -10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <FaTrophy size={28} color="#FFD700" />
                </MotionBox>
                <MotionHeading
                  size="lg"
                  color="white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Featured Creator
                </MotionHeading>
                <MotionBox
                  initial={{ rotate: 10, scale: 0.9 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <FaTrophy size={28} color="#FFD700" />
                </MotionBox>
              </HStack>
              
              <MotionBox
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                position="relative"
              >
                <Avatar 
                  size="2xl" 
                  src={creator.photoURL} 
                  name={creator.username || creator.displayName}
                  mb={4}
                  border="4px solid"
                  borderColor="yellow.400"
                  boxShadow="0 0 20px rgba(255, 215, 0, 0.4)"
                />
                
                {/* Animated ring around avatar */}
                <Box
                  position="absolute"
                  top="-10px"
                  left="-10px"
                  right="-10px"
                  bottom="-10px"
                  borderRadius="full"
                  border="2px dashed"
                  borderColor="yellow.300"
                  opacity={0.6}
                  as={motion.div}
                  animate={{ rotate: 360 }}
                  transition={{ 
                    duration: 20, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                />
              </MotionBox>
              
              <MotionText 
                fontSize="2xl" 
                fontWeight="bold" 
                color="white"
                as={RouterLink}
                to={`/user/${sampleData.sample.userId}`}
                _hover={{ color: "yellow.400" }}
                mt={4}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {creator.username || creator.displayName}
              </MotionText>
              
              <MotionBox
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
                mt={3}
              >
                <Badge 
                  colorScheme="yellow" 
                  variant="solid" 
                  px={4} 
                  py={1.5} 
                  borderRadius="full"
                  fontSize="md"
                >
                  Top Creator
                </Badge>
              </MotionBox>
            </MotionFlex>
          )}
        </MotionBox>

        {/* Sample display */}
        {sampleData ? (
          <SampleOfTheDay 
            sample={sampleData.sample} 
            score={sampleData.score}
          />
        ) : (
          <Center minH="400px">
            <Text color="gray.500">No samples found for this day</Text>
          </Center>
        )}
      </MotionFlex>
    );
  };

  return (
    <Box 
      minH="100vh" 
      display="flex" 
      flexDirection="column" 
      position="relative"
      overflow="hidden"
      bgGradient="linear(to-b, #121212, #2d1a20, #121212)"
    >
      {/* Decorative elements */}
      <Box
        position="absolute"
        top="-200px"
        left="-200px"
        width="600px"
        height="600px"
        bg="purple.900"
        filter="blur(140px)"
        opacity="0.13"
        borderRadius="full"
        zIndex="0"
      />
      
      <Box
        position="absolute"
        bottom="-100px"
        right="-200px"
        width="500px"
        height="500px"
        bg="red.900"
        filter="blur(120px)"
        opacity="0.10"
        borderRadius="full"
        zIndex="0"
      />
      
      <Box
        position="absolute"
        top="50%"
        left="50%"
        width="800px"
        height="800px"
        bg="yellow.900"
        filter="blur(180px)"
        opacity="0.05"
        borderRadius="full"
        transform="translate(-50%, -50%)"
        zIndex="0"
      />
      
      <NavBar />
      <Box flex="1" position="relative" zIndex="1">
        {mainContent()}
      </Box>
      <Footer />
    </Box>
  );
};

export default DailyPage; 
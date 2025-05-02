import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Text, 
  Spinner, 
  Button, 
  VStack,
  IconButton,
  useToast,
  Heading,
  HStack,
  Tooltip,
  Circle,
  useBreakpointValue,
  Container,
  Badge,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { FaRandom, FaChevronUp, FaChevronDown, FaMusic, FaShare, FaUser, FaSignInAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../../components/Navbar/NavBar';
import SampleCard from '../../components/Explore/SampleCard';
import useExploreData from '../../hooks/useExploreData';
import Footer from '../../components/footer/Footer';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { Link } from 'react-router-dom';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const ExplorePage = () => {
  const [user] = useAuthState(auth);
  const { 
    samples, 
    loading, 
    error, 
    fetchMoreSamples, 
    hasMore, 
    refreshSamples,
    topTags 
  } = useExploreData(15);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const touchStartY = useRef(0);
  const toast = useToast();
  const [showControls, setShowControls] = useState(true);
  const [lastInteraction, setLastInteraction] = useState(Date.now());
  const controlsSize = useBreakpointValue({ base: "md", md: "lg" });
  
  // Auto-hide controls after inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only hide controls if there hasn't been interaction in the last 3 seconds
      if (Date.now() - lastInteraction > 3000) {
        setShowControls(false);
      }
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [lastInteraction]);
  
  // Show controls on interaction
  const handleInteraction = () => {
    setShowControls(true);
    setLastInteraction(Date.now());
  };
  
  const handleNext = useCallback(() => {
    if (currentIndex >= samples.length - 3 && hasMore) {
      fetchMoreSamples();
    }
    
    if (currentIndex < samples.length - 1) {
      setDirection('up');
      setCurrentIndex(prev => prev + 1);
      handleInteraction();
    }
  }, [currentIndex, samples, fetchMoreSamples, hasMore]);
  
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('down');
      setCurrentIndex(prev => prev - 1);
      handleInteraction();
    }
  }, [currentIndex]);
  
  // Handle swipe gestures with improved detection
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    handleInteraction();
  };
  
  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    // Detect swipe direction (with threshold)
    if (diff > 70) { // Swipe up, increased threshold for intentional swipes
      handleNext();
    } else if (diff < -70) { // Swipe down
      handlePrev();
    }
  };

  const handleWheel = (e) => {
    // Debounce wheel events to prevent too rapid switching
    if (Date.now() - lastInteraction < 500) return;
    
    if (e.deltaY > 0) { // Scroll down = next sample
      handleNext();
    } else if (e.deltaY < 0) { // Scroll up = previous sample
      handlePrev();
    }
  };

  const handleRefresh = () => {
    refreshSamples();
    setCurrentIndex(0);
    handleInteraction();
    toast({
      title: "Refreshed",
      description: user ? "Found new personalized samples for you" : "Found new samples to explore",
      status: "success",
      duration: 2000,
      isClosable: true,
      position: "bottom",
    });
  };
  
  // Show loading state when no samples
  if (loading && samples.length === 0) {
    return (
      <>
        <NavBar />
        <Flex 
          height="calc(100vh - 80px)" 
          justifyContent="center" 
          alignItems="center"
          bg="black"
        >
          <VStack spacing={5}>
            <Spinner 
              size="xl" 
              color="red.500" 
              thickness="4px" 
              speed="0.65s"
              emptyColor="whiteAlpha.200"
            />
            <Text 
              mt={4} 
              color="white" 
              fontSize="lg" 
              fontWeight="medium"
              textAlign="center"
            >
              {user ? "Finding samples for you..." : "Discovering trending samples..."}
            </Text>
          </VStack>
        </Flex>
      </>
    );
  }
  
  // Show error state
  if (error && samples.length === 0) {
    return (
      <>
        <NavBar />
        <Flex 
          height="calc(100vh - 80px)" 
          justifyContent="center" 
          alignItems="center"
          bg="black"
        >
          <VStack spacing={4}>
            <Box 
              p={5} 
              bg="rgba(229, 62, 62, 0.1)" 
              borderRadius="lg" 
              borderWidth="1px" 
              borderColor="red.500"
            >
              <Text color="red.400" fontWeight="medium">Error loading samples</Text>
            </Box>
            <Button 
              onClick={refreshSamples} 
              colorScheme="red" 
              mt={4}
              size="lg"
              _hover={{ transform: 'scale(1.05)' }}
              transition="all 0.2s"
            >
              Try Again
            </Button>
          </VStack>
        </Flex>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Container maxW="100%" p={0} position="relative" height="calc(100vh - 80px)" overflow="hidden">
        <Box 
          bg="black" 
          height="100%" 
          width="100%" 
          position="relative"
          overflow="hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseMove={handleInteraction}
          onWheel={handleWheel}
        >
          {/* Page title with personalization badge */}
          <MotionFlex 
            position="absolute" 
            top={0} 
            left={0} 
            right={0} 
            p={4} 
            zIndex={50}
            bgGradient="linear(to-b, rgba(0,0,0,0.8), rgba(0,0,0,0))"
            animate={{ 
              opacity: showControls ? 1 : 0,
              y: showControls ? 0 : -10
            }}
            transition={{ duration: 0.3 }}
            alignItems="center"
            justifyContent="space-between"
          >
            <VStack align="flex-start" spacing={1}>
              <Heading size="lg" color="white" fontWeight="bold">
                Discover
              </Heading>
              {user && (
                <HStack spacing={2}>
                  <FaUser color="white" size={14} />
                  <Text color="whiteAlpha.800" fontSize="sm">
                    Personalized for you
                  </Text>
                </HStack>
              )}
              
              {/* Top tags that influenced recommendations */}
              {user && topTags && topTags.length > 0 && (
                <Wrap mt={1} spacing={1}>
                  {topTags.slice(0, 3).map((tag, index) => (
                    <WrapItem key={index}>
                      <Badge 
                        colorScheme="red" 
                        variant="subtle" 
                        px={2} 
                        py={0.5} 
                        borderRadius="full"
                        fontSize="xs"
                      >
                        {tag}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
              )}
            </VStack>
            
            <IconButton
              icon={<FaRandom />}
              aria-label="Shuffle samples"
              isRound
              onClick={handleRefresh}
              colorScheme="red"
              size="sm"
              variant="ghost"
              _hover={{ bg: 'whiteAlpha.200' }}
            />
          </MotionFlex>
        
          {/* Main content - Sample Card */}
          <Box position="relative" height="100%" width="100%" zIndex={10}>
            {samples.length > 0 ? (
              <AnimatePresence mode="wait" initial={false}>
                <MotionBox
                  key={currentIndex}
                  initial={{ 
                    opacity: 0,
                    y: direction === 'up' ? 300 : -300 
                  }}
                  animate={{ 
                    opacity: 1,
                    y: 0 
                  }}
                  exit={{ 
                    opacity: 0,
                    y: direction === 'up' ? -300 : 300,
                    transition: { duration: 0.25 }
                  }}
                  transition={{ 
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    duration: 0.4 
                  }}
                  height="100%"
                  width="100%"
                >
                  <SampleCard 
                    sample={samples[currentIndex]} 
                    onNext={handleNext}
                  />
                </MotionBox>
              </AnimatePresence>
            ) : (
              <Flex height="100%" justifyContent="center" alignItems="center">
                <Text color="white">No samples available</Text>
              </Flex>
            )}
          </Box>
          
          {/* UI Overlay Container - All controls positioned relative to this */}
          <Box position="absolute" top={0} left={0} right={0} bottom={0} pointerEvents="none" zIndex={20}>
            {/* Side action buttons (TikTok style) */}
            <MotionFlex 
              position="absolute" 
              right={{ base: 3, md: 6 }} 
              bottom="20%" 
              direction="column"
              gap={4}
              zIndex={30}
              animate={{ 
                opacity: showControls ? 1 : 0,
                x: showControls ? 0 : 20
              }}
              transition={{ duration: 0.3 }}
              alignItems="center"
              pointerEvents="auto"
            >
              <VStack spacing={1}>
                <Circle
                  size={controlsSize === "lg" ? "48px" : "40px"}
                  bg="blackAlpha.700"
                  color="white"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.1)', bg: "blackAlpha.800" }}
                  onClick={handleRefresh}
                  boxShadow="0px 2px 5px rgba(0,0,0,0.3)"
                >
                  <FaRandom size={controlsSize === "lg" ? 18 : 14} />
                </Circle>
                <Text color="white" fontSize="xs" textShadow="0px 1px 2px rgba(0,0,0,0.5)">
                  Shuffle
                </Text>
              </VStack>
              
              <VStack spacing={1}>
                <Circle
                  size={controlsSize === "lg" ? "48px" : "40px"}
                  bg="blackAlpha.700"
                  color="white"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.1)', bg: "blackAlpha.800" }}
                  as="a"
                  href={samples[currentIndex]?.audioUrl}
                  download
                  target="_blank"
                  boxShadow="0px 2px 5px rgba(0,0,0,0.3)"
                >
                  <FaMusic size={controlsSize === "lg" ? 18 : 14} />
                </Circle>
                <Text color="white" fontSize="xs" textShadow="0px 1px 2px rgba(0,0,0,0.5)">
                  Get
                </Text>
              </VStack>
              
              <VStack spacing={1}>
                <Circle
                  size={controlsSize === "lg" ? "48px" : "40px"}
                  bg="blackAlpha.700"
                  color="white"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.1)', bg: "blackAlpha.800" }}
                  boxShadow="0px 2px 5px rgba(0,0,0,0.3)"
                >
                  <FaShare size={controlsSize === "lg" ? 18 : 14} />
                </Circle>
                <Text color="white" fontSize="xs" textShadow="0px 1px 2px rgba(0,0,0,0.5)">
                  Share
                </Text>
              </VStack>
              
              {!user && (
                <VStack spacing={1}>
                  <Circle
                    as={Link}
                    to="/login"
                    size={controlsSize === "lg" ? "48px" : "40px"}
                    bg="red.500"
                    color="white"
                    cursor="pointer"
                    transition="all 0.2s"
                    _hover={{ transform: 'scale(1.1)', bg: "red.600" }}
                    boxShadow="0px 2px 5px rgba(0,0,0,0.3)"
                  >
                    <FaSignInAlt size={controlsSize === "lg" ? 18 : 14} />
                  </Circle>
                  <Text color="white" fontSize="xs" textShadow="0px 1px 2px rgba(0,0,0,0.5)">
                    Sign in
                  </Text>
                </VStack>
              )}
            </MotionFlex>
            
            {/* Progress dots (TikTok style) - Only on desktop */}
            <MotionFlex
              position="absolute"
              right={{ base: 'unset', md: 3 }}
              left={{ base: 2, md: 'unset' }}
              top="50%"
              height="auto"
              transform="translateY(-50%)"
              direction="column"
              gap={1}
              zIndex={25}
              animate={{ opacity: showControls ? 0.8 : 0 }}
              transition={{ duration: 0.3 }}
              display={{ base: "none", md: "flex" }}
              pointerEvents="none"
            >
              {samples.slice(0, Math.min(samples.length, 10)).map((_, idx) => (
                <Box
                  key={idx}
                  width="4px"
                  height={idx === currentIndex ? "24px" : "4px"}
                  borderRadius="full"
                  bg={idx === currentIndex ? "red.500" : "whiteAlpha.400"}
                  transition="all 0.2s"
                />
              ))}
              {samples.length > 10 && (
                <Box
                  width="4px"
                  height="4px"
                  borderRadius="full"
                  bg="whiteAlpha.400"
                />
              )}
            </MotionFlex>
            
            {/* Navigation controls - Centered on mobile, right side on desktop */}
            <MotionFlex 
              position="absolute" 
              right={{ base: 4, md: 16 }} 
              top="50%" 
              transform="translateY(-50%)"
              direction="column"
              gap={4}
              zIndex={40}
              animate={{ 
                opacity: showControls ? 1 : 0
              }}
              transition={{ duration: 0.3 }}
              alignItems="center"
              pointerEvents="auto"
            >
              <Tooltip label="Previous sample" placement="left" hasArrow>
                <IconButton
                  icon={<FaChevronUp />}
                  aria-label="Previous sample"
                  isRound
                  onClick={handlePrev}
                  isDisabled={currentIndex === 0}
                  variant="solid"
                  colorScheme="whiteAlpha"
                  size={controlsSize}
                  boxShadow="0px 0px 15px rgba(0,0,0,0.5)"
                  _hover={{ transform: 'scale(1.1)', bg: "whiteAlpha.800" }}
                  _active={{ transform: 'scale(0.95)' }}
                  opacity={currentIndex === 0 ? 0.5 : 1}
                />
              </Tooltip>
              
              <Tooltip label="Next sample" placement="left" hasArrow>
                <IconButton
                  icon={<FaChevronDown />}
                  aria-label="Next sample"
                  isRound
                  onClick={handleNext}
                  isDisabled={currentIndex === samples.length - 1 && !hasMore}
                  colorScheme={currentIndex < samples.length - 1 ? "red" : "whiteAlpha"}
                  size={controlsSize}
                  boxShadow="0px 0px 15px rgba(0,0,0,0.5)"
                  _hover={{ transform: 'scale(1.1)' }}
                  _active={{ transform: 'scale(0.95)' }}
                  opacity={currentIndex === samples.length - 1 && !hasMore ? 0.5 : 1}
                />
              </Tooltip>
            </MotionFlex>
            
            {/* Current position indicator - Bottom left */}
            <MotionFlex 
              position="absolute"
              left={4}
              bottom={4}
              zIndex={25}
              animate={{ 
                opacity: showControls ? 1 : 0,
                y: showControls ? 0 : 10
              }}
              transition={{ duration: 0.3 }}
              pointerEvents="none"
            >
              <Box 
                px={3} 
                py={1} 
                borderRadius="full" 
                bg="blackAlpha.700"
                boxShadow="0px 2px 6px rgba(0,0,0,0.3)"
              >
                <Text color="white" fontWeight="bold" fontSize="sm">
                  {currentIndex + 1} / {samples.length}
                  {hasMore && "+"}
                </Text>
              </Box>
            </MotionFlex>
            
            {/* Login prompt for anonymous users - Bottom center */}
            {!user && (
              <MotionFlex
                position="absolute"
                bottom="5%"
                left="50%"
                transform="translateX(-50%)"
                zIndex={26}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: showControls ? 1 : 0,
                  y: showControls ? 0 : 10
                }}
                transition={{ duration: 0.3 }}
                alignItems="center"
                justifyContent="center"
                pointerEvents="auto"
              >
                <Box
                  as={Link}
                  to="/login"
                  bg="red.500"
                  px={4}
                  py={2}
                  borderRadius="full"
                  boxShadow="0px 2px 6px rgba(0,0,0,0.3)"
                  _hover={{ bg: "red.600", transform: "scale(1.05)" }}
                  transition="all 0.2s"
                >
                  <HStack spacing={2}>
                    <FaSignInAlt color="white" size={14} />
                    <Text color="white" fontSize="sm" fontWeight="bold">
                      Sign in for personalized samples
                    </Text>
                  </HStack>
                </Box>
              </MotionFlex>
            )}
            
            {/* Swipe instruction indicator - Bottom center, only shows initially */}
            <MotionFlex
              position="absolute"
              bottom={!user ? "13%" : "8%"}
              left="50%"
              transform="translateX(-50%)"
              zIndex={25}
              initial={{ opacity: 1, y: 0 }}
              animate={{ 
                opacity: showControls ? 0.8 : 0,
                y: showControls ? 0 : 10
              }}
              transition={{ duration: 0.3 }}
              alignItems="center"
              justifyContent="center"
              pointerEvents="none"
            >
              <Box
                bg="blackAlpha.700"
                px={4}
                py={2}
                borderRadius="full"
                boxShadow="0px 2px 6px rgba(0,0,0,0.3)"
              >
                <HStack spacing={2}>
                  <FaChevronUp color="white" size={12} />
                  <Text color="white" fontSize="sm" textAlign="center">
                    Swipe to navigate
                  </Text>
                  <FaChevronDown color="white" size={12} />
                </HStack>
              </Box>
            </MotionFlex>
          </Box>
        </Box>
      </Container>
      <Footer />
    </>
  );
};

export default ExplorePage;

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
  Tooltip
} from '@chakra-ui/react';
import { FaRandom, FaChevronUp, FaChevronDown, FaFilter } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../../components/Navbar/NavBar';
import SampleCard from '../../components/Explore/SampleCard';
import useExploreData from '../../hooks/useExploreData';
import Footer from '../../components/footer/Footer';

// Motion components
const MotionBox = motion(Box);

const ExplorePage = () => {
  const { samples, loading, error, fetchMoreSamples, hasMore, refreshSamples } = useExploreData(15);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const touchStartY = useRef(0);
  const toast = useToast();
  const [showControls, setShowControls] = useState(true);
  
  // Auto-hide controls after inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (showControls) {
        setShowControls(false);
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [currentIndex, showControls]);
  
  // Show controls on mouse movement
  const handleMouseMove = () => {
    setShowControls(true);
  };
  
  const handleNext = useCallback(() => {
    if (currentIndex >= samples.length - 2 && hasMore) {
      fetchMoreSamples();
    }
    
    if (currentIndex < samples.length - 1) {
      setDirection('up');
      setCurrentIndex(prev => prev + 1);
      setShowControls(true);
    }
  }, [currentIndex, samples, fetchMoreSamples, hasMore]);
  
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('down');
      setCurrentIndex(prev => prev - 1);
      setShowControls(true);
    }
  }, [currentIndex]);
  
  // Handle swipe gestures
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  
  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    
    // Detect swipe direction (with threshold)
    if (diff > 50) { // Swipe up
      handleNext();
    } else if (diff < -50) { // Swipe down
      handlePrev();
    }
  };

  const handleRefresh = () => {
    refreshSamples();
    setCurrentIndex(0);
    setShowControls(true);
    toast({
      title: "Refreshed",
      description: "Found new samples for you",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };
  
  // Show loading state when no samples
  if (loading && samples.length === 0) {
    return (
      <>
        <NavBar />
        <Flex height="calc(100vh - 80px)" justifyContent="center" alignItems="center">
          <VStack>
            <Spinner size="xl" color="red.500" thickness="4px" />
            <Text mt={4} color="white">Discovering samples...</Text>
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
        <Flex height="calc(100vh - 80px)" justifyContent="center" alignItems="center">
          <VStack>
            <Text color="red.400">Error loading samples</Text>
            <Button onClick={refreshSamples} colorScheme="red" mt={4}>
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
      <Box 
        bg="black" 
        height="calc(100vh - 80px)" 
        width="100%" 
        position="relative"
        overflow="hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseMove={handleMouseMove}
      >
        {/* Page title */}
        <Flex 
          position="absolute" 
          top={0} 
          left={0} 
          right={0} 
          p={4} 
          zIndex={100}
          bgGradient="linear(to-b, rgba(0,0,0,0.7), rgba(0,0,0,0))"
          opacity={showControls ? 1 : 0}
          transition="opacity 0.3s ease"
        >
          <Heading size="lg" color="white">Explore</Heading>
        </Flex>
      
        {samples.length > 0 ? (
          <AnimatePresence mode="wait">
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
                y: direction === 'up' ? -300 : 300 
              }}
              transition={{ duration: 0.3 }}
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
        
        {/* Navigation controls with improved appearance */}
        <Flex 
          position="absolute" 
          right={{ base: 4, md: 6 }} 
          top="50%" 
          transform="translateY(-50%)"
          direction="column"
          gap={4}
          zIndex={10}
          opacity={showControls ? 1 : 0}
          transition="opacity 0.3s ease"
          alignItems="center"
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
              size="lg"
              boxShadow="0px 0px 15px rgba(0,0,0,0.5)"
              _hover={{ transform: 'scale(1.1)', bg: "whiteAlpha.800" }}
              _active={{ transform: 'scale(0.95)' }}
            />
          </Tooltip>
          
          <Tooltip label="Shuffle samples" placement="left" hasArrow>
            <IconButton
              icon={<FaRandom />}
              aria-label="Refresh samples"
              isRound
              onClick={handleRefresh}
              colorScheme="red"
              size="lg"
              boxShadow="0px 0px 15px rgba(229, 62, 62, 0.4)"
              _hover={{ transform: 'scale(1.1)' }}
              _active={{ transform: 'scale(0.95)' }}
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
              size="lg"
              boxShadow="0px 0px 15px rgba(0,0,0,0.5)"
              _hover={{ transform: 'scale(1.1)' }}
              _active={{ transform: 'scale(0.95)' }}
            />
          </Tooltip>
        </Flex>
        
        {/* Progress indicator with improved appearance */}
        {samples.length > 0 && (
          <HStack
            position="absolute"
            top={6}
            left={6}
            zIndex={15}
            spacing={1}
            opacity={showControls ? 1 : 0}
            transition="opacity 0.3s ease"
          >
            <Box 
              px={3} 
              py={1} 
              borderRadius="full" 
              bg="blackAlpha.700"
              boxShadow="0px 2px 6px rgba(0,0,0,0.3)"
            >
              <Text color="white" fontWeight="bold">
                {currentIndex + 1} / {samples.length}
                {hasMore && "+"}
              </Text>
            </Box>
          </HStack>
        )}
        
        {/* Swipe instruction indicator */}
        <Box
          position="absolute"
          bottom={8}
          left="50%"
          transform="translateX(-50%)"
          zIndex={5}
          opacity={showControls ? 0.8 : 0}
          transition="opacity 0.3s ease"
        >
          <Text 
            color="white" 
            fontSize="sm" 
            textAlign="center"
            bg="blackAlpha.700"
            px={4}
            py={2}
            borderRadius="full"
            boxShadow="0px 2px 6px rgba(0,0,0,0.3)"
          >
            Swipe up for next • Swipe down for previous
          </Text>
        </Box>
      </Box>
      <Footer />
    </>
  );
};

export default ExplorePage;

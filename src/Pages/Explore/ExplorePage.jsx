import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Box, 
  Flex, 
  Spinner, 
  Text, 
  Button, 
  VStack,
  IconButton,
  useToast
} from '@chakra-ui/react';
import { FaRandom, FaChevronUp, FaChevronDown, FaArrowDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import NavBar from '../../components/Navbar/NavBar';
import SampleCard from '../../components/Explore/SampleCard';
import useExploreData from '../../hooks/useExploreData';
import Footer from '../../components/footer/Footer';
import { keyframes, css } from '@emotion/react';

// Motion components
const MotionBox = motion(Box);

// Define animations
const bounceKeyframes = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0) translateX(-50%); }
  40% { transform: translateY(-10px) translateX(-50%); }
  60% { transform: translateY(-5px) translateX(-50%); }
`;

const pulseKeyframes = keyframes`
  0% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.2); }
  100% { opacity: 0.5; transform: scale(1); }
`;

const bounceAnimation = css`animation: ${bounceKeyframes} 2s infinite`;
const pulseAnimation = css`animation: ${pulseKeyframes} 2s infinite`;

const ExplorePage = () => {
  const { samples, loading, error, fetchMoreSamples, hasMore, refreshSamples } = useExploreData();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const touchStartY = useRef(0);
  const toast = useToast();
  const [showHint, setShowHint] = useState(true);
  
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint]);
  
  const handleNext = useCallback(() => {
    if (currentIndex >= samples.length - 2 && hasMore) {
      fetchMoreSamples();
    }
    
    if (currentIndex < samples.length - 1) {
      setDirection('up');
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, samples, fetchMoreSamples, hasMore]);
  
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection('down');
      setCurrentIndex(prev => prev - 1);
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
            <Spinner size="xl" color="purple.500" thickness="4px" />
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
            <Button onClick={refreshSamples} colorScheme="purple" mt={4}>
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
      >
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
        
        {/* First-time user navigation hint */}
        {showHint && samples.length > 1 && (
          <Flex
            position="absolute"
            bottom="15%"
            left="50%"
            transform="translateX(-50%)"
            flexDirection="column"
            alignItems="center"
            color="white"
            bg="blackAlpha.800" // Darker background for better contrast
            p={4}
            borderRadius="md"
            onClick={() => setShowHint(false)}
            cursor="pointer"
            css={bounceAnimation}
            maxW="250px" // Limit width
            textAlign="center"
            boxShadow="0px 4px 10px rgba(0,0,0,0.4)" // Add shadow for separation
            zIndex={20} // Ensure it's above other elements
          >
            <FaArrowDown size="24px" />
            <Text mt={2} fontWeight="medium">Swipe up for next sample</Text>
          </Flex>
        )}

        {/* Make navigation controls more prominent */}
        <Flex 
          position="absolute" 
          right={{ base: 4, md: 8 }} 
          top="50%" 
          transform="translateY(-50%)"
          direction="column"
          gap={6} // Increase gap
          zIndex={10}
        >
          <IconButton
            icon={<FaChevronUp />}
            aria-label="Previous sample"
            isRound
            onClick={handlePrev}
            isDisabled={currentIndex === 0}
            colorScheme="whiteAlpha"
            size="lg"
            boxShadow="0px 0px 15px rgba(0,0,0,0.3)"
            _hover={{ transform: 'scale(1.1)' }}
          />
          
          <IconButton
            icon={<FaRandom />}
            aria-label="Refresh samples"
            isRound
            onClick={handleRefresh}
            colorScheme="purple"
            size="lg"
            boxShadow="0px 0px 15px rgba(0,0,0,0.3)"
            _hover={{ transform: 'scale(1.1)' }}
          />
          
          {/* Make the next button more prominent when there are more samples */}
          <IconButton
            icon={<FaChevronDown />}
            aria-label="Next sample"
            isRound
            onClick={handleNext}
            isDisabled={currentIndex === samples.length - 1 && !hasMore}
            colorScheme={currentIndex < samples.length - 1 ? "purple" : "whiteAlpha"}
            size="lg"
            boxShadow="0px 0px 15px rgba(0,0,0,0.3)"
            _hover={{ transform: 'scale(1.1)' }}
          />
        </Flex>
        
        {/* Add a more prominent bottom swipe indicator when there are more samples */}
        {currentIndex < samples.length - 1 && (
          <Flex
            position="absolute"
            bottom={8} // Move higher up
            left="50%"
            transform="translateX(-50%)"
            color="white"
            flexDirection="column"
            alignItems="center"
            bg="blackAlpha.600" // Add background
            px={3}
            py={1}
            borderRadius="full"
            zIndex={5}
          >
            <Box css={pulseAnimation}>
              <FaChevronDown />
            </Box>
            <Text fontSize="xs" mt={1}>Next</Text>
          </Flex>
        )}
        
        {/* Progress indicator - make it more prominent */}
        {samples.length > 0 && (
          <Box
            position="absolute"
            top={6}
            left={6}
            bg="blackAlpha.700"
            px={3}
            py={1}
            borderRadius="full"
            boxShadow="0px 2px 6px rgba(0,0,0,0.3)" // Add shadow
            zIndex={15}
          >
            <Text color="white" fontWeight="bold">
              {currentIndex + 1} / {samples.length}
              {hasMore && "+"}
            </Text>
          </Box>
        )}
      </Box>
      <Footer />
    </>
  );
};

export default ExplorePage;

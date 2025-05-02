import React, { useState, useRef, useEffect, memo } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Spinner,
  Button,
  Flex,
  Icon,
  Divider,
  Badge,
  Tooltip,
  HStack,
  VStack,
  useToast
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { FaHeart, FaInfoCircle, FaRandom, FaSyncAlt } from 'react-icons/fa';
import useSampleRecommendations from '../../hooks/useSampleRecommendations';
import SampleCard from '../Explore/SampleCard';

// Motion components
const MotionBox = motion(Box);
const MotionHeading = motion(Heading);
const MotionFlex = motion(Flex);

// Memoize the component to prevent unnecessary re-renders
const RecommendedSamples = memo(({ maxItems = 6 }) => {
  const {
    recommendations,
    loading,
    error,
    refreshRecommendations,
    userTagPreferences
  } = useSampleRecommendations(maxItems);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const previousRecommendationsRef = useRef([]);
  const toast = useToast();

  // Generate stable key based on recommendation IDs
  const recommendationsKey = recommendations && recommendations.length > 0
    ? `recs-${recommendations.slice(0, 2).map(rec => rec.id).join('-')}`
    : 'recs-empty';

  // Get top tags to explain recommendation basis
  const topTags = Object.entries(userTagPreferences)
    .sort(([, valueA], [, valueB]) => valueB - valueA)
    .slice(0, 5)
    .map(([tag]) => tag);

  // Handle refresh with visual feedback
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Store current recommendations for comparison
    previousRecommendationsRef.current = [...recommendations];
    refreshRecommendations();
    
    toast({
      title: "Refreshing recommendations",
      description: "Finding new samples based on your preferences",
      status: "info",
      duration: 3000,
      isClosable: true,
      position: "top"
    });
    
    // Reset refreshing state after animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  if (loading && recommendations.length === 0) {
    return (
      <Box textAlign="center" py={12}>
        <Spinner
          thickness="4px"
          speed="0.65s"
          emptyColor="gray.700"
          color="red.500"
          size="xl"
        />
        <Text mt={4} color="gray.400">Finding samples you might like...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box textAlign="center" py={8} color="red.400">
        <Text>Error loading recommendations. Please try again.</Text>
        <Button mt={4} colorScheme="red" onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      bg="rgba(20, 20, 30, 0.7)"
      borderRadius="xl"
      p={{ base: 4, md: 6 }}
      border="1px solid"
      borderColor="whiteAlpha.200"
      boxShadow="0 4px 20px rgba(0,0,0,0.1)"
      mb={10}
    >
      <MotionFlex
        align="center"
        justify="space-between"
        mb={6}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <HStack>
          <Icon as={FaHeart} color="red.400" boxSize={6} />
          <MotionHeading
            as="h2"
            size="lg"
            color="white"
            fontWeight="semibold"
          >
            Recommended For You
          </MotionHeading>
        </HStack>

        <Tooltip label="Get new recommendations" placement="top">
          <Button
            leftIcon={isRefreshing ? <FaSyncAlt /> : <FaRandom />}
            colorScheme="red"
            variant="outline"
            onClick={handleRefresh}
            size="sm"
            isLoading={loading && recommendations.length > 0}
            loadingText="Refreshing..."
            _hover={{ bg: 'rgba(229, 62, 62, 0.15)' }}
            css={isRefreshing ? {
              "svg": {
                animation: "spin 1s linear infinite",
              },
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" }
              }
            } : {}}
          >
            {isRefreshing ? "Refreshing" : "Refresh"}
          </Button>
        </Tooltip>
      </MotionFlex>

      {/* Show top tags that influenced recommendations */}
      {topTags.length > 0 && (
        <Box mb={6} px={4} py={3} bg="blackAlpha.400" borderRadius="md">
          <Flex align="center" mb={2}>
            <Icon as={FaInfoCircle} color="blue.300" mr={2} />
            <Text color="blue.300" fontSize="sm">
              Recommendations based on your interest in:
            </Text>
          </Flex>
          <Flex flexWrap="wrap" gap={2}>
            {topTags.map(tag => (
              <Badge
                key={tag}
                colorScheme="red"
                variant="subtle"
                px={2}
                py={1}
                borderRadius="full"
              >
                {tag}
              </Badge>
            ))}
          </Flex>
        </Box>
      )}

      {recommendations.length === 0 ? (
        <Box textAlign="center" py={8}>
          <Text color="gray.400">
            Not enough data to generate personalized recommendations yet.
            Try interacting with more samples to improve suggestions!
          </Text>
          <Button mt={4} colorScheme="blue" onClick={handleRefresh}>
            Show Popular Samples Instead
          </Button>
        </Box>
      ) : (
        <MotionBox
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          key={recommendationsKey}
        >
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
            {recommendations.map((sample, index) => (
              <MotionBox
                key={sample.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.4 }}
              >
                <SampleCard
                  sample={sample}
                  isCompact={true}
                  showRecommendationReason={true}
                />
              </MotionBox>
            ))}
          </SimpleGrid>
        </MotionBox>
      )}
    </MotionBox>
  );
});

export default RecommendedSamples; 
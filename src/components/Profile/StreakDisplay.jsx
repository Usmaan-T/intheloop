import React from 'react';
import {
  Box,
  Flex,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Tooltip,
  Skeleton,
  Badge,
  Heading,
  useColorModeValue
} from '@chakra-ui/react';
import { FaFire, FaTrophy, FaCalendarCheck, FaExclamationTriangle } from 'react-icons/fa';
import { isStreakAtRisk, getStreakMessage } from '../../utils/streakUtils';

/**
 * Component to display user upload streak information
 * @param {Object} props - Component props
 * @param {Object} props.streakData - User's streak data
 * @param {boolean} props.isLoading - Loading state
 */
const StreakDisplay = ({ streakData, isLoading }) => {
  const { currentStreak, longestStreak, lastUploadDate } = streakData || {};
  
  // Check if streak is at risk
  const streakAtRisk = isStreakAtRisk(lastUploadDate);
  
  // Get motivational message based on streak
  const motivationalMessage = getStreakMessage(currentStreak || 0);
  
  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Background glow based on streak
  const getStreakGlow = () => {
    if (currentStreak >= 30) return "0 0 30px rgba(236, 201, 75, 0.3)"; // Gold
    if (currentStreak >= 10) return "0 0 25px rgba(214, 131, 0, 0.25)"; // Orange
    if (currentStreak >= 5) return "0 0 20px rgba(159, 122, 234, 0.2)"; // Purple
    return "none";
  };

  return (
    <Box
      bg="rgba(20, 20, 30, 0.9)"
      borderRadius="xl"
      p={{ base: 5, md: 8 }}
      border="1px solid"
      borderColor="whiteAlpha.300"
      boxShadow={getStreakGlow()}
      transition="box-shadow 0.3s ease"
      position="relative"
      overflow="hidden"
    >
      {/* Background decorative element */}
      {currentStreak > 0 && (
        <Box
          position="absolute"
          top="10px"
          right="10px"
          opacity="0.1"
          zIndex="0"
          transform="rotate(15deg)"
        >
          <Icon as={FaFire} boxSize={currentStreak > 10 ? "120px" : "80px"} color="orange.400" />
        </Box>
      )}
      
      <Flex 
        justify="space-between" 
        align="center" 
        mb={6}
        position="relative"
        zIndex="1"
      >
        <Heading fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="white">
          Upload Streak
        </Heading>
        
        {/* Show alert badge if streak is at risk */}
        {streakAtRisk && !isLoading && (
          <Badge 
            colorScheme="orange" 
            display="flex" 
            alignItems="center" 
            py={2} 
            px={3}
            borderRadius="md"
            fontWeight="medium"
          >
            <Icon as={FaExclamationTriangle} mr={2} />
            <Text>Upload today to keep your streak!</Text>
          </Badge>
        )}
      </Flex>
      
      <Flex 
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'center', md: 'flex-start' }}
        gap={{ base: 6, md: 8 }}
        mb={6}
        position="relative"
        zIndex="1"
      >
        {/* Current Streak */}
        <Stat textAlign={{ base: 'center', md: 'left' }}>
          <Skeleton isLoaded={!isLoading} borderRadius="md">
            <Flex 
              align="center" 
              justify={{ base: 'center', md: 'flex-start' }}
              mb={2}
            >
              <Icon 
                as={FaFire} 
                color="orange.400" 
                boxSize={6} 
                mr={2} 
              />
              <StatLabel color="gray.300" fontSize="lg">Current Streak</StatLabel>
            </Flex>
            <StatNumber 
              color="white" 
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
              bgGradient={currentStreak > 5 ? "linear(to-r, orange.400, yellow.400)" : "none"}
              bgClip={currentStreak > 5 ? "text" : "none"}
            >
              {currentStreak || 0} {currentStreak === 1 ? 'day' : 'days'}
            </StatNumber>
            <StatHelpText color="gray.400" fontSize="md" mt={1}>
              Consecutive days of uploads
            </StatHelpText>
          </Skeleton>
        </Stat>
        
        {/* Longest Streak */}
        <Stat textAlign={{ base: 'center', md: 'left' }}>
          <Skeleton isLoaded={!isLoading} borderRadius="md">
            <Flex 
              align="center" 
              justify={{ base: 'center', md: 'flex-start' }}
              mb={2}
            >
              <Icon 
                as={FaTrophy} 
                color="yellow.400" 
                boxSize={6} 
                mr={2} 
              />
              <StatLabel color="gray.300" fontSize="lg">Longest Streak</StatLabel>
            </Flex>
            <StatNumber 
              color="white" 
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
              bgGradient={longestStreak > 10 ? "linear(to-r, yellow.400, yellow.200)" : "none"}
              bgClip={longestStreak > 10 ? "text" : "none"}
            >
              {longestStreak || 0} {longestStreak === 1 ? 'day' : 'days'}
            </StatNumber>
            <StatHelpText color="gray.400" fontSize="md" mt={1}>
              Your best streak record
            </StatHelpText>
          </Skeleton>
        </Stat>
        
        {/* Last Upload */}
        <Stat textAlign={{ base: 'center', md: 'left' }}>
          <Skeleton isLoaded={!isLoading} borderRadius="md">
            <Flex 
              align="center" 
              justify={{ base: 'center', md: 'flex-start' }}
              mb={2}
            >
              <Icon 
                as={FaCalendarCheck} 
                color="green.400" 
                boxSize={6} 
                mr={2} 
              />
              <StatLabel color="gray.300" fontSize="lg">Last Upload</StatLabel>
            </Flex>
            <StatNumber 
              color="white" 
              fontSize={{ base: '3xl', md: '4xl' }}
              fontWeight="bold"
            >
              {formatDate(lastUploadDate)}
            </StatNumber>
            <StatHelpText 
              color={streakAtRisk ? "orange.300" : "gray.400"} 
              fontSize="md"
              mt={1}
            >
              {streakAtRisk ? 'Upload today!' : 'Keep the streak going!'}
            </StatHelpText>
          </Skeleton>
        </Stat>
      </Flex>
      
      {!isLoading && (
        <Tooltip 
          label={currentStreak > 0 ? "Upload again tomorrow to increase your streak!" : "Upload your first sample to start a streak!"} 
          placement="bottom"
          hasArrow
        >
          <Box
            mt={4}
            py={3}
            px={4}
            borderRadius="md"
            bg={streakAtRisk ? "rgba(236, 153, 75, 0.15)" : "rgba(159, 122, 234, 0.1)"}
            borderLeft="4px solid"
            borderColor={streakAtRisk ? "orange.400" : "purple.400"}
            position="relative"
            zIndex="1"
          >
            <Text 
              color={streakAtRisk ? "orange.300" : "purple.300"} 
              textAlign="center"
              fontStyle="italic"
              cursor="help"
              fontWeight="medium"
              fontSize="lg"
            >
              {motivationalMessage}
            </Text>
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

export default StreakDisplay; 
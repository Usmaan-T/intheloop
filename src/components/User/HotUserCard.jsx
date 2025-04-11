import React from 'react';
import {
  Box,
  Flex,
  Text,
  Avatar,
  Badge,
  VStack,
  HStack,
  Icon,
  Circle,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaFire, FaTrophy, FaMedal } from 'react-icons/fa';
import { Link } from 'react-router-dom';

/**
 * A card to display a hot user with their heat score
 * @param {Object} user - The user object containing id, username, photoURL, and heat
 * @param {number} rank - The user's rank (1 for gold, 2 for silver, 3 for bronze)
 */
const HotUserCard = ({ user, rank }) => {
  if (!user) return null;

  // Define medal icons based on rank
  const getMedalIcon = () => {
    switch (rank) {
      case 1:
        return FaTrophy;
      case 2:
      case 3:
        return FaMedal;
      default:
        return null;
    }
  };

  // Define colors and styles based on rank
  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return {
          gradient: 'linear(to-r, yellow.400, orange.300)',
          borderColor: 'yellow.400',
          badgeColor: 'yellow',
          iconColor: 'yellow.400',
          label: '🔥 #1 HOTTEST',
        };
      case 2:
        return {
          gradient: 'linear(to-r, gray.300, gray.400)',
          borderColor: 'gray.300',
          badgeColor: 'gray',
          iconColor: 'gray.300', 
          label: '🔥 #2 HOT',
        };
      case 3:
        return {
          gradient: 'linear(to-r, orange.400, orange.300)',
          borderColor: 'orange.400',
          badgeColor: 'orange',
          iconColor: 'orange.400',
          label: '🔥 #3 HOT',
        };
      default:
        return {
          gradient: 'linear(to-r, red.500, pink.500)',
          borderColor: 'red.500',
          badgeColor: 'red',
          iconColor: 'red.400',
          label: '',
        };
    }
  };

  const MedalIcon = getMedalIcon();
  const { gradient, borderColor, badgeColor, iconColor, label } = getRankStyle();
  const bgGlow = useColorModeValue('0 0 15px rgba(0,0,0,0.1)', '0 0 15px rgba(255,255,255,0.1)');

  return (
    <Link to={`/user/${user.uid}`}>
      <Box
        bgGradient={gradient}
        borderRadius="xl"
        overflow="hidden"
        p={0}
        transition="all 0.3s"
        position="relative"
        boxShadow={`${borderColor} 0 0 5px`}
        h="280px" // Fixed height for consistency
        _hover={{
          transform: 'translateY(-5px) scale(1.02)',
          boxShadow: `${borderColor} 0 0 20px`,
          zIndex: 1,
        }}
      >
        {rank <= 3 && (
          <Flex
            position="absolute"
            top="0"
            right="0"
            bg={borderColor}
            px={2}
            py={1}
            borderBottomLeftRadius="md"
            alignItems="center"
            fontWeight="bold"
            fontSize="xs"
            color="white"
            zIndex={2}
          >
            {label}
          </Flex>
        )}
        
        <Box 
          p={6} 
          bg="blackAlpha.700"
          backdropFilter="blur(5px)"
          h="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={4} w="100%">
            <Box position="relative">
              <Avatar 
                size="2xl" 
                src={user.photoURL} 
                name={user.username}
                border="3px solid"
                borderColor={borderColor}
                boxShadow={bgGlow}
              />
              
              {MedalIcon && (
                <Circle
                  position="absolute"
                  bottom="-2px"
                  right="-2px"
                  size="32px"
                  bg={borderColor}
                  color="white"
                >
                  <Icon as={MedalIcon} fontSize="16px" />
                </Circle>
              )}
            </Box>
            
            <VStack spacing={1} w="100%">
              <Text 
                fontWeight="extrabold" 
                color="white" 
                noOfLines={1}
                fontSize="xl"
                letterSpacing="tight"
                textAlign="center"
              >
                {user.username}
              </Text>
              
              <Flex 
                alignItems="center" 
                bg="blackAlpha.400" 
                px={4} 
                py={2} 
                borderRadius="full"
                border="1px solid"
                borderColor={borderColor}
                mt={2}
              >
                <Icon as={FaFire} color={iconColor} mr={2} />
                <Text 
                  fontWeight="bold" 
                  fontSize="md"
                  color="white"
                >
                  {Math.round(user.heat)} Heat
                </Text>
              </Flex>
            </VStack>
          </VStack>
        </Box>
      </Box>
    </Link>
  );
};

export default HotUserCard; 
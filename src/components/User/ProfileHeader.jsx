import React from 'react';
import {
  Box,
  Container,
  Flex,
  Text,
  Avatar,
  Heading,
  HStack,
  Badge,
  Tooltip,
  Button,
  Stat,
  StatNumber,
  StatLabel,
  Wrap,
  WrapItem,
  Icon,
  useBreakpointValue
} from '@chakra-ui/react';
import { FaFire, FaMusic, FaListAlt, FaUsers } from 'react-icons/fa';
import FollowButton from './FollowButton';
import useUserPopularity from '../../hooks/useUserPopularity';

const ProfileHeader = ({ 
  user, 
  stats = { samples: 0, playlists: 0, followers: 0 },
  showFollowButton = true,
  currentUser = null,
  onFollowChange = () => {},
  popularityScore,
  onEditClick,
  loading = false,
  children 
}) => {
  if (!user) return null;
  
  // Use our popularity hook if not provided
  const popularity = popularityScore || useUserPopularity(user.id)?.popularityScore;
  
  // Responsive avatar size
  const avatarSize = useBreakpointValue({ base: 'xl', md: '2xl' });
  
  return (
    <Box 
      bg="rgba(20, 20, 30, 0.9)" 
      py={8} 
      px={5}
      borderRadius="xl"
      borderWidth="1px"
      borderColor="whiteAlpha.300"
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.2)"
    >
      <Flex 
        direction={{ base: 'column', md: 'row' }}
        align={{ base: 'center', md: 'flex-start' }}
        gap={{ base: 6, md: 10 }}
      >
        <Avatar
          size={avatarSize}
          name={user.username || user.displayName || 'User'}
          src={user.photoURL}
          border="4px solid"
          borderColor="whiteAlpha.300"
          boxShadow="0 4px 12px rgba(0, 0, 0, 0.3)"
        />
        
        <Box flex="1">
          <Flex 
            justify={{ base: 'center', md: 'space-between' }}
            align={{ base: 'center', md: 'flex-start' }}
            direction={{ base: 'column', md: 'row' }}
            gap={{ base: 4, md: 0 }}
            mb={4}
          >
            <Box textAlign={{ base: 'center', md: 'left' }}>
              <Heading color="white" size="xl">
                {user.username || user.displayName || 'User'}
              </Heading>
              
              {/* Heat badge (weekly popularity) */}
              <Flex mt={2} align="center" justify={{ base: 'center', md: 'flex-start' }}>
                <Tooltip label="Weekly popularity score of all user's tracks - aka Heat">
                  <Badge 
                    colorScheme="red" 
                    px={3} 
                    py={1} 
                    fontSize="md"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                  >
                    <Icon as={FaFire} mr={1} />
                    Heat: {popularity?.weekly || 0}
                  </Badge>
                </Tooltip>
              </Flex>
            </Box>
            
            {(!showFollowButton && currentUser) ? (
              <Button 
                onClick={onEditClick}
                colorScheme="purple" 
                variant="outline"
                size="md"
                borderRadius="md"
                mt={{ base: 2, md: 0 }}
                _hover={{ bg: 'whiteAlpha.200' }}
              >
                Edit Profile
              </Button>
            ) : showFollowButton && currentUser && (
              <FollowButton 
                userId={user.id} 
                currentUser={currentUser} 
                onFollowChange={onFollowChange}
              />
            )}
          </Flex>
          
          {user.bio && (
            <Text 
              mt={2} 
              color="gray.300"
              fontSize="md"
              textAlign={{ base: 'center', md: 'left' }}
              maxW="700px"
              lineHeight="tall"
            >
              {user.bio}
            </Text>
          )}
          
          <Wrap 
            mt={6} 
            spacing={{ base: 4, md: 8 }}
            justify={{ base: 'center', md: 'flex-start' }}
          >
            <WrapItem>
              <Stat minW="90px" textAlign={{ base: 'center', md: 'left' }}>
                <Flex align="center" justify={{ base: 'center', md: 'flex-start' }} mb={1}>
                  <Icon as={FaMusic} color="purple.400" mr={1} />
                  <StatLabel color="gray.300" fontSize="sm">Samples</StatLabel>
                </Flex>
                <StatNumber color="white" fontSize="2xl">
                  {stats.samples || 0}
                </StatNumber>
              </Stat>
            </WrapItem>
            
            <WrapItem>
              <Stat minW="90px" textAlign={{ base: 'center', md: 'left' }}>
                <Flex align="center" justify={{ base: 'center', md: 'flex-start' }} mb={1}>
                  <Icon as={FaListAlt} color="green.400" mr={1} />
                  <StatLabel color="gray.300" fontSize="sm">Playlists</StatLabel>
                </Flex>
                <StatNumber color="white" fontSize="2xl">
                  {stats.playlists || 0}
                </StatNumber>
              </Stat>
            </WrapItem>
            
            <WrapItem>
              <Stat minW="90px" textAlign={{ base: 'center', md: 'left' }}>
                <Flex align="center" justify={{ base: 'center', md: 'flex-start' }} mb={1}>
                  <Icon as={FaUsers} color="blue.400" mr={1} />
                  <StatLabel color="gray.300" fontSize="sm">Followers</StatLabel>
                </Flex>
                <StatNumber color="white" fontSize="2xl">
                  {stats.followers || user.followers?.length || 0}
                </StatNumber>
              </Stat>
            </WrapItem>
            
            <WrapItem>
              <Stat minW="110px" textAlign={{ base: 'center', md: 'left' }}>
                <Flex align="center" justify={{ base: 'center', md: 'flex-start' }} mb={1}>
                  <Icon as={FaFire} color="red.400" mr={1} />
                  <StatLabel color="gray.300" fontSize="sm">Popularity</StatLabel>
                </Flex>
                <StatNumber color="white" fontSize="2xl">
                  {popularity?.allTime || 0}
                </StatNumber>
              </Stat>
            </WrapItem>
          </Wrap>
          
          {/* Allow custom content */}
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default ProfileHeader;

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
} from '@chakra-ui/react';
import FollowButton from './FollowButton';
import useUserPopularity from '../../hooks/useUserPopularity';

const ProfileHeader = ({ 
  user, 
  stats = { samples: 0, playlists: 0, followers: 0 },
  showFollowButton = true,
  currentUser = null,
  onFollowChange = () => {},
  children 
}) => {
  if (!user) return null;
  
  // Use our popularity hook
  const { popularityScore } = useUserPopularity(user.id);
  
  return (
    <Box bg="rgba(20, 20, 30, 0.8)" py={10} borderBottom="1px solid" borderColor="whiteAlpha.200">
      <Container maxW="container.xl" px={{ base: 4, lg: 8 }}>
        <Flex 
          direction={{ base: 'column', md: 'row' }}
          align={{ base: 'center', md: 'flex-start' }}
          gap={8}
        >
          <Avatar
            size="2xl"
            name={user.username || user.displayName || 'User'}
            src={user.photoURL}
            border="4px solid"
            borderColor="whiteAlpha.300"
          />
          
          <Box flex="1">
            <Heading color="white" size="xl">
              {user.username || user.displayName || 'User'}
            </Heading>
            
            {/* Heat badge (weekly popularity) */}
            <Tooltip label="Weekly popularity score of all user's tracks - aka Heat">
              <Badge colorScheme="red" px={2} py={1} mt={2} fontSize="sm">
                Heat: {popularityScore?.weekly || 0}
              </Badge>
            </Tooltip>
            
            {user.bio && (
              <Text mt={2} color="gray.300">
                {user.bio}
              </Text>
            )}
            
            <HStack mt={4} spacing={4}>
              <Text color="gray.400">
                <Text as="span" fontWeight="bold" color="white">
                  {stats.samples || 0}
                </Text> Samples
              </Text>
              <Text color="gray.400">
                <Text as="span" fontWeight="bold" color="white">
                  {stats.playlists || 0}
                </Text> Playlists
              </Text>
              <Text color="gray.400">
                <Text as="span" fontWeight="bold" color="white">
                  {stats.followers || user.followers?.length || 0}
                </Text> Followers
              </Text>
              <Text color="gray.400">
                <Text as="span" fontWeight="bold" color="white">
                  {popularityScore?.weekly || 0}
                </Text> Popularity
              </Text>
            </HStack>
            
            {showFollowButton && currentUser && (
              <Box mt={4}>
                <FollowButton 
                  userId={user.id} 
                  currentUser={currentUser} 
                  onFollowChange={onFollowChange}
                />
              </Box>
            )}
            
            {/* Allow custom content like Edit Profile button */}
            {children}
          </Box>
        </Flex>
      </Container>
    </Box>
  );
};

export default ProfileHeader;

import React from 'react';
import {
  Box, Flex, Avatar, Heading, Text, Button, VStack
} from '@chakra-ui/react';

const ProfileHeader = ({ profileData, user, onEditClick }) => {
  return (
    <Box 
      bg="rgba(20, 20, 30, 0.8)"
      backdropFilter="blur(10px)"
      borderRadius="lg"
      p={6}
      mb={8}
      border="1px solid"
      borderColor="whiteAlpha.200"
    >
      <Flex 
        direction={{ base: "column", md: "row" }}
        align="center"
      >
        {/* Profile Image */}
        <Box 
          position="relative" 
          mr={{ base: 0, md: 6 }} 
          mb={{ base: 4, md: 0 }}
          onClick={onEditClick}
          cursor="pointer"
        >
          <Avatar 
            size="xl" 
            src={profileData?.photoURL || user?.photoURL} 
            name={profileData?.username || user?.displayName || user?.email?.charAt(0)}
            bg="purple.500"
            boxShadow="lg"
          />
          {/* Hover overlay */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            borderRadius="full"
            bg="blackAlpha.600"
            opacity={0}
            transition="all 0.3s"
            _hover={{ opacity: 0.7 }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="xs" color="white" fontWeight="bold">
              Edit
            </Text>
          </Box>
        </Box>
        
        {/* User Info */}
        <VStack align={{ base: "center", md: "flex-start" }} spacing={1}>
          <Heading as="h3" size="md" color="white">
            {profileData?.username || user?.displayName || 'User'}
          </Heading>
          <Text color="gray.400" fontSize="sm">
            {user?.email}
          </Text>
          {profileData?.bio && (
            <Text color="gray.300" fontSize="sm" mt={1} maxW="400px">
              {profileData.bio}
            </Text>
          )}
          <Button 
            onClick={onEditClick}
            size="sm"
            colorScheme="purple"
            variant="outline"
            mt={2}
          >
            Edit Profile
          </Button>
        </VStack>
      </Flex>
    </Box>
  );
};

export default ProfileHeader;

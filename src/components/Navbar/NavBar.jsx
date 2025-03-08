import React from 'react';
import { 
  Box, 
  Flex, 
  Button, 
  Heading, 
  Spacer, 
  Link, 
  HStack, 
  Image, 
  useColorModeValue 
} from '@chakra-ui/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { useLogout } from '../../hooks/useLogout';

const NavBar = () => {
  const [user] = useAuthState(auth);
  const { handleLogout, error, loading } = useLogout();
  
  const bgColor = useColorModeValue('red.600', 'red.600');
  const textColor = useColorModeValue('white', 'white');

  return (
    <Box bg={bgColor} color={textColor} px={6} py={3} boxShadow="md">
      <Flex align="center">
        {/* Logo and Site Name */}
        <HStack spacing={3}>
          <Image src="intheloop.png" alt="Logo" boxSize="20px" />
          <Heading as="h1" size="md">
            In the Loop
          </Heading>
        </HStack>

        <Spacer />

        {/* Navigation Links */}
        <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
          <Link href="/" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
            Home
          </Link>
          <Link href="/beats" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
            Explore
          </Link>
          <Link href="/samples" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
            Samples
          </Link>
          <Link href="/collab" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
            Upload
          </Link>
          <Link href="/tutorials" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
            Your Profile
          </Link>
          <Link href="/marketplace" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
            Daily
          </Link>
          <Link href="/community" fontWeight="medium" _hover={{ textDecoration: 'underline' }}>
            Community
          </Link>
        </HStack>

        <Spacer />

        {/* Auth Buttons */}
        <HStack spacing={4}>
          {user ? (
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              color={textColor} 
              _hover={{ bg: 'red.500' }}
              isLoading={loading}
            >
              Logout
            </Button>
          ) : (
            <>
              <Button 
                as={Link} 
                href="/login" 
                variant="ghost" 
                color={textColor} 
                _hover={{ bg: 'red.500' }}
              >
                Sign in
              </Button>
              <Button 
                as={Link} 
                href="/register" 
                variant="solid" 
                colorScheme="red"
              >
                Register
              </Button>
            </>
          )}
        </HStack>
      </Flex>
      {error && (
        <Box mt={2} color="yellow.300" textAlign="center">
          {error}
        </Box>
      )}
    </Box>
  );
};

export default NavBar;
 
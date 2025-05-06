import React from 'react';
import {
    Box,
    Container,
    Flex,
    Text,
    Heading,
    Button,
    VStack,
    SimpleGrid,
    Image,
    useColorModeValue,
    Link,
    HStack,
    Icon
  } from '@chakra-ui/react';
import { FaSoundcloud, FaYoutube, FaInstagram, FaDiscord } from 'react-icons/fa';
import logoImage from '../../assets/in-the-loop-high-resolution-logo (1).png';

const Footer = () => {
  return (
    <Box as="footer" py={10} borderTop="1px" borderColor="gray.700" bg="rgba(10, 10, 14, 0.9)" backdropFilter="blur(10px)">
    <Container maxW="container.xl">
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
        <VStack align="flex-start" spacing={4}>
          <Heading as="h3" size="sm" color="brand.400">
            Explore Samples
          </Heading>
          <VStack align="flex-start" spacing={2}>
            <Link href="/samples?sort=trending" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Trending Samples</Link>
            <Link href="/samples?tags=drums" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Drum Kits</Link>
            <Link href="/samples?tags=melody" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Melodies</Link>
            <Link href="/samples?tags=bass" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Bass Loops</Link>
            <Link href="/daily" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Sample of the Day</Link>
          </VStack>
        </VStack>

        <VStack align="flex-start" spacing={4}>
          <Heading as="h3" size="sm" color="brand.400">
            Music Production
          </Heading>
          <VStack align="flex-start" spacing={2}>
            <Link href="/tutorials" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Tutorials</Link>
            <Link href="/samples?tags=free" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Free Resources</Link>
            <Link href="/challenges" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Beat Challenges</Link>
            <Link href="/collaborations" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Collaborations</Link>
            <Link href="/licensing" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Licensing Info</Link>
          </VStack>
        </VStack>

        <VStack align="flex-start" spacing={4}>
          <Heading as="h3" size="sm" color="brand.400">
            Community
          </Heading>
          <VStack align="flex-start" spacing={2}>
            <Link href="/feedback" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Submit Feedback</Link>
            <Link href="/support" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Support</Link>
            <Link href="/faq" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>FAQ</Link>
            <Link href="/creators" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Top Creators</Link>
            <Link href="/blog" color="whiteAlpha.800" _hover={{ color: 'brand.400' }}>Production Blog</Link>
          </VStack>
        </VStack>

        <VStack align="flex-start" spacing={4}>
          <Image src={logoImage} alt="In The Loop Logo" h="40px" mb={4} />
          <Text color="whiteAlpha.800" fontSize="sm" mb={2}>
            Your daily source for high-quality samples, loops, and beats to fuel your music production journey.
          </Text>
          <HStack spacing={4} mt={2}>
            <Icon 
              as={FaSoundcloud} 
              boxSize={5} 
              color="whiteAlpha.700" 
              _hover={{ color: 'brand.400' }} 
              cursor="pointer" 
            />
            <Icon 
              as={FaYoutube} 
              boxSize={5} 
              color="whiteAlpha.700" 
              _hover={{ color: 'brand.400' }} 
              cursor="pointer" 
            />
            <Icon 
              as={FaInstagram} 
              boxSize={5} 
              color="whiteAlpha.700" 
              _hover={{ color: 'brand.400' }} 
              cursor="pointer" 
            />
            <Icon 
              as={FaDiscord} 
              boxSize={5} 
              color="whiteAlpha.700" 
              _hover={{ color: 'brand.400' }} 
              cursor="pointer" 
            />
          </HStack>
        </VStack>
      </SimpleGrid>
      
      <Box mt={10} pt={6} borderTop="1px solid" borderColor="whiteAlpha.100">
        <Flex 
          direction={{ base: 'column', md: 'row' }} 
          justify="space-between" 
          align={{ base: 'center', md: 'center' }}
          gap={4}
        >
          <Text color="whiteAlpha.600" fontSize="sm">
            © {new Date().getFullYear()} In The Loop. All rights reserved.
          </Text>
          <HStack spacing={6}>
            <Link href="/terms" color="whiteAlpha.600" fontSize="sm" _hover={{ color: 'whiteAlpha.800' }}>
              Terms of Service
            </Link>
            <Link href="/privacy" color="whiteAlpha.600" fontSize="sm" _hover={{ color: 'whiteAlpha.800' }}>
              Privacy Policy
            </Link>
            <Link href="/cookies" color="whiteAlpha.600" fontSize="sm" _hover={{ color: 'whiteAlpha.800' }}>
              Cookie Policy
            </Link>
          </HStack>
        </Flex>
      </Box>
    </Container>
  </Box>
  )
}

export default Footer
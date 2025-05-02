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
    Link
  } from '@chakra-ui/react';
import logoImage from '../../assets/in-the-loop-high-resolution-logo (1).png';

const Footer = () => {
  return (
    <Box as="footer" py={10} borderTop="1px" borderColor="gray.700">
    <Container maxW="container.xl">
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={8}>
        {/* Footer links can be organized as needed */}
        <VStack align="flex-start" spacing={4}>
          <Heading as="h3" size="sm">
            Use Cases
          </Heading>
          <VStack align="flex-start" spacing={2}>
            <Link to="/ui-design">UI Design</Link>
            <Link to="/ux-design">UX Design</Link>
            <Link to="/wireframing">Wireframing</Link>
            <Link to="/diagramming">Diagramming</Link>
            <Link to="/brainstorming">Brainstorming</Link>
          </VStack>
        </VStack>

        <VStack align="flex-start" spacing={4}>
          <Heading as="h3" size="sm">
            Explore
          </Heading>
          <VStack align="flex-start" spacing={2}>
            <Link to="/design">Design</Link>
            <Link to="/prototyping">Prototyping</Link>
            <Link to="/dev-features">Development Features</Link>
            <Link to="/design-systems">Design Systems</Link>
          </VStack>
        </VStack>

        <VStack align="flex-start" spacing={4}>
          <Heading as="h3" size="sm">
            Resources
          </Heading>
          <VStack align="flex-start" spacing={2}>
            <Link to="/blog">Blog</Link>
            <Link to="/support">Support</Link>
            <Link to="/developers">Developers</Link>
            <Link to="/resource-library">Resource Library</Link>
          </VStack>
        </VStack>

        <VStack align="flex-start" spacing={4}>
          <Image src={logoImage} alt="The Loop Logo" h="40px" mb={4} />
          <Flex gap={4}>
            {[
              { href: 'https://twitter.com', src: '/images/twitter.svg', alt: 'Twitter' },
              { href: 'https://instagram.com', src: '/images/instagram.svg', alt: 'Instagram' },
              { href: 'https://youtube.com', src: '/images/youtube.svg', alt: 'YouTube' },
              { href: 'https://linkedin.com', src: '/images/linkedin.svg', alt: 'LinkedIn' },
            ].map((social, idx) => (
              <Box
                key={idx}
                as="a"
                href={social.href}
                target="_blank"
                p={2}
                borderRadius="full"
                bg="gray.700"
                _hover={{ bg: 'red.500' }}
              >
                <Image src={social.src} alt={social.alt} boxSize="16px" />
              </Box>
            ))}
          </Flex>
        </VStack>
      </SimpleGrid>
    </Container>
  </Box>
  )
}

export default Footer
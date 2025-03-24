
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
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';

// ==================== Landing Page Sections ====================

const HeroSection = () => (
  <Box as="section" py={20} bgGradient="linear(to-r, gray.900, gray.800)">
    <Container maxW="container.xl">
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align="center"
        justify="space-between"
        gap={16}
      >
        <VStack align="flex-start" spacing={6} flex={1}>
          <Heading as="h1" size="2xl">
            Stay in the Loop
          </Heading>
          <Text fontSize="lg" color="gray.300">
            Music collaboration has never been easier. Join thousands of producers
            for free and drag & drop sounds right from the website.
          </Text>
          <Button
            as={Link}
            to="/auth"
            size="lg"
            colorScheme="red"
            px={10}
            _hover={{ bg: 'red.600' }}
          >
            Sign Up
          </Button>
        </VStack>
        <Box flex={1} boxShadow="2xl" borderRadius="lg" overflow="hidden">
          <Image
            src="producerworking.png"
            alt="Music producer working in studio"
            w="full"
            objectFit="cover"
          />
        </Box>
      </Flex>
    </Container>
  </Box>
);

const CollaborationSection = () => (
  <Box as="section" py={20}>
    <Container maxW="container.xl">
      <Flex
        direction={{ base: 'column', md: 'row-reverse' }}
        align="center"
        justify="space-between"
        gap={16}
      >
        <VStack align="flex-start" spacing={6} flex={1}>
          <Heading as="h2" size="xl">
            Collaborate with Top Producers
          </Heading>
          <Text fontSize="lg" color="gray.300">
            Easily share, download, and discover samples that spark your creativity.
          </Text>
          <Button
            as={Link}
            to="/explore"
            size="lg"
            colorScheme="red"
            px={10}
            _hover={{ bg: 'red.600' }}
          >
            Explore
          </Button>
        </VStack>
        <Box flex={1} boxShadow="2xl" borderRadius="lg" overflow="hidden">
          <Image
            src="producer.png"
            alt="Producer at mixing console"
            w="full"
            objectFit="cover"
          />
        </Box>
      </Flex>
    </Container>
  </Box>
);

const CompetitionSection = () => (
  <Box as="section" py={20} bg="gray.800">
    <Container maxW="container.xl">
      <Flex
        direction={{ base: 'column', md: 'row' }}
        align="center"
        justify="space-between"
        gap={16}
      >
        <VStack align="flex-start" spacing={6} flex={1}>
          <Heading as="h2" size="xl" color="white">
            Compete for the Crown
          </Heading>
          <Text fontSize="lg" color="gray.300">
            Think you have what it takes? Join our daily tournament and show your skills.
          </Text>
          <Button
            as={Link}
            to="/join"
            size="lg"
            colorScheme="red"
            px={10}
            _hover={{ bg: 'red.600' }}
          >
            Join Now
          </Button>
        </VStack>
        <Box flex={1} boxShadow="2xl" borderRadius="lg" overflow="hidden">
          <Image
            src="producer2.png"
            alt="Music competition with crowd"
            w="full"
            objectFit="cover"
          />
        </Box>
      </Flex>
    </Container>
  </Box>
);

const TestimonialsSection = ({ cardBgColor }) => {
  const testimonials = [
    {
      src: 'alchemist.png',
      alt: 'The Alchemist',
      text:
        'Finding inspiration has never been easier. The endless sea of samples keeps me motivated.',
      name: 'The Alchemist',
    },
    {
      src: 'boi1da.png',
      alt: 'Bolda',
      text:
        'Collaborating with fellow producers brings a fresh vibe to my music.',
      name: 'Bolda',
    },
    {
      src: 'metro.png',
      alt: 'Metro',
      text: 'The diversity of samples available is simply mind-blowing!',
      name: 'Metro',
    },
  ];

  return (
    <Box as="section" py={20}>
      <Container maxW="container.xl">
        <VStack spacing={12}>
          <Heading as="h2" size="xl" textAlign="center">
            Trusted by Leading Creators
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8} w="full">
            {testimonials.map((item, index) => (
              <Box
                key={index}
                bg={cardBgColor}
                borderRadius="lg"
                p={8}
                boxShadow="lg"
              >
                <VStack spacing={4}>
                  <Image
                    src={item.src}
                    alt={item.alt}
                    borderRadius="full"
                    boxSize="150px"
                    objectFit="cover"
                  />
                  <Text textAlign="center" fontSize="md">
                    {item.text}
                  </Text>
                  <Text fontWeight="bold" color="red.500" fontSize="lg">
                    {item.name}
                  </Text>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};


const LandingPage = ({ bgColor, textColor, cardBgColor }) => (
  <Box bg={bgColor} color={textColor} minH="100vh">
    <NavBar />
    <HeroSection />
    <CollaborationSection />
    <CompetitionSection />
    <TestimonialsSection cardBgColor={cardBgColor} />
    <Footer />
  </Box>
);

// ==================== Dashboard (for logged in users) ====================

const Dashboard = ({ user }) => (
  <Box>
    <NavBar />
    <Container maxW="container.xl" py={10}>
      <VStack spacing={10} align="flex-start">
        <Heading size="xl">Welcome, {user.email}</Heading>
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} w="full">
          {[
            {
              title: 'Your Projects',
              text: 'You have 0 active projects.',
              btnText: 'Create New Project',
            },
            {
              title: 'Recent Activity',
              text: 'No recent activity.',
              btnText: 'Browse Community',
            },
            {
              title: 'Tournaments',
              text: 'No active tournaments.',
              btnText: 'Join Tournament',
            },
          ].map((item, index) => (
            <Box key={index} bg="gray.100" p={8} borderRadius="lg" boxShadow="lg">
              <VStack align="flex-start" spacing={4}>
                <Heading size="md">{item.title}</Heading>
                <Text>{item.text}</Text>
                <Button colorScheme="blue">{item.btnText}</Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
        <Box w="full" py={4}>
          <Heading size="lg" mb={4}>Recommended Samples</Heading>
          <Text>Loading samples...</Text>
        </Box>
      </VStack>
    </Container>
  </Box>
);

// ==================== Main Home Component ====================

const Home = () => {
  const [user] = useAuthState(auth);
  const bgColor = useColorModeValue('gray.900', 'gray.900');
  const textColor = useColorModeValue('white', 'white');
  const cardBgColor = useColorModeValue('gray.800', 'gray.800');

  return !user ? (
    <LandingPage bgColor={bgColor} textColor={textColor} cardBgColor={cardBgColor} />
  ) : (
    <Dashboard user={user} />
  );
};

export default Home;

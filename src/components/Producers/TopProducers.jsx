import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Flex,
  Avatar,
  HStack,
  VStack,
  Badge,
  Icon,
  Spinner,
  Button,
  useColorModeValue,
  Link
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FaFire, FaTrophy, FaStar } from 'react-icons/fa';
import useUserStreaks from '../../hooks/useUserStreaks';

const TopProducers = ({ limit = 5 }) => {
  const [topProducers, setTopProducers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { getTopStreakUsers } = useUserStreaks();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  useEffect(() => {
    const fetchTopProducers = async () => {
      try {
        setLoading(true);
        const result = await getTopStreakUsers(limit);
        
        if (result.success) {
          setTopProducers(result.users);
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error("Error fetching top producers:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopProducers();
  }, [limit, getTopStreakUsers]);
  
  if (loading) {
    return (
      <Box 
        p={6} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        bg={bgColor}
        boxShadow="md"
      >
        <Heading size="md" mb={4}>Top Producers</Heading>
        <Flex justify="center" align="center" py={8}>
          <Spinner color="purple.500" size="lg" />
        </Flex>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box 
        p={6} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor="red.200"
        bg={bgColor}
        boxShadow="md"
      >
        <Heading size="md" mb={4}>Top Producers</Heading>
        <Text color="red.500">Error loading top producers: {error}</Text>
      </Box>
    );
  }
  
  if (topProducers.length === 0) {
    return (
      <Box 
        p={6} 
        borderRadius="lg" 
        borderWidth="1px" 
        borderColor={borderColor}
        bg={bgColor}
        boxShadow="md"
      >
        <Heading size="md" mb={4}>Top Producers</Heading>
        <Text>No producers with active streaks found.</Text>
      </Box>
    );
  }
  
  return (
    <Box 
      p={6} 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="md"
    >
      <HStack mb={4} justify="space-between">
        <Heading size="md">Top Producers</Heading>
        <Badge 
          colorScheme="purple" 
          px={2} 
          py={1} 
          borderRadius="md"
          display="flex"
          alignItems="center"
        >
          <Icon as={FaFire} mr={1} />
          Streaks
        </Badge>
      </HStack>
      
      <VStack spacing={4} align="stretch">
        {topProducers.map((producer, index) => (
          <Flex 
            key={producer.id} 
            p={3} 
            borderRadius="md" 
            alignItems="center"
            bg={index === 0 ? "yellow.50" : "transparent"}
            borderLeft={index === 0 ? "4px solid" : "none"}
            borderColor={index === 0 ? "yellow.400" : "transparent"}
          >
            {index === 0 && (
              <Icon as={FaTrophy} color="yellow.500" boxSize={6} mr={3} />
            )}
            
            <Flex alignItems="center" flex={1}>
              <Link as={RouterLink} to={`/profile/${producer.id}`}>
                <Avatar 
                  name={producer.displayName || producer.username} 
                  src={producer.photoURL} 
                  size="md" 
                  mr={3}
                />
              </Link>
              
              <Box>
                <Link 
                  as={RouterLink} 
                  to={`/profile/${producer.id}`}
                  fontWeight="bold"
                  _hover={{ color: "purple.500", textDecoration: "none" }}
                >
                  {producer.displayName || producer.username}
                </Link>
                
                <HStack spacing={3}>
                  <Flex align="center">
                    <Icon as={FaFire} color="orange.500" mr={1} />
                    <Text fontWeight="bold">{producer.currentStreak}</Text>
                    <Text fontSize="sm" color="gray.500" ml={1}>days</Text>
                  </Flex>
                  
                  {producer.longestStreak > producer.currentStreak && (
                    <Flex align="center">
                      <Icon as={FaStar} color="purple.500" mr={1} />
                      <Text fontWeight="bold">{producer.longestStreak}</Text>
                      <Text fontSize="sm" color="gray.500" ml={1}>best</Text>
                    </Flex>
                  )}
                </HStack>
              </Box>
            </Flex>
            
            {index === 0 && (
              <Badge colorScheme="yellow" px={2} py={1} borderRadius="full">
                #1
              </Badge>
            )}
          </Flex>
        ))}
      </VStack>
      
      <Button 
        variant="outline" 
        colorScheme="purple" 
        size="sm" 
        mt={4} 
        width="100%"
      >
        View All Producers
      </Button>
    </Box>
  );
};

export default TopProducers; 
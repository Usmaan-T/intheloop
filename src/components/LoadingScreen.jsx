import React from 'react';
import { Box, Flex, Image, Spinner, Text } from '@chakra-ui/react';
import { motion } from 'framer-motion';
import logoImage from '../assets/in-the-loop-high-resolution-logo (1).png';

// Create animated components with framer-motion
const MotionBox = motion(Box);
const MotionImage = motion(Image);

/**
 * A loading screen component that displays a logo and spinner
 * Can be used during initial app load or data fetching operations
 */
const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <Flex 
      direction="column" 
      align="center" 
      justify="center" 
      minHeight="100vh"
      bgGradient="linear(to-r, red.900, #6F0A14, red.900)"
      p={4}
    >
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        mb={8}
      >
        <MotionImage
          src={logoImage}
          alt="The Loop Logo"
          width="200px"
          objectFit="contain"
          animate={{ 
            scale: [1, 1.05, 1],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </MotionBox>
      
      <Spinner 
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.700"
        color="red.500"
        size="xl"
        mb={4}
      />
      
      <Text 
        color="white" 
        fontSize="xl" 
        fontWeight="medium"
        textAlign="center"
      >
        {message}
      </Text>
    </Flex>
  );
};

export default LoadingScreen; 
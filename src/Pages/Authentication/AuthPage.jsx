import React, { useState, useEffect } from "react";
import SignUp from "./SignUp";
import LogIn from "./LogIn";
import { Flex, Box, Image, Text, useBreakpointValue } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import NavBar from '../../components/Navbar/NavBar';
import logoImage from '../../assets/in-the-loop-high-resolution-logo (1).png';
import { motion } from 'framer-motion';

// Motion components
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const location = useLocation();
  
  // Check for URL parameters to determine initial view
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const mode = searchParams.get('mode');
    // If mode=register, show signup form
    setIsLogin(mode !== 'register');
  }, [location]);

  // Responsive design adjustments
  const flexDirection = useBreakpointValue({ base: "column", lg: "row" });
  const formWidth = useBreakpointValue({ base: "90%", md: "500px", lg: "450px" });
  
  return (
    <>
      <NavBar />
      <MotionFlex 
        minH="calc(100vh - 100px)" 
        direction={flexDirection}
        justify="center" 
        align="center" 
        bgGradient="linear(to-b, #121212, #5e0000, #121212)"
        px={4}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Left side - Branding */}
        <MotionFlex 
          direction="column" 
          align="center" 
          justify="center"
          flex="1"
          p={8}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          display={{ base: "none", lg: "flex" }}
        >
          <Image 
            src={logoImage}
            alt="The Loop Logo"
            width="300px"
            mb={6}
          />
          <Text 
            fontSize="2xl" 
            fontWeight="bold" 
            color="white" 
            mb={4}
            textAlign="center"
          >
            Your Gateway to Music Creation
          </Text>
          <Text 
            fontSize="md" 
            color="whiteAlpha.800" 
            maxW="600px"
            textAlign="center"
          >
            Join thousands of artists discovering new samples, sharing tracks, and connecting with the global music community.
          </Text>
        </MotionFlex>

        {/* Right side - Form */}
        <MotionBox
          w={formWidth}
          borderWidth="1px"
          borderRadius="xl"
          p={8}
          bg="rgba(20, 20, 30, 0.8)"
          backdropFilter="blur(10px)"
          boxShadow="0 4px 30px rgba(0, 0, 0, 0.4)"
          borderColor="whiteAlpha.200"
          color="white"
          m={{ base: 6, lg: 10 }}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {isLogin ? <LogIn /> : <SignUp />}
          <Flex justify="center" mt={4}>
            <Text 
              as="button" 
              fontSize="sm" 
              color="whiteAlpha.800"
              _hover={{ color: "red.400" }}
              onClick={() => setIsLogin(!isLogin)}
              transition="all 0.2s"
            >
              {isLogin ? "New to The Loop? " : "Already have an account? "}
              <Text as="span" color="red.300" fontWeight="bold">
                {isLogin ? "Create an account" : "Log in"}
              </Text>
            </Text>
          </Flex>
        </MotionBox>
      </MotionFlex>
    </>
  );
};

export default AuthPage;

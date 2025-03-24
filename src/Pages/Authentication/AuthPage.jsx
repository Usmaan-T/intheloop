import React, { useState, useEffect } from "react";
import SignUp from "./SignUp";
import LogIn from "./LogIn";
import { Flex, Box } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import NavBar from '../../components/Navbar/NavBar';

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
  
  return (
    <>
      <NavBar />
      <Flex 
        minH="90vh" 
        justify="center" 
        align="center" 
        bgColor="blackAlpha.900" 
        px={4}
        bgImage="linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8)), url('/background.jpg')"
        bgSize="cover"
        bgPosition="center"
      >
        <Box
          maxW="md"
          w="full"
          borderWidth="1px"
          borderRadius="lg"
          p={8}
          bg="rgba(20, 20, 30, 0.8)"
          boxShadow="dark-lg"
          borderColor="whiteAlpha.200"
          color="white"
        >
          {isLogin ? <LogIn /> : <SignUp />}
          <Flex justify="center" mt={4}>
            <Box 
              as="button" 
              textDecoration="underline" 
              fontSize="sm" 
              color="red.300"
              _hover={{ color: "red.400" }}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
            </Box>
          </Flex>
        </Box>
      </Flex>
    </>
  );
};

export default AuthPage;

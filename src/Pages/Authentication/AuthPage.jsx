import React, { useState } from "react";
import SignUp from "./SignUp";
import LogIn from "./LogIn";
import { Flex, Box} from '@chakra-ui/react'

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  
  return (
    <>
      <Flex minH="100vh" justify="center" align="center" bgGradient="linear(to-r, gray.900, gray.800)" px={4}>
        <Box
          maxW="md"
          w="full"
          borderWidth="1px"
          borderRadius="lg"
          p={8}
          bg="white"
          boxShadow="lg"
        >
            {isLogin ? <LogIn /> : <SignUp />}
          <Flex justify="center">
            <Box as="button" textDecoration="underline" fontSize="sm" onClick={() => setIsLogin(!isLogin)}>
              Already have an account? Log In
            </Box>
          </Flex>
        </Box>
      </Flex>
    </>
  );
};

export default AuthPage;

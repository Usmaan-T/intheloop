import React, { useState } from "react";
import { useSignInWithEmailAndPassword, useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase/firebase";
import { 
  Flex,
  Box,
  Input,
  FormControl,
  FormLabel,
  Heading,
  Button,
  Text,
  VStack,
  Divider,
  HStack,
  Icon
} from "@chakra-ui/react";
import { Navigate } from "react-router-dom";
import { FaGoogle, FaApple } from "react-icons/fa";

const LogIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);
  const [currentUser] = useAuthState(auth);

  // If user is logged in, redirect them to the home page.
  if (currentUser || user) {
    return <Navigate to="/" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      console.log("Please fill in all fields");
      return;
    }
    await signInWithEmailAndPassword(email, password);
  };

  return (
    <VStack spacing={4} align="stretch">
      <Heading as="h2" size="lg" textAlign="center" mb={4} color="white">
        Log in to your account
      </Heading>

      {/* Social Login Options */}
      <Button 
        leftIcon={<Icon as={FaGoogle} />} 
        variant="outline" 
        borderColor="whiteAlpha.300"
        color="white"
        _hover={{ bg: "whiteAlpha.100" }}
        mb={2}
      >
        Sign in with Google
      </Button>

      <Button 
        leftIcon={<Icon as={FaApple} />} 
        variant="outline" 
        borderColor="whiteAlpha.300"
        color="white"
        _hover={{ bg: "whiteAlpha.100" }}
        mb={4}
      >
        Sign in with Apple
      </Button>

      {/* Divider with "or" */}
      <Flex align="center" mb={4}>
        <Divider borderColor="whiteAlpha.300" />
        <Text px={4} color="gray.400" fontSize="sm">or</Text>
        <Divider borderColor="whiteAlpha.300" />
      </Flex>

      <FormControl id="email" mb={4}>
        <FormLabel color="gray.300">Email address</FormLabel>
        <Input 
          type="email" 
          placeholder="Enter your email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          color="white"
          _hover={{ borderColor: "red.400" }}
          _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
        />
      </FormControl>

      <FormControl id="password" mb={6}>
        <FormLabel color="gray.300">Password</FormLabel>
        <Input 
          type="password" 
          placeholder="Enter your password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          color="white"
          _hover={{ borderColor: "red.400" }}
          _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
        />
        <HStack justify="flex-end">
          <Text fontSize="sm" color="red.300" mt={1} as="a" href="#" _hover={{ textDecoration: "underline" }}>
            Forgot password?
          </Text>
        </HStack>
      </FormControl>

      <Button 
        width="full" 
        colorScheme="red" 
        mb={4} 
        isLoading={loading} 
        onClick={handleLogin}
        _hover={{ bg: "red.600" }}
      >
        Log In 
      </Button>

      {error && (
        <Box color="red.300" textAlign="center" fontSize="sm">
          {error.message}
        </Box>
      )}
    </VStack>
  );
};

export default LogIn;
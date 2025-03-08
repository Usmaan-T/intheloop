import React, { useState } from "react";
import useSignUpWithEmailAndPassword from "../../hooks/useSignUpWithEmailAndPassword";
import { FaGoogle, FaApple } from "react-icons/fa";

import {
  Box,
  Input,
  Button,
  Heading,
  Flex,
  Text,
  Divider,
  HStack,
  VStack,
  Link,
  useColorModeValue,
} from "@chakra-ui/react";

const SignUp = () => {
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
    username: ""
  });
  const { loading, error, signup } = useSignUpWithEmailAndPassword();
  
  // This will respect your theme settings
  const bgColor = useColorModeValue("white", "black");
  const textColor = useColorModeValue("black", "white");

  return (
    <Box maxW="md" mx="auto" p={6}>
      <VStack spacing={4} align="stretch">
        <Heading as="h2" size="lg" textAlign="center" mb={4}>
          Create an account
        </Heading>

        {/* Social Sign-in Options */}
        <Button 
          leftIcon={<FaGoogle />} 
          variant="outline" 
          borderColor="gray.600"
          _hover={{ bg: "whiteAlpha.100" }}
          size="md"
          mb={2}
        >
          Sign in with Google
        </Button>
        
        <Button 
          leftIcon={<FaApple />} 
          variant="outline" 
          borderColor="gray.600"
          _hover={{ bg: "whiteAlpha.100" }}
          size="md"
          mb={4}
        >
          Sign in with Apple
        </Button>

        {/* Divider with "or" */}
        <Flex align="center" mb={4}>
          <Divider borderColor="gray.600" />
          <Text px={4} color="gray.400">or</Text>
          <Divider borderColor="gray.600" />
        </Flex>

        {/* Email and Password Fields */}
        <VStack spacing={4}>
          <Input
            placeholder="Email Address"
            type="email"
            bg="white"
            color="black"
            value={inputs.email}
            onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
          />
          
          <Input
            placeholder="Username"
            type="text"
            bg="white"
            color="black"
            value={inputs.username}
            onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
          />

          <Input
            placeholder="Password"
            type="password"
            bg="white"
            color="black"
            value={inputs.password}
            onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
          />     
          
          {error && <Text color="red.300">{error}</Text>}
          
          <Button
            width="full"
            colorScheme="blue"
            isLoading={loading}
            onClick={() => signup(inputs)}
            mt={2}
          >
            Continue
          </Button>
        </VStack>
        
        {/* New to The Loop? */}
        <HStack justify="center" mt={4} spacing={1} fontSize="sm">
          <Text>New to The Loop?</Text>
          <Link color="blue.400">Join now</Link>
        </HStack>
      </VStack>
    </Box>
  );
};

export default SignUp;
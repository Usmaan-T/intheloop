import React, { useState } from "react";
import useSignUpWithEmailAndPassword from "../../hooks/useSignUpWithEmailAndPassword";
import { FaGoogle, FaApple } from "react-icons/fa";

import {
  Input,
  Button,
  Heading,
  Flex,
  Text,
  Divider,
  VStack,
  Link,
  FormControl,
  FormLabel,
  FormHelperText,
  Icon
} from "@chakra-ui/react";

const SignUp = () => {
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
    username: ""
  });
  const { loading, error, signup } = useSignUpWithEmailAndPassword();

  return (
    <VStack spacing={8} align="stretch" w="100%">
      <Heading as="h2" size="xl" textAlign="center" mb={8} color="white">
        Create your account
      </Heading>

      {/* Social Sign-in Options */}
      <Button 
        leftIcon={<Icon as={FaGoogle} boxSize={5} />} 
        variant="outline" 
        borderColor="whiteAlpha.300"
        color="white"
        _hover={{ bg: "whiteAlpha.100" }}
        py={7}
        fontSize="lg"
        size="lg"
      >
        Continue with Google
      </Button>
      
      <Button 
        leftIcon={<Icon as={FaApple} boxSize={5} />} 
        variant="outline" 
        borderColor="whiteAlpha.300"
        color="white"
        _hover={{ bg: "whiteAlpha.100" }}
        py={7}
        fontSize="lg"
        size="lg"
      >
        Continue with Apple
      </Button>

      {/* Divider with "or" */}
      <Flex align="center" my={4}>
        <Divider borderColor="whiteAlpha.300" />
        <Text px={6} color="gray.400" fontSize="md">or</Text>
        <Divider borderColor="whiteAlpha.300" />
      </Flex>

      {/* Email and Password Fields */}
      <FormControl mb={6}>
        <FormLabel color="gray.300" mb={3} fontSize="lg">Email address</FormLabel>
        <Input
          placeholder="Enter your email"
          type="email"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          color="white"
          _hover={{ borderColor: "red.400" }}
          _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
          value={inputs.email}
          onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
          size="lg"
          height="60px"
          fontSize="md"
        />
      </FormControl>
      
      <FormControl mb={6}>
        <FormLabel color="gray.300" mb={3} fontSize="lg">Username</FormLabel>
        <Input
          placeholder="Choose a username"
          type="text"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          color="white"
          _hover={{ borderColor: "red.400" }}
          _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
          value={inputs.username}
          onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
          size="lg"
          height="60px"
          fontSize="md"
        />
      </FormControl>

      <FormControl mb={8}>
        <FormLabel color="gray.300" mb={3} fontSize="lg">Password</FormLabel>
        <Input
          placeholder="Create a password"
          type="password"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          color="white"
          _hover={{ borderColor: "red.400" }}
          _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
          value={inputs.password}
          onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
          size="lg"
          height="60px"
          fontSize="md"
        />
        <FormHelperText color="gray.400" mt={2} fontSize="sm">
          Must be at least 8 characters
        </FormHelperText>
      </FormControl>
            
      {error && <Text color="red.300" fontSize="md" textAlign="center" mb={6}>{error}</Text>}
      
      <Button
        width="100%"
        colorScheme="red"
        isLoading={loading}
        onClick={() => signup(inputs)}
        size="lg"
        height="60px"
        fontSize="lg"
        fontWeight="bold"
        _hover={{ bg: "red.600" }}
      >
        Create Account
      </Button>
      
      <Text color="gray.400" fontSize="sm" textAlign="center" mt={6}>
        By signing up, you agree to our <Link color="red.300">Terms of Service</Link> and <Link color="red.300">Privacy Policy</Link>
      </Text>
    </VStack>
  );
};

export default SignUp;
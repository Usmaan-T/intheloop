import React, { useState, useEffect } from "react";
import useSignUpWithEmailAndPassword from "../../hooks/useSignUpWithEmailAndPassword";
import useSignInWithGoogle from "../../hooks/useSignInWithGoogle";
import { FaGoogle, FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";

import {
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
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
  Icon,
  Box,
  useDisclosure,
  useToast
} from "@chakra-ui/react";

// Motion components for animations
const MotionVStack = motion(VStack);
const MotionButton = motion(Button);

const SignUp = () => {
  const [inputs, setInputs] = useState({
    email: "",
    password: "",
    username: ""
  });
  const { loading: emailLoading, error: emailError, signup, user: emailUser, success: emailSuccess } = useSignUpWithEmailAndPassword();
  const { loading: googleLoading, error: googleError, signInWithGoogle, user: googleUser, success: googleSuccess } = useSignInWithGoogle();
  const { isOpen, onToggle } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();

  // Loading state combines both authentication methods
  const loading = emailLoading || googleLoading;
  // Error state combines both authentication methods
  const error = emailError || googleError;
  // Success and user from either method
  const success = emailSuccess || googleSuccess;
  const user = emailUser || googleUser;

  // Handle redirect after successful signup
  useEffect(() => {
    if (user || success) {
      toast({
        title: "Account created successfully!",
        description: "Welcome to The Loop!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      
      // Short delay before redirect to allow the success toast to be visible
      const redirectTimer = setTimeout(() => {
        navigate("/");
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, success, navigate, toast]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  return (
    <MotionVStack 
      spacing={6} 
      align="stretch" 
      w="100%"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Heading 
          as="h2" 
          size="lg" 
          textAlign="center" 
          mb={4} 
          color="white"
          bgGradient="linear(to-r, red.400, red.600)"
          bgClip="text"
          letterSpacing="tight"
        >
          Join The Loop
        </Heading>
      </motion.div>

      {/* Social Sign-in Options */}
      <motion.div variants={itemVariants}>
        <MotionButton 
          leftIcon={<Icon as={FaGoogle} boxSize={5} />} 
          variant="outline" 
          borderColor="whiteAlpha.300"
          color="white"
          _hover={{ bg: "whiteAlpha.200", borderColor: "red.400" }}
          _active={{ bg: "whiteAlpha.300" }}
          py={6}
          fontSize="md"
          size="lg"
          w="100%"
          mb={3}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={signInWithGoogle}
          isLoading={googleLoading}
        >
          Continue with Google
        </MotionButton>
      </motion.div>
      
      {/* Divider with "or" */}
      <motion.div variants={itemVariants}>
        <Flex align="center" my={2}>
          <Divider borderColor="whiteAlpha.300" />
          <Text px={6} color="gray.400" fontSize="sm">or</Text>
          <Divider borderColor="whiteAlpha.300" />
        </Flex>
      </motion.div>

      {/* Email and Password Fields */}
      <motion.div variants={itemVariants}>
        <FormControl mb={4}>
          <FormLabel color="gray.300" mb={2} fontSize="md">Email address</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaEnvelope} color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder="Enter your email"
              type="email"
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.200"
              color="white"
              _hover={{ borderColor: "red.400" }}
              _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
              value={inputs.email}
              onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
              height="48px"
              fontSize="md"
            />
          </InputGroup>
        </FormControl>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <FormControl mb={4}>
          <FormLabel color="gray.300" mb={2} fontSize="md">Username</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaUser} color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder="Choose a username"
              type="text"
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.200"
              color="white"
              _hover={{ borderColor: "red.400" }}
              _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
              value={inputs.username}
              onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
              height="48px"
              fontSize="md"
            />
          </InputGroup>
        </FormControl>
      </motion.div>

      <motion.div variants={itemVariants}>
        <FormControl mb={5}>
          <FormLabel color="gray.300" mb={2} fontSize="md">Password</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaLock} color="gray.500" />
            </InputLeftElement>
            <Input
              placeholder="Create a password"
              type={isOpen ? "text" : "password"}
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.200"
              color="white"
              _hover={{ borderColor: "red.400" }}
              _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
              value={inputs.password}
              onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
              height="48px"
              fontSize="md"
            />
            <InputRightElement>
              <Icon
                as={isOpen ? FaEyeSlash : FaEye}
                color="gray.500"
                cursor="pointer"
                onClick={onToggle}
              />
            </InputRightElement>
          </InputGroup>
          <FormHelperText color="gray.400" mt={2} fontSize="xs">
            Must be at least 8 characters
          </FormHelperText>
        </FormControl>
      </motion.div>
            
      {error && (
        <motion.div variants={itemVariants}>
          <Box 
            color="red.300" 
            textAlign="center" 
            fontSize="sm" 
            p={2} 
            bg="rgba(229, 62, 62, 0.1)" 
            borderRadius="md"
            mb={4}
            borderWidth="1px"
            borderColor="red.300"
          >
            {typeof error === 'string' ? error : 'An error occurred during signup. Please try again.'}
          </Box>
        </motion.div>
      )}
      
      <motion.div variants={itemVariants}>
        <MotionButton
          width="100%"
          colorScheme="red"
          isLoading={emailLoading}
          onClick={() => signup(inputs)}
          height="48px"
          fontSize="md"
          fontWeight="semibold"
          _hover={{ bg: "red.600" }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          bgGradient="linear(to-r, red.500, red.700)"
        >
          Create Account
        </MotionButton>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Text color="gray.400" fontSize="xs" textAlign="center" mt={2}>
          By signing up, you agree to our <Link color="red.300" _hover={{ textDecoration: "underline" }}>Terms of Service</Link> and <Link color="red.300" _hover={{ textDecoration: "underline" }}>Privacy Policy</Link>
        </Text>
      </motion.div>
    </MotionVStack>
  );
};

export default SignUp;
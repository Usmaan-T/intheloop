import React, { useState, useEffect } from "react";
import { useSignInWithEmailAndPassword, useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase/firebase";
import { 
  Flex,
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  FormControl,
  FormLabel,
  Heading,
  Button,
  Text,
  VStack,
  Divider,
  HStack,
  Icon,
  useDisclosure,
  useToast
} from "@chakra-ui/react";
import { Navigate, useNavigate } from "react-router-dom";
import { FaGoogle, FaApple, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";

// Motion components for animations
const MotionVStack = motion(VStack);
const MotionButton = motion(Button);

const LogIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signInWithEmailAndPassword, user, loading, error] = useSignInWithEmailAndPassword(auth);
  const [currentUser] = useAuthState(auth);
  const { isOpen, onToggle } = useDisclosure();
  const toast = useToast();
  const navigate = useNavigate();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Handle successful login with toast and redirect
  useEffect(() => {
    if (user || currentUser) {
      toast({
        title: "Login successful!",
        description: "Welcome back to The Loop!",
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      
      // Set flag to trigger redirect
      const redirectTimer = setTimeout(() => {
        setShouldRedirect(true);
      }, 1000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, currentUser, toast]);

  // Handle redirect when flag is set
  if (shouldRedirect) {
    return <Navigate to="/" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        status: "error",
        duration: 3000,
        isClosable: true,
        position: "top"
      });
      return;
    }
    await signInWithEmailAndPassword(email, password);
  };

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
      spacing={4} 
      align="stretch"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <Heading 
          as="h2" 
          size="lg" 
          textAlign="center" 
          mb={6} 
          color="white"
          bgGradient="linear(to-r, red.400, red.600)"
          bgClip="text"
          letterSpacing="tight"
        >
          Welcome Back
        </Heading>
      </motion.div>

      {/* Social Login Options */}
      <motion.div variants={itemVariants}>
        <MotionButton 
          w="100%"
          leftIcon={<Icon as={FaGoogle} />} 
          variant="outline" 
          borderColor="whiteAlpha.300"
          color="white"
          _hover={{ bg: "whiteAlpha.200", borderColor: "red.400" }}
          _active={{ bg: "whiteAlpha.300" }}
          mb={3}
          height="48px"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          Continue with Google
        </MotionButton>
      </motion.div>

      <motion.div variants={itemVariants}>
        <MotionButton 
          w="100%"
          leftIcon={<Icon as={FaApple} />} 
          variant="outline" 
          borderColor="whiteAlpha.300"
          color="white"
          _hover={{ bg: "whiteAlpha.200", borderColor: "red.400" }}
          _active={{ bg: "whiteAlpha.300" }}
          mb={4}
          height="48px"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          Continue with Apple
        </MotionButton>
      </motion.div>

      {/* Divider with "or" */}
      <motion.div variants={itemVariants}>
        <Flex align="center" mb={6}>
          <Divider borderColor="whiteAlpha.300" />
          <Text px={4} color="gray.400" fontSize="sm">or</Text>
          <Divider borderColor="whiteAlpha.300" />
        </Flex>
      </motion.div>

      <motion.div variants={itemVariants}>
        <FormControl id="email" mb={4}>
          <FormLabel color="gray.300">Email address</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaEnvelope} color="gray.500" />
            </InputLeftElement>
            <Input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.200"
              color="white"
              _hover={{ borderColor: "red.400" }}
              _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
              height="48px"
              fontSize="md"
            />
          </InputGroup>
        </FormControl>
      </motion.div>

      <motion.div variants={itemVariants}>
        <FormControl id="password" mb={6}>
          <FormLabel color="gray.300">Password</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaLock} color="gray.500" />
            </InputLeftElement>
            <Input 
              type={isOpen ? "text" : "password"} 
              placeholder="Enter your password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              bg="whiteAlpha.50"
              border="1px solid"
              borderColor="whiteAlpha.200"
              color="white"
              _hover={{ borderColor: "red.400" }}
              _focus={{ borderColor: "red.500", boxShadow: "0 0 0 1px #E53E3E" }}
              height="48px"
              fontSize="md"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLogin();
              }}
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
          <HStack justify="flex-end">
            <Text fontSize="sm" color="red.300" mt={2} as="a" href="#" _hover={{ textDecoration: "underline" }}>
              Forgot password?
            </Text>
          </HStack>
        </FormControl>
      </motion.div>

      <motion.div variants={itemVariants}>
        <MotionButton 
          width="full" 
          colorScheme="red" 
          mb={4} 
          isLoading={loading} 
          onClick={handleLogin}
          _hover={{ bg: "red.600" }}
          height="48px"
          fontSize="md"
          fontWeight="semibold"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          bgGradient="linear(to-r, red.500, red.700)"
        >
          Log In 
        </MotionButton>
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
          >
            {error.message}
          </Box>
        </motion.div>
      )}
    </MotionVStack>
  );
};

export default LogIn;
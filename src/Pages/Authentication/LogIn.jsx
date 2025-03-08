import React, { useState } from "react";
import { useSignInWithEmailAndPassword, useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../firebase/firebase";
import { 
  Flex,
  Box,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  Heading,
  Button 
} from "@chakra-ui/react";
import { Navigate } from "react-router-dom";

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
    // Use the hook to sign in the user
    await signInWithEmailAndPassword(email, password);
  };

  return (
    <>
      <Heading as="h2" size="lg" textAlign="center" mb={6}>
        Log in to your account
      </Heading>

      <FormControl id="email" mb={4}>
        <FormLabel>Email address</FormLabel>
        <Input 
          type="email" 
          placeholder="Enter your email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormHelperText>
          We'll never share your email.
        </FormHelperText>
      </FormControl>

      <FormControl id="password" mb={6}>
        <FormLabel>Password</FormLabel>
        <Input 
          type="password" 
          placeholder="Enter your password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </FormControl>

      <Button 
        width="full" 
        colorScheme="blue" 
        mb={4} 
        isLoading={loading} 
        onClick={handleLogin}
      >
        Log In 
      </Button>

      {error && <Box color="red.500">{error.message}</Box>}
    </>
  );
};

export default LogIn;

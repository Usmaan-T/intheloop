import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Code,
  Spinner,
  useToast,
  Divider,
} from '@chakra-ui/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import NavBar from '../../components/Navbar/NavBar';
import { migrateAllSamples, migrateAllPlaylists, runFullMigration } from '../../utils/schemaMigration';

const SchemaMigrationPage = () => {
  const [user] = useAuthState(auth);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const toast = useToast();

  // Check if user is admin - you'd normally check a custom claim or admin flag in Firestore
  const isAdmin = user && (user.email === 'utariq2004@gmail.com');

  const handleMigrateSamples = async () => {
    setIsLoading(true);
    try {
      const result = await migrateAllSamples();
      setResults(result);
      
      toast({
        title: result.success ? 'Migration Successful' : 'Migration Failed',
        description: result.success 
          ? `Updated ${result.updated} samples with ${result.errors} errors` 
          : 'Failed to update samples',
        status: result.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Migration error:', error);
      setResults({ success: false, error: error.message });
      
      toast({
        title: 'Migration Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigratePlaylists = async () => {
    setIsLoading(true);
    try {
      const result = await migrateAllPlaylists();
      setResults(result);
      
      toast({
        title: result.success ? 'Migration Successful' : 'Migration Failed',
        description: result.success 
          ? `Updated ${result.updated} playlists with ${result.errors} errors` 
          : 'Failed to update playlists',
        status: result.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Migration error:', error);
      setResults({ success: false, error: error.message });
      
      toast({
        title: 'Migration Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullMigration = async () => {
    setIsLoading(true);
    try {
      const result = await runFullMigration();
      setResults(result);
      
      toast({
        title: result.success ? 'Full Migration Successful' : 'Migration Failed',
        description: result.success 
          ? `Updated ${result.samples.updated} samples and ${result.playlists.updated} playlists` 
          : 'Failed to complete migration',
        status: result.success ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Migration error:', error);
      setResults({ success: false, error: error.message });
      
      toast({
        title: 'Migration Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <NavBar />
        <Container maxW="container.md" py={10}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>Please log in to access this page.</AlertDescription>
          </Alert>
        </Container>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <NavBar />
        <Container maxW="container.md" py={10}>
          <Alert status="error">
            <AlertIcon />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>You do not have admin privileges to perform schema migrations.</AlertDescription>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Container maxW="container.md" py={10}>
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="xl" textAlign="center" color="white">
            Database Schema Migration
          </Heading>
          
          <Alert status="warning">
            <AlertIcon />
            <Box>
              <AlertTitle>Warning - Irreversible Changes!</AlertTitle>
              <AlertDescription>
                <Text mb={2}>
                  This migration will permanently modify your database documents and cannot be automatically reverted.
                </Text>
                <Text fontWeight="bold">
                  Please export a backup of your Firestore data from the Firebase console before proceeding.
                </Text>
              </AlertDescription>
            </Box>
          </Alert>
          
          <VStack spacing={4} bg="gray.800" p={6} borderRadius="md">
            <Heading as="h2" size="md" color="white">Available Migrations</Heading>
            
            <HStack w="full" justify="space-between">
              <Text color="white">Migrate All Samples</Text>
              <Button 
                colorScheme="purple" 
                onClick={handleMigrateSamples}
                isLoading={isLoading}
                loadingText="Migrating..."
                isDisabled={isLoading}
              >
                Run Migration
              </Button>
            </HStack>
            
            <Divider />
            
            <HStack w="full" justify="space-between">
              <Text color="white">Migrate All Playlists</Text>
              <Button 
                colorScheme="purple" 
                onClick={handleMigratePlaylists}
                isLoading={isLoading}
                loadingText="Migrating..."
                isDisabled={isLoading}
              >
                Run Migration
              </Button>
            </HStack>
            
            <Divider />
            
            <HStack w="full" justify="space-between">
              <Text color="white">Full Database Migration</Text>
              <Button 
                colorScheme="red" 
                onClick={handleFullMigration}
                isLoading={isLoading}
                loadingText="Migrating..."
                isDisabled={isLoading}
              >
                Run All Migrations
              </Button>
            </HStack>
          </VStack>
          
          {isLoading && (
            <VStack py={4}>
              <Spinner size="xl" color="purple.500" />
              <Text color="white">Migration in progress...</Text>
            </VStack>
          )}
          
          {results && (
            <Box bg="gray.800" p={6} borderRadius="md">
              <Heading as="h3" size="sm" mb={4} color="white">
                Migration Results:
              </Heading>
              <Code p={4} w="full" borderRadius="md" whiteSpace="pre-wrap">
                {JSON.stringify(results, null, 2)}
              </Code>
            </Box>
          )}
        </VStack>
      </Container>
    </>
  );
};

export default SchemaMigrationPage;

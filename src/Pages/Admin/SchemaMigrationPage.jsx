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
  Flex,
  Card,
  CardHeader,
  CardBody,
  Badge
} from '@chakra-ui/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import { migrateAllSamples, migrateAllPlaylists, runFullMigration, migrateAllUsers } from '../../utils/schemaMigration';

const ADMIN_USER_IDS = [
  // Add your admin user IDs here
  "ydweC38oMnXgd1BxKkj574Vrsnn2"
];

const MigrationCard = ({ title, description, onMigrate, isLoading, result }) => (
  <Card bg="rgba(20, 20, 30, 0.8)" borderColor="whiteAlpha.300" borderWidth="1px" overflow="hidden">
    <CardHeader pb={2}>
      <Heading size="md" color="white">{title}</Heading>
    </CardHeader>
    <CardBody>
      <Text color="gray.300" mb={4}>{description}</Text>
      
      <Flex justify="space-between" align="center">
        <Button 
          onClick={onMigrate} 
          colorScheme="red" 
          isLoading={isLoading}
          loadingText="Migrating..."
        >
          Run Migration
        </Button>
        
        {result && (
          <Badge 
            colorScheme={result.success ? "green" : "red"}
            p={2}
          >
            {result.success 
              ? `Success (${result.updated} updated)` 
              : "Failed"}
          </Badge>
        )}
      </Flex>
    </CardBody>
  </Card>
);

const SchemaMigrationPage = () => {
  const [loading, setLoading] = useState({
    all: false,
    samples: false,
    playlists: false,
    users: false
  });
  const [results, setResults] = useState({
    all: null,
    samples: null,
    playlists: null,
    users: null
  });
  
  const [user] = useAuthState(auth);
  const toast = useToast();
  
  // Check if current user is an admin
  const isAdmin = user && ADMIN_USER_IDS.includes(user.uid);
  
  const runMigration = async (type) => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to perform migrations",
        status: "error",
        duration: 5000,
        isClosable: true
      });
      return;
    }
    
    setLoading(prev => ({ ...prev, [type]: true }));
    
    try {
      let result;
      
      switch (type) {
        case 'all':
          result = await runFullMigration();
          break;
        case 'samples':
          result = await migrateAllSamples();
          break;
        case 'playlists':
          result = await migrateAllPlaylists();
          break;
        case 'users':
          result = await migrateAllUsers();
          break;
        default:
          throw new Error(`Unknown migration type: ${type}`);
      }
      
      setResults(prev => ({ ...prev, [type]: result }));
      
      toast({
        title: result.success ? "Migration Successful" : "Migration Failed",
        description: result.success 
          ? `Successfully updated ${result.updated} documents` 
          : `Migration failed with ${result.errors} errors`,
        status: result.success ? "success" : "error",
        duration: 5000,
        isClosable: true
      });
    } catch (error) {
      console.error(`Error during ${type} migration:`, error);
      setResults(prev => ({ 
        ...prev, 
        [type]: { success: false, error: error.message, updated: 0, errors: 1 } 
      }));
      
      toast({
        title: "Migration Error",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };
  
  if (!user) {
    return (
      <>
        <NavBar />
        <Container maxW="container.lg" py={10}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            Please login to access this page
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }
  
  if (!isAdmin) {
    return (
      <>
        <NavBar />
        <Container maxW="container.lg" py={10}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            You don't have permission to access this page
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Box bgColor="blackAlpha.900" minH="calc(100vh - 80px)">
        <Container maxW="container.lg" py={10}>
          <VStack spacing={8} align="stretch">
            <Box>
              <Heading as="h1" size="xl" color="white" mb={4}>
                Database Schema Migration
              </Heading>
              <Text color="gray.300">
                This page allows you to run data migrations to update the schema of documents in Firestore. 
                Only administrators can perform these operations.
              </Text>
              
              <Alert status="warning" mt={4} borderRadius="md">
                <AlertIcon />
                Make sure to backup your database before running migrations.
              </Alert>
            </Box>
            
            <Divider borderColor="whiteAlpha.200" />
            
            <VStack spacing={4} align="stretch">
              <MigrationCard 
                title="Migrate Everything"
                description="Run all migrations at once (samples, playlists, users)"
                onMigrate={() => runMigration('all')}
                isLoading={loading.all}
                result={results.all}
              />
              
              <Divider borderColor="whiteAlpha.200" />
              
              <MigrationCard 
                title="Migrate Sample Documents"
                description="Update all sample documents to conform to the latest schema"
                onMigrate={() => runMigration('samples')}
                isLoading={loading.samples}
                result={results.samples}
              />
              
              <MigrationCard 
                title="Migrate Playlist Documents"
                description="Update all playlist documents and normalize track objects within them"
                onMigrate={() => runMigration('playlists')}
                isLoading={loading.playlists}
                result={results.playlists}
              />
              
              <MigrationCard 
                title="Migrate User Documents"
                description="Update all user documents to add likes field and normalize structure"
                onMigrate={() => runMigration('users')}
                isLoading={loading.users}
                result={results.users}
              />
            </VStack>
          </VStack>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default SchemaMigrationPage;

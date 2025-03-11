import React from 'react';
import useCreatePlaylist from '../../hooks/useCreatePlaylist';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  Textarea,
  VStack,
  HStack,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Modal
} from '@chakra-ui/react';

const CreatePlaylist = ({ isOpen, onClose }) => {
  const { inputs, setInputs, loading, uploadError, createPlaylist } = useCreatePlaylist();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await createPlaylist();
    if (success && onClose) {
      onClose();
    }
  };

  // If used as a standalone component without modal props
  if (!isOpen && !onClose) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="stretch" bg="rgba(20, 20, 30, 0.8)" 
          borderRadius="lg" p={6} border="1px solid" borderColor="whiteAlpha.200">
          <Heading as="h2" size="lg" color="white">Create New Playlist</Heading>
          {renderForm()}
        </VStack>
      </Container>
    );
  }

  // Modal version (when used with "+" icon)
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay backdropFilter="blur(3px)" />
      <ModalContent bg="gray.900" color="white">
        <ModalHeader>Create New Playlist</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {renderForm()}
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  // Shared form rendering between modal and standalone versions
  function renderForm() {
    return (
      <VStack as="form" onSubmit={handleSubmit} spacing={4}>
        <FormControl isRequired>
          <FormLabel>Playlist Name</FormLabel>
          <Input
            value={inputs.name || ''}
            onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
            placeholder="Enter playlist name"
            bg="whiteAlpha.100"
          />
        </FormControl>
        
        <FormControl>
          <FormLabel>Description</FormLabel>
          <Textarea
            value={inputs.description || ''}
            onChange={(e) => setInputs({ ...inputs, description: e.target.value })}
            placeholder="What's this playlist about?"
            bg="whiteAlpha.100"
            rows={3}
          />
        </FormControl>
        
        {uploadError && (
          <Text color="red.400" fontSize="sm">
            {uploadError}
          </Text>
        )}
        
        <HStack justifyContent="flex-end" w="full" pt={2}>
          {onClose && (
            <Button 
              variant="outline" 
              mr={3} 
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
          <Button 
            colorScheme="purple" 
            type="submit"
            isLoading={loading}
            loadingText="Creating..."
          >
            Create Playlist
          </Button>
        </HStack>
      </VStack>
    );
  }
};

export default CreatePlaylist;
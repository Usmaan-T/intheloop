import React, { useRef } from 'react';
import useCreatePlaylist from '../../hooks/useCreatePlaylist';
import { MdAddPhotoAlternate } from 'react-icons/md';
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
  Modal,
  Flex,
  Select
} from '@chakra-ui/react';

const CreatePlaylist = ({ isOpen, onClose, onSuccess }) => {
  // Always call hooks at the top level
  const { inputs, setInputs, loading, uploadError, createPlaylist } = useCreatePlaylist();
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await createPlaylist();
    if (success) {
      if (onSuccess) {
        onSuccess();
      } else if (onClose) {
        onClose();
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setInputs({
        ...inputs,
        coverImage: e.target.files[0]
      });
    }
  };

  // Shared form rendering between modal and standalone versions
  const renderForm = () => (
    <VStack as="form" onSubmit={handleSubmit} spacing={4}>
      {/* Cover Image Upload */}
      <FormControl>
        <FormLabel>Cover Image</FormLabel>
        <Flex 
          justify="center" 
          align="center" 
          bg="whiteAlpha.100" 
          h="150px" 
          borderRadius="md"
          cursor="pointer"
          onClick={() => fileInputRef.current?.click()}
          flexDirection="column"
          gap={2}
        >
          <MdAddPhotoAlternate size="40px" color="#9F7AEA" />
          <Text fontSize="sm">Click to upload cover image</Text>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            display="none"
            onChange={handleFileChange}
          />
        </Flex>
      </FormControl>

      {/* Name Field */}
      <FormControl isRequired>
        <FormLabel>Collection Name</FormLabel>
        <Input
          value={inputs.name || ''}
          onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
          placeholder="Enter collection name"
          bg="whiteAlpha.100"
        />
      </FormControl>
      
      {/* Description Field */}
      <FormControl>
        <FormLabel>Description</FormLabel>
        <Textarea
          value={inputs.description || ''}
          onChange={(e) => setInputs({ ...inputs, description: e.target.value })}
          placeholder="What's this collection about?"
          bg="whiteAlpha.100"
          rows={3}
        />
      </FormControl>

      {/* Privacy Setting */}
      <FormControl>
        <FormLabel>Privacy</FormLabel>
        <Select 
          bg="whiteAlpha.100"
          value={inputs.privacy || 'public'}
          onChange={(e) => setInputs({ ...inputs, privacy: e.target.value })}
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </Select>
      </FormControl>
      
      {/* Error Message */}
      {uploadError && (
        <Text color="red.400" fontSize="sm">
          {uploadError}
        </Text>
      )}
      
      {/* Action Buttons */}
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
            Create Collection
          </Button>
        </HStack>
      </VStack>
    );

  // Use a single return statement with conditional rendering inside
  return isOpen !== undefined && onClose !== undefined ? (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay backdropFilter="blur(3px)" />
      <ModalContent bg="gray.900" color="white">
        <ModalHeader>Create New Collection</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {renderForm()}
        </ModalBody>
      </ModalContent>
    </Modal>
  ) : (
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch" bg="rgba(20, 20, 30, 0.8)" 
        borderRadius="lg" p={6} border="1px solid" borderColor="whiteAlpha.200">
        <Heading as="h2" size="lg" color="white">Create New Collection</Heading>
        {renderForm()}
      </VStack>
    </Container>
  );
};

export default CreatePlaylist;
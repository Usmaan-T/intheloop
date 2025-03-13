import React, { useState, useRef } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton,
  Button, FormControl, FormLabel, Input, Textarea, VStack, HStack, Flex, Avatar
} from '@chakra-ui/react';

const EditProfileModal = ({ isOpen, onClose, initialData, user, onSave, isUpdating }) => {
  const [username, setUsername] = useState(initialData?.username || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  // Reset form when modal opens with new data
  React.useEffect(() => {
    if (isOpen && initialData) {
      setUsername(initialData.username || '');
      setBio(initialData.bio || '');
      setImageFile(null);
    }
  }, [isOpen, initialData]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    const updates = {};
    
    if (username && username !== initialData?.username) {
      updates.username = username;
    }
    
    if (bio !== initialData?.bio) {
      updates.bio = bio;
    }
    
    onSave(updates, imageFile);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay backdropFilter="blur(3px)" />
      <ModalContent bg="gray.900" color="white">
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4}>
            {/* Profile Image Uploader */}
            <Flex direction="column" align="center" w="full">
              <Avatar 
                size="xl" 
                mb={4}
                src={imageFile ? URL.createObjectURL(imageFile) : (initialData?.photoURL || user?.photoURL)}
                name={username || user?.email?.charAt(0)}
              />
              <Button 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                colorScheme="purple"
              >
                Choose Image
              </Button>
              <Input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                display="none"
                onChange={handleFileChange}
              />
            </Flex>
            
            {/* Username Input */}
            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                bg="whiteAlpha.100"
              />
            </FormControl>
            
            {/* Bio Input */}
            <FormControl>
              <FormLabel>Bio</FormLabel>
              <Textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Enter your bio"
                bg="whiteAlpha.100"
              />
            </FormControl>
            
            {/* Submit Button */}
            <HStack justifyContent="flex-end" w="full" pt={2}>
              <Button variant="outline" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="purple" 
                onClick={handleSubmit}
                isLoading={isUpdating}
              >
                Save
              </Button>
            </HStack>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EditProfileModal;

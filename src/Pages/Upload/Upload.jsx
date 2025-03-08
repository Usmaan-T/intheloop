import React from 'react';
import { Box, Input, Button, VStack, Text } from '@chakra-ui/react';
import NavBar from '../../components/Navbar/NavBar';
import useUploadFiles from '../../hooks/useUploadFiles';

const Upload = () => {
  const {
    audioUpload,
    setAudioUpload,
    loading,
    uploadError,
    downloadURL,
    uploadAudio,
  } = useUploadFiles();

  return (
    <>
      <NavBar />
      <Box maxW="container.md" mx="auto" py={10}>
        <VStack spacing={6} align="stretch">
          <Input
            type="file"
            accept="audio/mp3"
            onChange={(e) => setAudioUpload(e.target.files[0])}
            bg="white"
            color="black"
          />
          <Button onClick={uploadAudio} colorScheme="red" isLoading={loading}>
            Upload MP3
          </Button>
          {uploadError && <Text color="red.500">{uploadError}</Text>}
          {downloadURL && (
            <Text color="green.400">Download URL: {downloadURL}</Text>
          )}
        </VStack>
      </Box>
    </>
  );
};

export default Upload;

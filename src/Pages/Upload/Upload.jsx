import React from 'react';
import { 
  Box, 
  Button, 
  VStack, 
  Text, 
  Heading, 
  FormControl, 
  FormLabel,
  Container,
  Input 
} from '@chakra-ui/react';
import NavBar from '../../components/Navbar/NavBar';
import useUploadFiles from '../../hooks/useUploadFiles';
import FileUploadButton from '../../components/Upload/FileUploadButton';

const UploadPage = () => {
  const {
    audioUpload,
    setAudioUpload,
    loading,
    uploadError,
    uploadAudio,
    setInputs,
    inputs,
  } = useUploadFiles();

  return (
    <>
      <NavBar />
      <Box bgGradient="linear(to-br, gray.700, black)" minH="100vh" py={10}>
        <Container maxW="container.md" centerContent>
          <Heading as="h2" size="2xl" color="white" textAlign="center" mb={8}>
            Upload Your Audio
          </Heading>
          <Box bg="gray.900" p={8} borderRadius="lg" boxShadow="2xl" w="100%">
            <VStack spacing={6} align="stretch">
              <FormControl id="audioFile">
                <FormLabel color="gray.300">Audio File</FormLabel>
                {/* Custom file upload button */}
                <FileUploadButton onFileSelected={setAudioUpload} />
                {audioUpload && (
                  <Text mt={2} color="gray.300">
                    Selected: {audioUpload.name}
                  </Text>
                )}
              </FormControl>
              <FormControl id="trackName">
                <FormLabel color="gray.300">Name</FormLabel>
                <Input
                  type="text"
                  value={inputs.name}
                  placeholder="Enter a name for your track"
                  onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                  bg="white"
                  color="black"
                  borderRadius="md"
                />
              </FormControl>
              <FormControl id="trackKey">
                <FormLabel color="gray.300">Key</FormLabel>
                <Input
                  type="text"
                  value={inputs.key}
                  placeholder="Enter the key (e.g. C#m)"
                  onChange={(e) => setInputs({ ...inputs, key: e.target.value })}
                  bg="white"
                  color="black"
                  borderRadius="md"
                />
              </FormControl>
              <FormControl id="bpm">
                <FormLabel color="gray.300">BPM</FormLabel>
                <Input
                  type="number"
                  value={inputs.bpm}
                  placeholder="Enter BPM"
                  onChange={(e) => setInputs({ ...inputs, bpm: e.target.value })}
                  bg="white"
                  color="black"
                  borderRadius="md"
                />
              </FormControl>
              <Button 
                onClick={uploadAudio} 
                colorScheme="red" 
                size="lg" 
                isLoading={loading}
                mt={4}
              >
                Upload MP3
              </Button>
              {uploadError && (
                <Text color="red.400" textAlign="center">
                  {uploadError}
                </Text>
              )}
            </VStack>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default UploadPage;

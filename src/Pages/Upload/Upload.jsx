import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  VStack, 
  Text, 
  Heading, 
  FormControl, 
  FormLabel,
  Container,
  Input,
  useToast,
  InputGroup,
  InputLeftElement,
  Progress,
  HStack,
  Icon,
  Flex
} from '@chakra-ui/react';
import { MdMusicNote, MdSpeed, MdTitle, MdFileUpload, MdCheck } from 'react-icons/md';
import { motion } from 'framer-motion';
import NavBar from '../../components/Navbar/NavBar';
import useUploadFiles from '../../hooks/useUploadFiles';
import DropzoneUploader from '../../components/Upload/DropzoneUploader';

const MotionBox = motion(Box);
const MotionContainer = motion(Container);

const UploadPage = () => {
  const toast = useToast();
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const {
    audioUpload,
    setAudioUpload,
    loading,
    uploadError,
    uploadAudio,
    setInputs,
    inputs,
  } = useUploadFiles();

  const handleUpload = async () => {
    if (!audioUpload) {
      toast({
        title: "No file selected",
        description: "Please select an audio file to upload",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Simulate upload progress
    setUploadProgress(0);
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      await uploadAudio();
      clearInterval(progressInterval);
      setUploadProgress(100);
      toast({
        title: "Upload successful!",
        description: "Your audio file has been uploaded",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <NavBar />
      <Box 
        bgColor={'blackAlpha.900'} 
        minH="100vh" 
        py={10}
        backgroundSize="cover"
        backgroundPosition="center"
        position="relative"
        overflow="hidden"
      >
        <MotionBox
          position="absolute"
          height="300px"
          width="300px"
          borderRadius="full"
          bgGradient="radial(pink.500, purple.500)"
          filter="blur(70px)"
          opacity="0.2"
          top="-100px"
          left="-100px"
          zIndex="0"
          animate={{
            x: [0, 30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <MotionContainer 
          maxW="container.md" 
          centerContent
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <MotionBox
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Heading as="h2" size="2xl" color="white" textAlign="center" mb={2}>
              Upload Your Audio
            </Heading>
            <Text color="gray.300" textAlign="center" mb={8}>
              Drag and drop your audio files or browse to upload
            </Text>
          </MotionBox>
          
          <MotionBox 
            bg="rgba(20, 20, 30, 0.8)"
            backdropFilter="blur(10px)"
            p={8} 
            borderRadius="xl" 
            boxShadow="0 4px 30px rgba(0, 0, 0, 0.4)"
            w="100%"
            border="1px solid"
            borderColor="whiteAlpha.200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <VStack spacing={6} align="stretch">
              <FormControl id="audioFile">
                <FormLabel color="gray.300" fontSize="lg" fontWeight="medium">
                  Audio File
                </FormLabel>
                <DropzoneUploader 
                  onFileSelected={setAudioUpload}
                  selectedFile={audioUpload}
                />
              </FormControl>
              
              {uploadProgress > 0 && (
                <Box>
                  <Flex justify="space-between" mb={1}>
                    <Text color="gray.300" fontSize="sm">Uploading...</Text>
                    <Text color="gray.300" fontSize="sm">{uploadProgress}%</Text>
                  </Flex>
                  <Progress 
                    value={uploadProgress} 
                    size="sm" 
                    colorScheme="purple" 
                    borderRadius="full"
                    hasStripe={uploadProgress < 100}
                    isAnimated={uploadProgress < 100}
                    bg="whiteAlpha.200"
                  />
                </Box>
              )}
              
              <FormControl id="trackName">
                <FormLabel color="gray.300">Track Name</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <Icon as={MdTitle} color="gray.500" />
                  </InputLeftElement>
                  <Input
                    type="text"
                    value={inputs.name}
                    placeholder="Enter a name for your track"
                    onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                    bg="whiteAlpha.100"
                    color="white"
                    borderColor="whiteAlpha.300"
                    _hover={{ borderColor: "purple.400" }}
                    _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px rgba(159, 122, 234, 0.7)" }}
                    borderRadius="md"
                  />
                </InputGroup>
              </FormControl>
              
              <HStack spacing={4}>
                <FormControl id="trackKey">
                  <FormLabel color="gray.300">Key</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={MdMusicNote} color="gray.500" />
                    </InputLeftElement>
                    <Input
                      type="text"
                      value={inputs.key}
                      placeholder="E.g., C#m"
                      onChange={(e) => setInputs({ ...inputs, key: e.target.value })}
                      bg="whiteAlpha.100"
                      color="white"
                      borderColor="whiteAlpha.300"
                      _hover={{ borderColor: "purple.400" }}
                      _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px rgba(159, 122, 234, 0.7)" }}
                      borderRadius="md"
                    />
                  </InputGroup>
                </FormControl>
                
                <FormControl id="bpm">
                  <FormLabel color="gray.300">BPM</FormLabel>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <Icon as={MdSpeed} color="gray.500" />
                    </InputLeftElement>
                    <Input
                      type="number"
                      value={inputs.bpm}
                      placeholder="120"
                      onChange={(e) => setInputs({ ...inputs, bpm: e.target.value })}
                      bg="whiteAlpha.100"
                      color="white"
                      borderColor="whiteAlpha.300"
                      _hover={{ borderColor: "purple.400" }}
                      _focus={{ borderColor: "purple.500", boxShadow: "0 0 0 1px rgba(159, 122, 234, 0.7)" }}
                      borderRadius="md"
                    />
                  </InputGroup>
                </FormControl>
              </HStack>
              
              <Button 
                onClick={handleUpload} 
                colorScheme="purple" 
                size="lg" 
                isLoading={loading}
                mt={4}
                leftIcon={<Icon as={uploadProgress === 100 ? MdCheck : MdFileUpload} />}
                bgGradient="linear(to-r, purple.400, pink.400)"
                _hover={{
                  bgGradient: "linear(to-r, purple.500, pink.500)",
                  transform: "translateY(-2px)",
                  boxShadow: "lg"
                }}
                _active={{
                  bgGradient: "linear(to-r, purple.600, pink.600)",
                  transform: "translateY(0)"
                }}
                transition="all 0.2s"
              >
                {uploadProgress === 100 ? "Uploaded Successfully" : "Upload Audio"}
              </Button>
              
              {uploadError && (
                <MotionBox
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  p={3}
                  bg="rgba(254, 178, 178, 0.2)"
                  borderRadius="md"
                >
                  <Text color="red.300" textAlign="center">
                    {uploadError}
                  </Text>
                </MotionBox>
              )}
            </VStack>
          </MotionBox>
        </MotionContainer>
      </Box>
    </>
  );
};

export default UploadPage;

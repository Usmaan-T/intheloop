import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Text,
  Flex,
  VStack,
  HStack,
  Heading,
  Badge,
  Progress,
  Select,
  Textarea,
  useColorModeValue,
  Collapse,
  Tag,
  TagLabel,
  TagCloseButton,
  Wrap,
  WrapItem,
  Icon,
  useToast
} from '@chakra-ui/react';
import { FaUpload, FaMusic, FaFire, FaTrophy } from 'react-icons/fa';
import { MdAdd, MdAudiotrack } from 'react-icons/md';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import useUploadFiles from '../hooks/useUploadFiles';
import useUserStreaks from '../hooks/useUserStreaks';
import { SAMPLE_TAGS } from '../hooks/useSamplesData';

const UploadForm = () => {
  const [user] = useAuthState(auth);
  const { uploadFiles, uploadProgress, isUploading, error } = useUploadFiles(user?.uid);
  const { currentStreak, longestStreak, isLoading: isLoadingStreak } = useUserStreaks(user?.uid);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [sampleName, setSampleName] = useState('');
  const [description, setDescription] = useState('');
  const [bpm, setBpm] = useState('');
  const [key, setKey] = useState('');
  const [showTagSelector, setShowTagSelector] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const accentColor = useColorModeValue('purple.500', 'purple.300');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    // Filter for audio files
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));
    
    if (audioFiles.length !== files.length) {
      toast({
        title: "Invalid files detected",
        description: "Some files were skipped because they are not audio files",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    }
    
    setSelectedFiles(audioFiles);
  };

  const handleTagSelect = (tag) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one audio file to upload",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const metadata = {
      name: sampleName || selectedFiles[0].name.replace(/\.[^/.]+$/, ""),
      description,
      bpm: bpm ? parseInt(bpm, 10) : null,
      key,
      tags: selectedTags
    };
    
    const result = await uploadFiles(selectedFiles, metadata);
    
    if (result.success) {
      // Clear form after successful upload
      setSelectedFiles([]);
      setSelectedTags([]);
      setSampleName('');
      setDescription('');
      setBpm('');
      setKey('');
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <Box 
      p={6} 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={borderColor}
      bg={bgColor}
      boxShadow="md"
    >
      <VStack spacing={6} align="stretch">
        <Flex justifyContent="space-between" alignItems="center">
          <Heading size="lg">Upload Your Sample</Heading>
          
          {!isLoadingStreak && user && (
            <HStack spacing={2}>
              <Flex 
                align="center" 
                p={2} 
                bg={currentStreak > 0 ? "orange.100" : "gray.100"} 
                color={currentStreak > 0 ? "orange.800" : "gray.600"} 
                borderRadius="md"
              >
                <Icon as={FaFire} color={currentStreak > 0 ? "orange.500" : "gray.400"} mr={2} />
                <Box>
                  <Text fontSize="xs" fontWeight="bold">STREAK</Text>
                  <Text fontWeight="bold">{currentStreak} days</Text>
                </Box>
              </Flex>
              
              <Flex 
                align="center" 
                p={2} 
                bg="purple.100" 
                color="purple.800" 
                borderRadius="md"
              >
                <Icon as={FaTrophy} color="purple.500" mr={2} />
                <Box>
                  <Text fontSize="xs" fontWeight="bold">BEST</Text>
                  <Text fontWeight="bold">{longestStreak} days</Text>
                </Box>
              </Flex>
            </HStack>
          )}
        </Flex>

        {currentStreak > 0 && (
          <Box p={3} bg="orange.50" borderRadius="md" borderLeft="4px solid" borderColor="orange.500">
            <Text color="orange.800">
              <Icon as={FaFire} color="orange.500" mr={2} />
              You're on a {currentStreak} day streak! Keep uploading daily to maintain it.
            </Text>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl isRequired>
              <FormLabel>Select Audio Files</FormLabel>
              <Button
                leftIcon={<FaUpload />}
                colorScheme="blue"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                width="100%"
                height="80px"
                border="2px dashed"
                borderColor={selectedFiles.length ? "green.300" : borderColor}
              >
                {selectedFiles.length 
                  ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected` 
                  : 'Click to select audio files'
                }
              </Button>
              <Input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileChange}
                hidden
                ref={fileInputRef}
              />
              {selectedFiles.length > 0 && (
                <Box mt={2}>
                  {selectedFiles.map((file, index) => (
                    <Flex 
                      key={index} 
                      align="center" 
                      bg="gray.50" 
                      p={2} 
                      mt={1} 
                      borderRadius="md"
                    >
                      <Icon as={MdAudiotrack} mr={2} color="blue.500" />
                      <Text fontSize="sm" isTruncated>{file.name}</Text>
                      <Text fontSize="xs" color="gray.500" ml={2}>
                        ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                      </Text>
                    </Flex>
                  ))}
                </Box>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Sample Name</FormLabel>
              <Input 
                placeholder="Enter a name for your sample"
                value={sampleName}
                onChange={(e) => setSampleName(e.target.value)}
              />
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea 
                placeholder="Describe your sample (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormControl>

            <Flex gap={4}>
              <FormControl>
                <FormLabel>BPM</FormLabel>
                <Input 
                  type="number" 
                  placeholder="e.g. 120"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value)}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Musical Key</FormLabel>
                <Select 
                  placeholder="Select key"
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                >
                  <optgroup label="Major">
                    {SAMPLE_TAGS.key
                      .filter(k => !k.includes('m'))
                      .map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))
                    }
                  </optgroup>
                  <optgroup label="Minor">
                    {SAMPLE_TAGS.key
                      .filter(k => k.includes('m'))
                      .map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))
                    }
                  </optgroup>
                </Select>
              </FormControl>
            </Flex>

            <FormControl>
              <FormLabel>Tags</FormLabel>
              <Button 
                leftIcon={<MdAdd />} 
                variant="outline"
                size="sm"
                onClick={() => setShowTagSelector(!showTagSelector)}
                mb={2}
              >
                {showTagSelector ? 'Hide Tags' : 'Add Tags'}
              </Button>
              
              <Collapse in={showTagSelector} animateOpacity>
                <Box p={3} bg="gray.50" borderRadius="md" my={2}>
                  {Object.entries(SAMPLE_TAGS).map(([category, tags]) => (
                    <Box key={category} mb={3}>
                      <Text fontWeight="bold" mb={1} fontSize="sm" color="gray.700">
                        {category.charAt(0).toUpperCase() + category.slice(1)}:
                      </Text>
                      <Wrap>
                        {tags.map(tag => (
                          <WrapItem key={tag}>
                            <Button 
                              size="xs"
                              variant={selectedTags.includes(tag) ? "solid" : "outline"}
                              colorScheme={selectedTags.includes(tag) ? "blue" : "gray"}
                              onClick={() => handleTagSelect(tag)}
                              mb={1}
                            >
                              {tag}
                            </Button>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Box>
                  ))}
                </Box>
              </Collapse>
              
              {selectedTags.length > 0 && (
                <Wrap mt={2}>
                  {selectedTags.map(tag => (
                    <WrapItem key={tag}>
                      <Tag size="md" colorScheme="blue" borderRadius="full">
                        <TagLabel>{tag}</TagLabel>
                        <TagCloseButton onClick={() => handleRemoveTag(tag)} />
                      </Tag>
                    </WrapItem>
                  ))}
                </Wrap>
              )}
            </FormControl>

            {isUploading && (
              <Box>
                <Text mb={1} fontSize="sm">
                  Uploading: {uploadProgress}%
                </Text>
                <Progress 
                  value={uploadProgress} 
                  size="sm" 
                  colorScheme="blue"
                  borderRadius="full"
                />
              </Box>
            )}

            {error && (
              <Text color="red.500" fontSize="sm">
                Error: {error}
              </Text>
            )}

            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isUploading}
              loadingText="Uploading..."
              leftIcon={<FaMusic />}
              isDisabled={!user || selectedFiles.length === 0}
            >
              Upload Sample
            </Button>
            
            {!user && (
              <Text color="red.500" fontSize="sm">
                You must be logged in to upload samples.
              </Text>
            )}
          </VStack>
        </form>
      </VStack>
    </Box>
  );
};

export default UploadForm; 
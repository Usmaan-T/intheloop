import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Text, 
  Icon, 
  VStack,
  HStack,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import { MdAudioFile, MdUpload, MdClose } from 'react-icons/md';

const MotionBox = motion(Box);

const DropzoneUploader = ({ onFileSelected, selectedFile }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileSelected(acceptedFiles[0]);
    }
  }, [onFileSelected]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({ 
    onDrop, 
    accept: {
      'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    onFileSelected(null);
  };

  const getFileSize = (size) => {
    if (size < 1024) return `${size} B`;
    else if (size < 1048576) return `${(size / 1024).toFixed(1)} KB`;
    else return `${(size / 1048576).toFixed(1)} MB`;
  };

  return (
    <>
      <MotionBox
        {...getRootProps()}
        bg={useColorModeValue("whiteAlpha.100", "whiteAlpha.100")}
        borderWidth="2px"
        borderStyle="dashed"
        borderRadius="xl"
        borderColor={
          isDragActive 
            ? "purple.400" 
            : isDragReject 
              ? "red.400" 
              : selectedFile 
                ? "green.400" 
                : "whiteAlpha.300"
        }
        p={6}
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ borderColor: "purple.400", bg: "whiteAlpha.200" }}
        animate={{ 
          scale: isDragActive ? 1.02 : 1,
          borderColor: isDragActive ? "purple.400" : (selectedFile ? "green.400" : "whiteAlpha.300")
        }}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <VStack spacing={2} position="relative">
            <HStack spacing={4} width="100%">
              <Icon as={MdAudioFile} boxSize={10} color="purple.300" />
              
              <VStack align="flex-start" flex="1" spacing={0}>
                <Text color="white" fontWeight="medium" isTruncated maxWidth="250px">
                  {selectedFile.name}
                </Text>
                <Text color="gray.400" fontSize="sm">
                  {getFileSize(selectedFile.size)}
                </Text>
              </VStack>
              
              <Button
                size="sm"
                variant="ghost"
                color="gray.400"
                onClick={handleRemoveFile}
                _hover={{ color: "white", bg: "whiteAlpha.200" }}
              >
                <Icon as={MdClose} />
              </Button>
            </HStack>
            
            <Text color="green.300" fontSize="sm" mt={2}>
              File ready to upload
            </Text>
          </VStack>
        ) : (
          <VStack spacing={2}>
            <Icon
              as={MdUpload}
              boxSize={12}
              color={isDragActive ? "purple.300" : "gray.400"}
              opacity={isDragActive ? 1 : 0.7}
              animate={{ 
                y: isDragActive ? [0, -8, 0] : 0 
              }}
              transition={{ 
                repeat: isDragActive ? Infinity : 0,
                duration: 1.5
              }}
            />
            <Text color="white" fontWeight="medium">
              {isDragActive 
                ? "Drop your audio file here" 
                : "Drag & drop your audio file here"
              }
            </Text>
            <Text color="gray.400" fontSize="sm">
              or click to browse files
            </Text>
            <Text color="gray.500" fontSize="xs" mt={2}>
              Supports MP3, WAV, OGG, M4A (max 50MB)
            </Text>
          </VStack>
        )}
      </MotionBox>
    </>
  );
};

// Make sure this export statement is present and properly formatted
export default DropzoneUploader;

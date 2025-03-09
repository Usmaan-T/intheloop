import React, { useRef } from 'react';
import { Box, Button, Text } from '@chakra-ui/react';

const FileUploadButton = ({ onFileSelected }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  return (
    <Box>
      {/* Hidden file input */}
      <input
        type="file"
        accept="audio/mp3"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {/* Custom button to trigger file input */}
      <Button
        onClick={() => fileInputRef.current.click()}
        colorScheme="red"
        size="lg"
      >
        Choose File
      </Button>
    </Box>
  );
};

export default FileUploadButton;

import React from 'react';
import { Wrap, WrapItem, Tag } from '@chakra-ui/react';

const TagsList = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  
  return (
    <Wrap spacing={1} mt={2}>
      {tags.slice(0, 3).map(tag => (
        <WrapItem key={tag}>
          <Tag 
            size="sm" 
            colorScheme="red" 
            variant="solid"
            borderRadius="full"
          >
            {tag}
          </Tag>
        </WrapItem>
      ))}
      {tags.length > 3 && (
        <WrapItem>
          <Tag size="sm" variant="subtle">+{tags.length - 3}</Tag>
        </WrapItem>
      )}
    </Wrap>
  );
};

export default TagsList;

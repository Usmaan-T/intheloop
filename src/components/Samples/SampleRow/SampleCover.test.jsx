import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SampleCover from './SampleCover';
import { MdMusicNote } from 'react-icons/md';

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdMusicNote: () => <div data-testid="music-note-icon" />
}));

// Mock Chakra's Image component
jest.mock('@chakra-ui/react', () => {
  const originalModule = jest.requireActual('@chakra-ui/react');
  return {
    ...originalModule,
    Image: ({ fallback, src, alt, ...props }) => {
      // Simulate image loading - if src includes 'invalid' we'll render the fallback
      if (src && src.includes('invalid')) {
        return fallback;
      }
      // Otherwise render an img with the right props
      return <img src={src} alt={alt} data-testid="chakra-image" {...props} />;
    },
    Box: ({ children, ...props }) => <div data-testid="chakra-box" {...props}>{children}</div>,
    Flex: ({ children, ...props }) => <div data-testid="chakra-flex" {...props}>{children}</div>,
    Icon: ({ as: Component, ...props }) => <Component data-testid="chakra-icon" {...props} />
  };
});

describe('SampleCover Component', () => {
  it('should render the cover image when provided', () => {
    const track = {
      name: 'Test Track',
      coverImage: 'https://example.com/test-image.jpg'
    };

    render(<SampleCover track={track} />);
    
    // Check if image is rendered with correct props
    const coverImage = screen.getByTestId('chakra-image');
    expect(coverImage).toBeInTheDocument();
    expect(coverImage).toHaveAttribute('src', 'https://example.com/test-image.jpg');
    expect(coverImage).toHaveAttribute('alt', 'Test Track');
  });

  it('should render fallback with music icon when no cover image is provided', () => {
    const track = {
      name: 'Test Track Without Cover',
      // No coverImage provided
    };

    render(<SampleCover track={track} />);
    
    // Check if fallback/placeholder with icon is rendered
    const musicIcon = screen.getByTestId('music-note-icon');
    expect(musicIcon).toBeInTheDocument();
    
    // No Chakra image should be rendered
    const images = screen.queryByTestId('chakra-image');
    expect(images).not.toBeInTheDocument();
  });

  it('should render fallback with music icon when Image component triggers onError', () => {
    const track = {
      name: 'Track With Invalid Image',
      coverImage: 'https://example.com/invalid-image.jpg'
    };

    render(<SampleCover track={track} />);
    
    // Our mock will render the fallback for 'invalid' in the URL
    const musicIcon = screen.getByTestId('music-note-icon');
    expect(musicIcon).toBeInTheDocument();
    
    // The Image component shouldn't render an actual img tag in this case
    const image = screen.queryByTestId('chakra-image');
    expect(image).not.toBeInTheDocument();
  });
  
  it('should use a Flex container with color styling when no cover image is provided', () => {
    const track = {
      name: 'Colorful Track', 
      // No coverImage
    };

    render(<SampleCover track={track} />);
    
    // Check for Flex container
    const flexContainer = screen.getByTestId('chakra-flex');
    expect(flexContainer).toBeInTheDocument();
    
    // Also check for the music note icon
    const musicIcon = screen.getByTestId('music-note-icon');
    expect(musicIcon).toBeInTheDocument();
  });
  
  it('should work when track name is not provided', () => {
    const track = {
      // No name provided
      // No coverImage provided
    };

    render(<SampleCover track={track} />);
    
    // Should still render without errors
    const flexContainer = screen.getByTestId('chakra-flex');
    expect(flexContainer).toBeInTheDocument();
    
    const musicIcon = screen.getByTestId('music-note-icon');
    expect(musicIcon).toBeInTheDocument();
  });
}); 
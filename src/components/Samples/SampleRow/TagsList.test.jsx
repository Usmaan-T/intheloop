import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TagsList from './TagsList';

describe('TagsList Component', () => {
  it('should render tags correctly when provided', () => {
    const tags = ['Hip Hop', 'Drums', 'Lo-Fi'];
    
    render(<TagsList tags={tags} />);
    
    // Check if all tags are rendered
    expect(screen.getByText('Hip Hop')).toBeInTheDocument();
    expect(screen.getByText('Drums')).toBeInTheDocument();
    expect(screen.getByText('Lo-Fi')).toBeInTheDocument();
  });
  
  it('should not render anything when tags array is empty', () => {
    const { container } = render(<TagsList tags={[]} />);
    
    // Container should be empty
    expect(container.firstChild).toBeNull();
  });
  
  it('should not render anything when tags prop is undefined', () => {
    const { container } = render(<TagsList />);
    
    // Container should be empty
    expect(container.firstChild).toBeNull();
  });
  
  it('should only display first 3 tags when more than 3 tags are provided', () => {
    const tags = ['Hip Hop', 'Drums', 'Lo-Fi', 'Jazz', 'Piano', 'Bass'];
    
    render(<TagsList tags={tags} />);
    
    // First three tags should be visible
    expect(screen.getByText('Hip Hop')).toBeInTheDocument();
    expect(screen.getByText('Drums')).toBeInTheDocument();
    expect(screen.getByText('Lo-Fi')).toBeInTheDocument();
    
    // The rest should not be rendered directly
    expect(screen.queryByText('Jazz')).not.toBeInTheDocument();
    expect(screen.queryByText('Piano')).not.toBeInTheDocument();
    expect(screen.queryByText('Bass')).not.toBeInTheDocument();
  });
  
  it('should show "+X" indicator for additional tags beyond the first 3', () => {
    const tags = ['Hip Hop', 'Drums', 'Lo-Fi', 'Jazz', 'Piano'];
    
    render(<TagsList tags={tags} />);
    
    // Should show a "+2" indicator for the two additional tags
    expect(screen.getByText('+2')).toBeInTheDocument();
  });
  
  it('should not show "+X" indicator when exactly 3 tags are provided', () => {
    const tags = ['Hip Hop', 'Drums', 'Lo-Fi'];
    
    render(<TagsList tags={tags} />);
    
    // Should not have a "+X" indicator
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });
  
  it('should show correct count in "+X" indicator', () => {
    const tags = ['Hip Hop', 'Drums', 'Lo-Fi', 'Jazz', 'Piano', 'Bass', 'Rock'];
    
    render(<TagsList tags={tags} />);
    
    // Should show "+4" for the 4 additional tags
    expect(screen.getByText('+4')).toBeInTheDocument();
  });
}); 
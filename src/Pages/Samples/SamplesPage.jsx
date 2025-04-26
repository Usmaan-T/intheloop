import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  VStack,
  HStack,
  Select,
  Tag,
  TagLabel,
  TagCloseButton,
  Spinner,
  Button,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useBreakpointValue,
  Wrap,
  WrapItem,
  IconButton,
  Divider,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { FaSearch, FaFilter, FaTags, FaChevronRight, FaMusic, FaGuitar, FaInfoCircle } from 'react-icons/fa';
import { IoMdRefresh } from 'react-icons/io';
import { MdMusicNote, MdSpeed, MdMood } from 'react-icons/md';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import SampleRow from '../../components/Samples/SampleRow';
import useSamplesData, { SAMPLE_TAGS } from '../../hooks/useSamplesData';
import RecommendedSamples from '../../components/Samples/RecommendedSamples';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';

// Motion components for animations
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const SamplesPage = () => {
  const [user] = useAuthState(auth);
  
  // URL query parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get filter values from URL or use defaults
  const initialSearchTerm = searchParams.get('q') || '';
  const initialSortBy = searchParams.get('sort') || 'newest';
  const initialTags = searchParams.get('tags') ? searchParams.get('tags').split(',') : [];

  const {
    samples,
    loading,
    error,
    hasMore,
    loadMoreSamples,
    searchTerm,
    setSearchTerm,
    selectedTags,
    setSelectedTags,
    sortBy,
    setSortBy,
    availableTags,
    getTagsByCategory,
    SAMPLE_TAGS,
    refreshSamples,
    noResultsReason
  } = useSamplesData(12, initialSearchTerm, initialTags, initialSortBy);

  // Filter drawer
  const { isOpen, onOpen, onClose } = useDisclosure();
  const btnRef = useRef();
  const isMobile = useBreakpointValue({ base: true, md: false });

  // Infinite scroll functionality
  const observerTarget = useRef(null);
  
  const [expandedCategories, setExpandedCategories] = useState({ main: ['genre'], drawer: [] });
  const [tagSearch, setTagSearch] = useState('');
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreSamples();
        }
      },
      { threshold: 0.1 }
    );
    
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMoreSamples]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) {
      params.set('q', searchTerm);
    }
    
    if (sortBy !== 'newest') {
      params.set('sort', sortBy);
    }
    
    if (selectedTags.length > 0) {
      params.set('tags', selectedTags.join(','));
    }
    
    // Only update if parameters have changed to avoid unnecessary history entries
    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params);
    }
  }, [searchTerm, selectedTags, sortBy, searchParams, setSearchParams]);

  // Handle tag selection
  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      const newTags = selectedTags.filter(t => t !== tag);
      setSelectedTags(newTags);
      
      // Force a refresh after tag is removed
      console.log("Tag removed, refreshing samples:", tag);
      // We need to wait for state update before refreshing
      setTimeout(() => refreshSamples(), 0);
    } else {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      
      // Force a refresh after tag is added
      console.log("Tag added, refreshing samples:", tag);
      // We need to wait for state update before refreshing
      setTimeout(() => refreshSamples(), 0);
    }
  };

  // Handle search input with debounce
  const searchTimeoutRef = useRef(null);
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout for refreshing (300ms debounce)
    searchTimeoutRef.current = setTimeout(() => {
      console.log("Search term changed, refreshing samples:", value);
      refreshSamples();
    }, 300);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setSortBy('newest');
    
    // Force immediate refresh
    console.log("Clearing all filters and refreshing samples");
    setTimeout(() => refreshSamples(), 0);
    
    // Also clear URL params
    navigate('/samples');
  };
  
  // Get tag color based on category
  const getTagColorScheme = (tag) => {
    const category = Object.entries(SAMPLE_TAGS).find(([_, tags]) => 
      tags.includes(tag)
    )?.[0];
    
    switch (category) {
      case 'genre': return 'red';
      case 'mood': return 'blue';
      case 'instrument': return 'green';
      case 'tempo': return 'purple';
      case 'key': return 'orange';
      default: return 'gray';
    }
  };
  
  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'genre':
        return FaMusic;
      case 'instrument':
        return FaGuitar;
      case 'mood':
        return MdMood;
      case 'tempo':
        return MdSpeed;
      case 'key':
        return MdMusicNote;
      default:
        return FaTags;
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId, section = 'main') => {
    setExpandedCategories(prev => {
      const currentExpanded = [...prev[section]];
      const index = currentExpanded.indexOf(categoryId);
      
      if (index >= 0) {
        currentExpanded.splice(index, 1);
      } else {
        currentExpanded.push(categoryId);
      }
      
      return {
        ...prev,
        [section]: currentExpanded
      };
    });
  };

  // Toggle all categories
  const toggleAllCategories = (expand = true, section = 'main') => {
    if (expand) {
      // Expand all
      setExpandedCategories(prev => ({
        ...prev,
        [section]: Object.keys(SAMPLE_TAGS)
      }));
    } else {
      // Collapse all
      setExpandedCategories(prev => ({
        ...prev,
        [section]: []
      }));
    }
  };

  // Filter tags by search term
  const getFilteredTags = (tags, searchTerm) => {
    if (!searchTerm.trim()) return tags;
    return tags.filter(tag => 
      tag.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <>
      <NavBar />
      <Box bgColor="blackAlpha.900" minH="100vh" position="relative" overflow="hidden">
        {/* Background accent */}
        <MotionBox
          position="absolute"
          height="400px"
          width="400px"
          borderRadius="full"
          bgGradient="radial(red.600, red.900)"
          filter="blur(90px)"
          opacity="0.2"
          top="-150px"
          right="-100px"
          zIndex={0}
          animate={{
            x: [0, 40, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Page Header */}
        <MotionBox
          as="section"
          bgGradient="linear(to-r, red.900, #6F0A14, red.900)"
          backgroundSize="200% 100%"
          borderBottom="1px solid"
          borderColor="whiteAlpha.200"
          position="relative"
          py={{ base: 8, md: 12 }}
          px={4}
          textAlign="center"
          boxShadow="0 4px 20px rgba(0,0,0,0.2)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Container maxW="container.xl">
            <Heading
              as="h1"
              size={{ base: 'xl', md: '2xl' }}
              mb={4}
              color="white"
              fontWeight="bold"
              bgGradient="linear(to-r, white, whiteAlpha.800)"
              bgClip="text"
              letterSpacing="-1px"
            >
              Discover Samples
            </Heading>
            <Text
              fontSize={{ base: 'md', md: 'lg' }}
              maxW="container.md"
              mx="auto"
              mb={6}
              color="gray.300"
              fontWeight="medium"
            >
              Find the perfect sounds for your next project
            </Text>
            
            {/* Search Bar */}
            <InputGroup maxW="600px" mx="auto" size="lg">
              <InputLeftElement pointerEvents="none">
                <FaSearch color="gray.300" />
              </InputLeftElement>
              <Input
                placeholder="Search samples by name, description or tags..."
                value={searchTerm}
                onChange={handleSearchInput}
                bg="rgba(0,0,0,0.4)"
                border="1px solid"
                borderColor="whiteAlpha.300"
                color="white"
                _placeholder={{ color: 'gray.400' }}
                _hover={{ borderColor: 'red.400' }}
                _focus={{ borderColor: 'red.500', boxShadow: '0 0 0 1px #E53E3E' }}
              />
            </InputGroup>
          </Container>
        </MotionBox>

        <Container maxW="container.xl" py={{ base: 8, md: 10 }}>
          {/* Personalized Recommendations Section - only shown to logged in users */}
          {user && (
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              mb={8}
            >
              <RecommendedSamples maxItems={6} />
            </MotionBox>
          )}
          
          {/* Filters Section */}
          <MotionBox
            mb={8}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Flex
              alignItems={{ base: 'flex-start', md: 'center' }}
              justifyContent="space-between"
              mb={6}
              flexDirection={{ base: 'column', md: 'row' }}
              gap={4}
            >
              <HStack spacing={3}>
                <Icon as={FaTags} color="red.400" boxSize={6} />
                <Heading as="h2" size="lg" color="white" fontWeight="semibold">
                  Browse Samples
                </Heading>
              </HStack>

              <HStack spacing={4}>
                <Select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    // Refresh immediately when sort changes
                    console.log("Sort changed, refreshing samples:", e.target.value);
                    setTimeout(() => refreshSamples(), 0);
                  }}
                  width={{ base: "full", md: "180px" }}
                  bg="rgba(20, 20, 30, 0.8)"
                  color="white"
                  borderColor="whiteAlpha.300"
                  borderRadius="md"
                  _hover={{ borderColor: 'red.400' }}
                  size="md"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </Select>
                
                <Button
                  leftIcon={<FaFilter />}
                  colorScheme="red"
                  variant="outline"
                  ref={btnRef}
                  onClick={onOpen}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  size="md"
                >
                  Filters
                </Button>
                
                <IconButton
                  icon={<IoMdRefresh />}
                  aria-label="Refresh samples"
                  colorScheme="red"
                  variant="ghost"
                  onClick={refreshSamples}
                  _hover={{ bg: 'whiteAlpha.100' }}
                  size="md"
                />
              </HStack>
            </Flex>
            
            {/* Key and Active Filters Row */}
            <Flex 
              mb={6} 
              gap={4} 
              flexDirection={{ base: "column", md: "row" }}
              alignItems={{ base: "stretch", md: "center" }}
            >
              {/* Musical Key Filter */}
              <Box 
                width={{ base: "full", md: "300px" }}
                bg="rgba(20, 20, 30, 0.8)"
                borderRadius="md"
                borderWidth="1px"
                borderColor="orange.700"
                overflow="hidden"
              >
                <Flex 
                  bg="orange.900" 
                  px={4} 
                  py={2} 
                  alignItems="center"
                >
                  <Icon as={MdMusicNote} color="orange.200" mr={2} />
                  <Text fontWeight="medium" color="white">Musical Key</Text>
                </Flex>
                <Menu closeOnSelect={true}>
                  <MenuButton
                    as={Button}
                    rightIcon={<FaChevronRight transform="rotate(90deg)" />}
                    bg="transparent"
                    color="white"
                    _hover={{ bg: "blackAlpha.300" }}
                    _active={{ bg: "blackAlpha.500" }}
                    width="full"
                    borderRadius="0"
                    justifyContent="space-between"
                    py={3}
                    px={4}
                  >
                    {selectedTags.find(tag => SAMPLE_TAGS.key.includes(tag)) || "Select Key"}
                  </MenuButton>
                  <MenuList bg="gray.800" maxH="300px" overflowY="auto">
                    <Text px={3} py={2} color="gray.400" fontSize="sm" fontWeight="bold">Major Keys</Text>
                    {SAMPLE_TAGS.key
                      .filter(key => !key.includes('m'))
                      .map(key => (
                        <MenuItem 
                          key={key} 
                          onClick={() => {
                            // Remove any previously selected key
                            const newTags = selectedTags.filter(tag => !SAMPLE_TAGS.key.includes(tag));
                            // Add the new key
                            setSelectedTags([...newTags, key]);
                            setTimeout(() => refreshSamples(), 0);
                          }}
                          bg="gray.800"
                          _hover={{ bg: "orange.700" }}
                          color="white"
                        >
                          {key}
                        </MenuItem>
                      ))
                    }
                    <Text px={3} py={2} color="gray.400" fontSize="sm" fontWeight="bold" mt={2}>Minor Keys</Text>
                    {SAMPLE_TAGS.key
                      .filter(key => key.includes('m'))
                      .map(key => (
                        <MenuItem 
                          key={key} 
                          onClick={() => {
                            // Remove any previously selected key
                            const newTags = selectedTags.filter(tag => !SAMPLE_TAGS.key.includes(tag));
                            // Add the new key
                            setSelectedTags([...newTags, key]);
                            setTimeout(() => refreshSamples(), 0);
                          }}
                          bg="gray.800"
                          _hover={{ bg: "orange.700" }}
                          color="white"
                        >
                          {key}
                        </MenuItem>
                      ))
                    }
                    <Divider my={2} borderColor="whiteAlpha.300" />
                    <MenuItem 
                      bg="gray.800"
                      _hover={{ bg: "gray.700" }}
                      color="gray.300"
                      onClick={() => {
                        const newTags = selectedTags.filter(tag => !SAMPLE_TAGS.key.includes(tag));
                        setSelectedTags(newTags);
                        setTimeout(() => refreshSamples(), 0);
                      }}
                    >
                      Clear Key Filter
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Box>
              
              {/* Active Tags Display */}
              {selectedTags.length > 0 && (
                <Flex 
                  wrap="wrap" 
                  gap={2} 
                  align="center" 
                  flex="1"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  borderRadius="md"
                  p={2}
                >
                  <HStack>
                    <Text color="gray.400" fontSize="sm" fontWeight="medium">
                      Filters:
                    </Text>
                  </HStack>
                  {selectedTags.map(tag => (
                    <Tag
                      key={tag}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      colorScheme={getTagColorScheme(tag)}
                    >
                      <TagLabel>{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleTagSelect(tag)} />
                    </Tag>
                  ))}
                  {selectedTags.length > 0 && (
                    <Button size="xs" onClick={clearFilters} variant="link" color="gray.400">
                      Clear All
                    </Button>
                  )}
                </Flex>
              )}
            </Flex>
            
            {/* Category Tag Selection - Remove Key from here */}
            <Box 
              bg="rgba(20, 20, 30, 0.6)" 
              borderRadius="lg" 
              mb={6} 
              p={4}
              borderWidth="1px"
              borderColor="whiteAlpha.200"
            >
              {/* Multi-tag selection info */}
              <Flex mb={4} alignItems="center" justifyContent="space-between">
                <Heading size="sm" color="white">Select Tags to Filter</Heading>
                <HStack spacing={4}>
                  <Button 
                    size="xs" 
                    variant="outline" 
                    colorScheme="blue" 
                    leftIcon={<FaChevronRight transform="rotate(90deg)" />}
                    onClick={() => toggleAllCategories(true, 'main')}
                  >
                    Expand All
                  </Button>
                  <Button 
                    size="xs" 
                    variant="outline" 
                    colorScheme="blue" 
                    leftIcon={<FaChevronRight transform="rotate(270deg)" />}
                    onClick={() => toggleAllCategories(false, 'main')}
                  >
                    Collapse All
                  </Button>
                </HStack>
              </Flex>
              
              {/* Accordion-style tag selection */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {Object.entries(SAMPLE_TAGS)
                  .filter(([category]) => category !== 'key') // Skip key category here
                  .map(([category, tags]) => (
                  <Box 
                    key={category} 
                    bg="whiteAlpha.100" 
                    borderRadius="md" 
                    overflow="hidden"
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                  >
                    <Flex 
                      align="center" 
                      justify="space-between"
                      p={3}
                      cursor="pointer"
                      onClick={() => toggleCategory(category, 'main')}
                      bg={
                        category === 'genre' ? 'red.900' :
                        category === 'mood' ? 'blue.900' :
                        category === 'instrument' ? 'green.900' :
                        category === 'tempo' ? 'purple.900' :
                        'gray.900'
                      }
                      _hover={{ bg: 
                        category === 'genre' ? 'red.800' :
                        category === 'mood' ? 'blue.800' :
                        category === 'instrument' ? 'green.800' :
                        category === 'tempo' ? 'purple.800' :
                        'gray.800'
                      }}
                    >
                      <HStack>
                        <Icon as={getCategoryIcon(category)} color={
                          category === 'genre' ? 'red.300' :
                          category === 'mood' ? 'blue.300' :
                          category === 'instrument' ? 'green.300' :
                          category === 'tempo' ? 'purple.300' :
                          'gray.300'
                        } boxSize={5} mr={2} />
                        <Text color="white" fontWeight="medium" fontSize="md" textTransform="capitalize">
                          {category}
                        </Text>
                      </HStack>
                      <HStack>
                        <Badge 
                          variant="subtle" 
                          colorScheme={
                            category === 'genre' ? 'red' :
                            category === 'mood' ? 'blue' :
                            category === 'instrument' ? 'green' :
                            category === 'tempo' ? 'purple' :
                            'gray'
                          }
                          fontSize="xs"
                        >
                          {selectedTags.filter(tag => SAMPLE_TAGS[category].includes(tag)).length} selected
                        </Badge>
                        <Icon 
                          as={FaChevronRight} 
                          color="gray.400" 
                          transform={expandedCategories.main.includes(category) ? "rotate(90deg)" : "rotate(0deg)"}
                          transition="transform 0.2s"
                        />
                      </HStack>
                    </Flex>
                    <Box 
                      style={{
                        maxHeight: expandedCategories.main.includes(category) ? '200px' : '0px',
                        opacity: expandedCategories.main.includes(category) ? 1 : 0,
                        padding: expandedCategories.main.includes(category) ? '12px' : '0 12px',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Wrap spacing={2}>
                        {tags.map(tag => (
                          <WrapItem key={tag}>
                            <Tag
                              size="md"
                              borderRadius="full"
                              variant={selectedTags.includes(tag) ? "solid" : "outline"}
                              colorScheme={
                                category === 'genre' ? 'red' :
                                category === 'mood' ? 'blue' :
                                category === 'instrument' ? 'green' :
                                category === 'tempo' ? 'purple' :
                                'gray'
                              }
                              cursor="pointer"
                              onClick={() => handleTagSelect(tag)}
                              whiteSpace="nowrap"
                              px={3}
                              py={1.5}
                              opacity={selectedTags.includes(tag) ? 1 : 0.7}
                              _hover={{ 
                                opacity: 1,
                                transform: selectedTags.includes(tag) ? 'none' : 'translateY(-2px)'
                              }}
                              transition="all 0.2s"
                            >
                              <TagLabel>{tag}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            </Box>
          </MotionBox>
          
          {/* Samples Box */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Box
              bg="rgba(20, 20, 30, 0.8)"
              borderRadius="xl"
              p={{ base: 4, md: 6 }}
              border="1px solid"
              borderColor="whiteAlpha.200"
              boxShadow="0 4px 20px rgba(0,0,0,0.1)"
              overflow="hidden"
              position="relative"
            >
              {/* Results header with filter info */}
              {selectedTags.length > 0 && (
                <Flex 
                  mb={4} 
                  py={2} 
                  px={4} 
                  bg="rgba(0,0,0,0.2)" 
                  borderRadius="md"
                  justify="space-between"
                  align="center"
                  flexWrap="wrap"
                  gap={2}
                >
                  <HStack>
                    <Icon as={FaFilter} color="blue.300" />
                    <Text color="blue.300" fontWeight="medium">
                      Showing samples with all selected tags
                    </Text>
                  </HStack>
                  
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline" 
                    onClick={clearFilters}
                  >
                    Clear Filters
                  </Button>
                </Flex>
              )}
            
              {loading && samples.length === 0 ? (
                <Flex justify="center" align="center" h="300px" direction="column">
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.700"
                    color="red.500"
                    size="xl"
                    mb={4}
                  />
                  <Text color="gray.400" fontSize="lg">Loading samples...</Text>
                </Flex>
              ) : error ? (
                <Box textAlign="center" p={8} color="red.400">
                  <Text fontSize="lg">Error loading samples. Please try again later.</Text>
                  <Button mt={4} colorScheme="red" onClick={refreshSamples}>
                    Retry
                  </Button>
                </Box>
              ) : samples.length === 0 ? (
                <Box textAlign="center" p={12} color="white">
                  <Icon as={FaInfoCircle} boxSize={12} color="red.400" mb={4} />
                  <Text fontSize="xl" mb={3} fontWeight="bold">No samples found</Text>
                  <Text fontSize="md" color="gray.300" mb={5} maxW="600px" mx="auto">
                    {noResultsReason || (searchTerm && selectedTags.length > 0 
                      ? `No samples match both "${searchTerm}" and the selected tags: ${selectedTags.join(', ')}`
                      : searchTerm 
                        ? `No samples match "${searchTerm}"`
                        : selectedTags.length > 0 
                          ? `No samples contain all selected tags: ${selectedTags.join(', ')}`
                          : 'Try adjusting your filters or search terms'
                    )}
                  </Text>
                  <HStack spacing={4} justify="center">
                    <Button colorScheme="red" onClick={clearFilters}>
                      Clear All Filters
                    </Button>
                    <Button variant="outline" colorScheme="blue" onClick={refreshSamples}>
                      Refresh Samples
                    </Button>
                  </HStack>
                </Box>
              ) : (
                <VStack spacing={4} align="stretch">
                  {console.log(`Rendering ${samples.length} samples in SamplesPage`)}
                  {samples.map((sample, index) => (
                    <MotionBox
                      key={sample.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.4 }}
                    >
                      <SampleRow track={sample} onDelete={() => refreshSamples()} />
                    </MotionBox>
                  ))}
                </VStack>
              )}
              
              {/* Load More Button */}
              {hasMore && !loading && samples.length > 0 && (
                <Button
                  colorScheme="red"
                  size="lg"
                  mt={6}
                  onClick={loadMoreSamples}
                  isLoading={loading}
                  alignSelf="center"
                  mx="auto"
                  display="block"
                  bgGradient="linear(to-r, red.500, red.600)"
                  _hover={{
                    bgGradient: 'linear(to-r, red.600, red.700)',
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  px={8}
                  fontWeight="medium"
                >
                  Load More Samples
                </Button>
              )}
              
              {/* Load More Indicator */}
              {hasMore && loading && samples.length > 0 && (
                <Flex justify="center" py={6}>
                  <Spinner size="lg" color="red.500" thickness="4px" />
                </Flex>
              )}
            </Box>
          </MotionBox>
        </Container>
      </Box>

      {/* Filters Drawer */}
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        finalFocusRef={btnRef}
        size="md"
      >
        <DrawerOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(2px)" />
        <DrawerContent bg="gray.800" color="white">
          <DrawerCloseButton size="lg" top={4} right={4} />
          <DrawerHeader 
            borderBottomWidth="1px" 
            borderColor="whiteAlpha.300"
            py={6}
            bgGradient="linear(to-r, gray.800, red.900)"
          >
            <Heading size="lg">Filter Samples</Heading>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={8} align="stretch" pt={6}>
              {/* Multi-tag selection info */}
              <Box p={4} bg="blue.900" borderRadius="md" borderLeft="4px solid" borderColor="blue.400">
                <HStack alignItems="flex-start" spacing={3}>
                  <Icon as={FaInfoCircle} color="blue.300" mt={1} />
                  <Text fontSize="sm">
                    When selecting multiple tags, only samples containing <strong>ALL</strong> selected tags will be shown
                  </Text>
                </HStack>
              </Box>
            
              {/* Sort Options */}
              <Box>
                <Flex align="center" mb={4}>
                  <Icon as={FaSearch} color="#E53E3E" />
                  <Text ml={2} fontWeight="bold" fontSize="lg">Sort By</Text>
                </Flex>
                <Select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    // Refresh immediately when sort changes
                    console.log("Sort changed, refreshing samples:", e.target.value);
                    setTimeout(() => refreshSamples(), 0);
                  }}
                  bg="gray.700"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  size="lg"
                  _hover={{ borderColor: 'red.500' }}
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </Select>
              </Box>

              <Divider borderColor="whiteAlpha.300" />
              
              {/* Musical Key Filter */}
              <Box>
                <Flex align="center" mb={4}>
                  <Icon as={MdMusicNote} color="orange.400" />
                  <Text ml={2} fontWeight="bold" fontSize="lg">Musical Key</Text>
                </Flex>
                
                <Box 
                  bg="whiteAlpha.100" 
                  borderRadius="md" 
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor="orange.700"
                >
                  <Menu placement="bottom" isLazy>
                    <MenuButton
                      as={Button}
                      rightIcon={<FaChevronRight transform="rotate(90deg)" />}
                      bg="rgba(0,0,0,0.3)"
                      color="white"
                      _hover={{ bg: "blackAlpha.500" }}
                      _active={{ bg: "blackAlpha.600" }}
                      size="lg"
                      width="full"
                      px={6}
                      py={6}
                      fontWeight="normal"
                      fontSize="lg"
                      height="auto"
                    >
                      {selectedTags.find(tag => SAMPLE_TAGS.key.includes(tag)) || "Select Key"}
                    </MenuButton>
                    <MenuList bg="gray.800" maxH="300px" overflowY="auto">
                      <Text px={3} py={2} color="orange.300" fontSize="sm" fontWeight="bold">Major Keys</Text>
                      {SAMPLE_TAGS.key
                        .filter(key => !key.includes('m'))
                        .map(key => (
                          <MenuItem 
                            key={key} 
                            onClick={() => {
                              // Remove any previously selected key
                              const newTags = selectedTags.filter(tag => !SAMPLE_TAGS.key.includes(tag));
                              // Add the new key
                              setSelectedTags([...newTags, key]);
                              setTimeout(() => refreshSamples(), 0);
                            }}
                            bg="gray.800"
                            _hover={{ bg: "orange.700" }}
                            color="white"
                          >
                            {key}
                          </MenuItem>
                        ))
                      }
                      <Text px={3} py={2} color="orange.300" fontSize="sm" fontWeight="bold" mt={2}>Minor Keys</Text>
                      {SAMPLE_TAGS.key
                        .filter(key => key.includes('m'))
                        .map(key => (
                          <MenuItem 
                            key={key} 
                            onClick={() => {
                              // Remove any previously selected key
                              const newTags = selectedTags.filter(tag => !SAMPLE_TAGS.key.includes(tag));
                              // Add the new key
                              setSelectedTags([...newTags, key]);
                              setTimeout(() => refreshSamples(), 0);
                            }}
                            bg="gray.800"
                            _hover={{ bg: "orange.700" }}
                            color="white"
                          >
                            {key}
                          </MenuItem>
                        ))
                      }
                      <Divider my={2} borderColor="whiteAlpha.300" />
                      {selectedTags.some(tag => SAMPLE_TAGS.key.includes(tag)) && (
                        <MenuItem 
                          bg="gray.800"
                          _hover={{ bg: "gray.700" }}
                          color="gray.300"
                          onClick={() => {
                            const newTags = selectedTags.filter(tag => !SAMPLE_TAGS.key.includes(tag));
                            setSelectedTags(newTags);
                            setTimeout(() => refreshSamples(), 0);
                          }}
                        >
                          Clear Key Filter
                        </MenuItem>
                      )}
                    </MenuList>
                  </Menu>
                </Box>
              </Box>

              <Divider borderColor="whiteAlpha.300" />

              {/* Tags Filter using Accordion */}
              <Box>
                <Flex align="center" mb={4} justify="space-between">
                  <HStack>
                    <Icon as={FaTags} color="#E53E3E" />
                    <Text fontWeight="bold" fontSize="lg">Filter by Category</Text>
                  </HStack>
                  <HStack spacing={2}>
                    <Button 
                      size="xs" 
                      variant="outline" 
                      colorScheme="blue" 
                      onClick={() => toggleAllCategories(true, 'drawer')}
                    >
                      Expand All
                    </Button>
                    <Button 
                      size="xs" 
                      variant="outline" 
                      colorScheme="blue" 
                      onClick={() => toggleAllCategories(false, 'drawer')}
                    >
                      Collapse All
                    </Button>
                  </HStack>
                </Flex>
                
                {/* Search for tags */}
                <InputGroup mb={4} size="md">
                  <InputLeftElement pointerEvents="none">
                    <FaSearch color="gray.300" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search tags..."
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    bg="gray.700"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                    borderColor="whiteAlpha.300"
                  />
                </InputGroup>
                
                {tagSearch && (
                  <Box mb={4} p={3} bg="gray.700" borderRadius="md">
                    <Text mb={2} fontSize="sm" color="blue.300">Search results for "{tagSearch}":</Text>
                    <Wrap spacing={2}>
                      {Object.entries(SAMPLE_TAGS)
                        .filter(([category]) => category !== 'key')
                        .flatMap(([category, tags]) => 
                          getFilteredTags(tags, tagSearch).map(tag => (
                            <WrapItem key={`search-${tag}`}>
                              <Tag
                                size="md"
                                borderRadius="full"
                                variant={selectedTags.includes(tag) ? "solid" : "outline"}
                                colorScheme={
                                  category === 'genre' ? 'red' :
                                  category === 'mood' ? 'blue' :
                                  category === 'instrument' ? 'green' :
                                  category === 'tempo' ? 'purple' :
                                  'gray'
                                }
                                cursor="pointer"
                                onClick={() => handleTagSelect(tag)}
                                py={1.5}
                                px={3}
                                _hover={{ transform: 'translateY(-2px)' }}
                              >
                                <TagLabel>{tag}</TagLabel>
                              </Tag>
                            </WrapItem>
                          ))
                      )}
                    </Wrap>
                  </Box>
                )}
                
                {Object.entries(SAMPLE_TAGS)
                  .filter(([category]) => category !== 'key')
                  .map(([category, tags]) => (
                  <Box 
                    key={category} 
                    mb={3}
                    bg="gray.700" 
                    borderRadius="md" 
                    overflow="hidden"
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                    display={tagSearch && !tags.some(tag => tag.toLowerCase().includes(tagSearch.toLowerCase())) ? 'none' : 'block'}
                  >
                    <Flex 
                      align="center" 
                      justify="space-between"
                      p={3}
                      cursor="pointer"
                      onClick={() => toggleCategory(category, 'drawer')}
                      bg={
                        category === 'genre' ? 'red.800' :
                        category === 'mood' ? 'blue.800' :
                        category === 'instrument' ? 'green.800' :
                        category === 'tempo' ? 'purple.800' :
                        'gray.800'
                      }
                      _hover={{ bg: 
                        category === 'genre' ? 'red.700' :
                        category === 'mood' ? 'blue.700' :
                        category === 'instrument' ? 'green.700' :
                        category === 'tempo' ? 'purple.700' :
                        'gray.700'
                      }}
                    >
                      <HStack>
                        <Icon as={getCategoryIcon(category)} color={
                          category === 'genre' ? 'red.300' :
                          category === 'mood' ? 'blue.300' :
                          category === 'instrument' ? 'green.300' :
                          category === 'tempo' ? 'purple.300' :
                          'gray.300'
                        } boxSize={5} mr={2} />
                        <Text color="white" fontWeight="medium" fontSize="md" textTransform="capitalize">
                          {category}
                        </Text>
                      </HStack>
                      <HStack>
                        <Badge 
                          variant="subtle" 
                          colorScheme={
                            category === 'genre' ? 'red' :
                            category === 'mood' ? 'blue' :
                            category === 'instrument' ? 'green' :
                            category === 'tempo' ? 'purple' :
                            'gray'
                          }
                          fontSize="xs"
                        >
                          {selectedTags.filter(tag => SAMPLE_TAGS[category].includes(tag)).length} selected
                        </Badge>
                        <Icon 
                          as={FaChevronRight} 
                          color="gray.400" 
                          transform={expandedCategories.drawer.includes(category) ? "rotate(90deg)" : "rotate(0deg)"}
                          transition="transform 0.2s"
                        />
                      </HStack>
                    </Flex>
                    <Box 
                      style={{
                        maxHeight: expandedCategories.drawer.includes(category) ? '300px' : '0px',
                        opacity: expandedCategories.drawer.includes(category) ? 1 : 0,
                        padding: expandedCategories.drawer.includes(category) ? '16px' : '0 16px',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Wrap spacing={3} py={2}>
                        {getFilteredTags(tags, tagSearch).map(tag => (
                          <WrapItem key={tag}>
                            <Tag
                              size="lg"
                              borderRadius="full"
                              variant={selectedTags.includes(tag) ? "solid" : "outline"}
                              colorScheme={
                                category === 'genre' ? 'red' :
                                category === 'mood' ? 'blue' :
                                category === 'instrument' ? 'green' :
                                category === 'tempo' ? 'purple' :
                                'gray'
                              }
                              cursor="pointer"
                              onClick={() => handleTagSelect(tag)}
                              py={2}
                              px={4}
                              _hover={{ 
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
                              }}
                              transition="all 0.2s"
                            >
                              <TagLabel>{tag}</TagLabel>
                            </Tag>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Selected Tags */}
              {selectedTags.length > 0 && (
                <Box mt={4} p={4} bg="gray.700" borderRadius="md">
                  <HStack mb={2}>
                    <Text fontWeight="medium">Selected Tags:</Text>
                    <Text fontSize="sm" color="blue.300">(All required)</Text>
                  </HStack>
                  <Wrap>
                    {selectedTags.map(tag => (
                      <WrapItem key={tag}>
                        <Tag
                          size="md"
                          borderRadius="full"
                          variant="solid"
                          colorScheme={getTagColorScheme(tag)}
                        >
                          <TagLabel>{tag}</TagLabel>
                          <TagCloseButton onClick={() => handleTagSelect(tag)} />
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Box>
              )}

              <Divider borderColor="whiteAlpha.300" />

              {/* Clear Filters Button */}
              <Button
                colorScheme="red"
                variant="solid"
                onClick={clearFilters}
                mt={4}
                size="lg"
                isFullWidth
                leftIcon={<IoMdRefresh />}
              >
                Reset All Filters
              </Button>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Footer />
    </>
  );
};

export default SamplesPage; 
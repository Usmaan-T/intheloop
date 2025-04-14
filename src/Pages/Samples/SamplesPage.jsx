import React, { useEffect, useRef } from 'react';
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

// Motion components for animations
const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const SamplesPage = () => {
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
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Handle search input
  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setSortBy('newest');
    navigate('/samples'); // Clear URL params completely
  };
  
  // Get tag color based on category
  const getTagColorScheme = (tag) => {
    if (SAMPLE_TAGS.genre.includes(tag)) return "red";
    if (SAMPLE_TAGS.mood.includes(tag)) return "blue";
    if (SAMPLE_TAGS.instrument.includes(tag)) return "green";
    if (SAMPLE_TAGS.tempo.includes(tag)) return "purple";
    return "gray";
  };
  
  // Get category icon
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'genre': return FaMusic;
      case 'mood': return MdMood;
      case 'instrument': return FaGuitar;
      case 'tempo': return MdSpeed;
      default: return FaTags;
    }
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
                  onChange={(e) => setSortBy(e.target.value)}
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
            
            {/* Active Filters / Tags Display */}
            {selectedTags.length > 0 && (
              <Flex wrap="wrap" gap={2} align="center" mb={6}>
                <HStack>
                  <Text color="gray.400" fontSize="sm" fontWeight="medium">
                    Show samples with ALL tags:
                  </Text>
                  <Tooltip 
                    label="Only samples containing ALL selected tags will be shown" 
                    placement="top"
                    bg="gray.700"
                  >
                    <Icon as={FaInfoCircle} color="gray.400" boxSize={3} />
                  </Tooltip>
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
                <Button size="xs" onClick={clearFilters} variant="link" color="gray.400">
                  Clear All
                </Button>
              </Flex>
            )}
            
            {/* Category Tag Selection */}
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
                <HStack spacing={2}>
                  <Icon as={FaInfoCircle} color="blue.300" />
                  <Text fontSize="sm" color="blue.300">
                    Select multiple tags to see samples with ALL selected tags
                  </Text>
                </HStack>
              </Flex>
              
              <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4}>
                {Object.entries(SAMPLE_TAGS).map(([category, tags]) => (
                  <Box key={category}>
                    <Flex align="center" mb={2}>
                      <Icon as={getCategoryIcon(category)} color={
                        category === 'genre' ? 'red.400' :
                        category === 'mood' ? 'blue.400' :
                        category === 'instrument' ? 'green.400' :
                        'purple.400'
                      } boxSize={4} mr={2} />
                      <Text color="white" fontWeight="medium" fontSize="sm" textTransform="capitalize">
                        {category}
                      </Text>
                    </Flex>
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
                              'purple'
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
                  onChange={(e) => setSortBy(e.target.value)}
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

              {/* Tags Filter using Tabs */}
              <Box>
                <Flex align="center" mb={4}>
                  <Icon as={FaTags} color="#E53E3E" />
                  <Text ml={2} fontWeight="bold" fontSize="lg">Filter by Category</Text>
                </Flex>
                
                <Tabs variant="soft-rounded" colorScheme="red" isFitted mb={4}>
                  <TabList>
                    {Object.keys(SAMPLE_TAGS).map(category => (
                      <Tab 
                        key={category}
                        _selected={{ 
                          color: 'white', 
                          bg: category === 'genre' ? 'red.500' : 
                               category === 'mood' ? 'blue.500' : 
                               category === 'instrument' ? 'green.500' : 
                               'purple.500'
                        }}
                      >
                        <Icon 
                          as={getCategoryIcon(category)} 
                          mr={2} 
                        />
                        <Text textTransform="capitalize">{category}</Text>
                      </Tab>
                    ))}
                  </TabList>
                  
                  <TabPanels mt={4}>
                    {Object.entries(SAMPLE_TAGS).map(([category, tags]) => (
                      <TabPanel key={category} px={1}>
                        <Wrap spacing={3}>
                          {tags.map(tag => (
                            <WrapItem key={tag}>
                              <Tag
                                size="lg"
                                borderRadius="full"
                                variant={selectedTags.includes(tag) ? "solid" : "outline"}
                                colorScheme={
                                  category === 'genre' ? 'red' :
                                  category === 'mood' ? 'blue' :
                                  category === 'instrument' ? 'green' :
                                  'purple'
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
                      </TabPanel>
                    ))}
                  </TabPanels>
                </Tabs>
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
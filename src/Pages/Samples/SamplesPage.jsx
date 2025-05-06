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
import { FaSearch, FaFilter, FaTags, FaChevronRight, FaMusic, FaGuitar, FaInfoCircle, FaCheck } from 'react-icons/fa';
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
      <Box bg="darkBg.800" minH="100vh" position="relative" overflow="hidden">
        {/* Background animation elements */}
        <MotionBox
          position="absolute"
          height="500px"
          width="500px"
          borderRadius="full"
          bgGradient="radial(brand.500, brand.700)"
          filter="blur(120px)"
          opacity="0.15"
          top="-200px"
          right="-100px"
          zIndex={0}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <MotionBox
          position="absolute"
          height="400px"
          width="400px"
          borderRadius="full"
          bgGradient="radial(accent.purple.500, accent.purple.700)"
          filter="blur(100px)"
          opacity="0.1"
          bottom="-100px"
          left="-100px"
          zIndex={0}
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
        
        {/* Page Header */}
        <MotionBox
          as="section"
          bg="rgba(10, 10, 14, 0.8)"
          backdropFilter="blur(10px)"
          borderBottom="1px solid"
          borderColor="whiteAlpha.100"
          position="relative"
          py={{ base: 12, md: 16 }}
          px={4}
          textAlign="center"
          boxShadow="0 10px 30px -5px rgba(0,0,0,0.3)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          overflow="hidden"
        >
          {/* Animated gradient line */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            height="4px"
            bgGradient="linear(to-r, transparent, brand.500, accent.pink.500, accent.purple.500, transparent)"
            as={motion.div}
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          <Container maxW="container.xl" position="relative" zIndex={1}>
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Heading
                as="h1"
                fontSize={{ base: '3xl', md: '4xl', lg: '5xl' }}
                mb={4}
                fontWeight="bold"
                bgGradient="linear(to-r, white, brand.100)"
                bgClip="text"
                letterSpacing="tight"
                lineHeight="1.2"
              >
                Discover <Box as="span" color="brand.400">Samples</Box>
              </Heading>
            </MotionBox>
            
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              maxW="container.md"
              mx="auto"
            >
              <Text
                fontSize={{ base: 'md', md: 'lg' }}
                mb={8}
                color="whiteAlpha.800"
                fontWeight="medium"
                lineHeight="1.6"
              >
                Find the perfect sounds to inspire your next musical masterpiece
              </Text>
            </MotionBox>
            
            {/* Search Bar */}
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              maxW="650px"
              mx="auto"
            >
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none" h="full">
                  <Icon as={FaSearch} color="whiteAlpha.400" boxSize={5} />
                </InputLeftElement>
                <Input
                  placeholder="Search samples by name, description or tags..."
                  value={searchTerm}
                  onChange={handleSearchInput}
                  bg="rgba(20, 20, 30, 0.6)"
                  backdropFilter="blur(8px)"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  color="white"
                  _placeholder={{ color: 'whiteAlpha.500' }}
                  _hover={{ borderColor: 'brand.400' }}
                  _focus={{ 
                    borderColor: 'brand.500', 
                    boxShadow: '0 0 0 1px #d62222',
                    bg: "rgba(25, 25, 35, 0.7)"
                  }}
                  fontSize="md"
                  fontWeight="medium"
                  h="60px"
                  transition="all 0.3s ease"
                />
              </InputGroup>
            </MotionBox>
          </Container>
        </MotionBox>

        <Container maxW="container.xl" py={{ base: 12, md: 16 }}>
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
                <Icon as={FaTags} color="brand.400" boxSize={6} />
                <Heading as="h2" size="lg" color="white" fontWeight="semibold">
                  Browse Samples
                </Heading>
              </HStack>

              <HStack spacing={4}>
                <Select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setTimeout(() => refreshSamples(), 0);
                  }}
                  width={{ base: "full", md: "180px" }}
                  bg="rgba(20, 20, 30, 0.6)"
                  backdropFilter="blur(8px)"
                  color="white"
                  borderColor="whiteAlpha.200"
                  borderRadius="md"
                  _hover={{ borderColor: 'brand.400' }}
                  size="md"
                  fontWeight="medium"
                  transition="all 0.3s ease"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </Select>
                
                <Button
                  leftIcon={<FaFilter />}
                  variant="outline"
                  borderColor="brand.500"
                  color="white"
                  ref={btnRef}
                  onClick={onOpen}
                  _hover={{ 
                    bg: "rgba(214, 34, 34, 0.1)",
                    transform: "translateY(-2px)"
                  }}
                  size="md"
                  transition="all 0.2s"
                >
                  Filters
                </Button>
                
                <IconButton
                  icon={<IoMdRefresh />}
                  aria-label="Refresh samples"
                  variant="ghost"
                  color="white"
                  onClick={refreshSamples}
                  _hover={{ 
                    bg: "whiteAlpha.100",
                    transform: "rotate(180deg)"
                  }}
                  size="md"
                  transition="all 0.5s ease"
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
                bg="rgba(20, 20, 30, 0.7)"
                backdropFilter="blur(8px)"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="accent.orange.500"
                overflow="hidden"
                transition="all 0.3s ease"
                _hover={{
                  boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
                  borderColor: "accent.orange.400"
                }}
              >
                <Flex 
                  bgGradient="linear(to-r, accent.orange.500, accent.orange.600)" 
                  px={4} 
                  py={2} 
                  alignItems="center"
                >
                  <Icon as={MdMusicNote} color="white" mr={2} />
                  <Text fontWeight="medium" color="white">Musical Key</Text>
                </Flex>
                <Menu closeOnSelect={true}>
                  <MenuButton
                    as={Button}
                    rightIcon={<FaChevronRight transform="rotate(90deg)" />}
                    bg="transparent"
                    color="white"
                    _hover={{ bg: "whiteAlpha.100" }}
                    _active={{ bg: "whiteAlpha.200" }}
                    width="full"
                    borderRadius="0"
                    justifyContent="space-between"
                    py={3}
                    px={4}
                    transition="all 0.2s"
                  >
                    {selectedTags.find(tag => SAMPLE_TAGS.key.includes(tag)) || "Select Key"}
                  </MenuButton>
                  <MenuList 
                    bg="rgba(20, 20, 30, 0.95)"
                    backdropFilter="blur(10px)"
                    borderColor="whiteAlpha.200"
                    boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
                    maxH="300px" 
                    overflowY="auto"
                  >
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
                          bg="transparent"
                          _hover={{ bg: "orange.700" }}
                          color="white"
                          fontSize="sm"
                          fontWeight="medium"
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
                          bg="transparent"
                          _hover={{ bg: "orange.700" }}
                          color="white"
                          fontSize="sm"
                          fontWeight="medium"
                        >
                          {key}
                        </MenuItem>
                      ))
                    }
                    <Divider my={2} borderColor="whiteAlpha.300" />
                    <MenuItem 
                      bg="transparent"
                      _hover={{ bg: "whiteAlpha.100" }}
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
                  bg="rgba(20, 20, 30, 0.5)"
                  backdropFilter="blur(8px)"
                  borderWidth="1px"
                  borderColor="whiteAlpha.200"
                  borderRadius="xl"
                  p={3}
                  boxShadow="0 4px 12px rgba(0,0,0,0.1)"
                  as={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <HStack>
                    <Text color="whiteAlpha.700" fontSize="sm" fontWeight="medium">
                      Active Filters:
                    </Text>
                  </HStack>
                  {selectedTags.map(tag => (
                    <Tag
                      key={tag}
                      size="md"
                      borderRadius="full"
                      variant="solid"
                      colorScheme={getTagColorScheme(tag)}
                      boxShadow="0 2px 5px rgba(0,0,0,0.2)"
                      py={1.5}
                      px={3}
                      as={motion.div}
                      whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <TagLabel fontWeight="medium">{tag}</TagLabel>
                      <TagCloseButton onClick={() => handleTagSelect(tag)} />
                    </Tag>
                  ))}
                  {selectedTags.length > 0 && (
                    <Button 
                      size="xs" 
                      onClick={clearFilters} 
                      variant="ghost" 
                      color="whiteAlpha.700"
                      fontWeight="medium"
                      _hover={{ color: "white", bg: "whiteAlpha.100" }}
                    >
                      Clear All
                    </Button>
                  )}
                </Flex>
              )}
            </Flex>
            
            {/* Tags Filter Section - Improved Design */}
            <Box 
              as={motion.div}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              bg="rgba(30, 30, 45, 0.7)"
              backdropFilter="blur(10px)"
              borderRadius="xl"
              borderWidth="1px"
              borderColor="rgba(255, 255, 255, 0.1)"
              overflow="hidden"
              p={4}
              mt={6}
              mb={6}
              boxShadow="0 10px 30px -5px rgba(0, 0, 0, 0.3)"
            >
              <Flex 
                align="center" 
                mb={4}
                pb={3}
                borderBottom="1px solid"
                borderColor="whiteAlpha.200"
              >
                <Icon 
                  as={FaTags} 
                  color="red.400" 
                  boxSize={5} 
                  mr={3}
                />
                <Heading size="md" fontWeight="semibold" color="white">
                  Filter by Tags
                </Heading>
              </Flex>
              
              {/* Tags Categories in Pills */}
              <Tabs 
                variant="soft-rounded" 
                colorScheme="red" 
                size="md" 
                isFitted 
                mb={6}
                mt={2}
              >
                <TabList 
                  bg="rgba(0, 0, 0, 0.2)" 
                  p={1.5} 
                  borderRadius="full" 
                  mb={6}
                  overflowX="auto"
                  css={{
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': {
                      display: 'none',
                    },
                  }}
                >
                  <Tab 
                    _selected={{ 
                      color: 'white', 
                      bg: 'red.600',
                      fontWeight: 'bold' 
                    }}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.300"
                    _hover={{
                      color: 'white',
                      bg: 'rgba(255, 255, 255, 0.08)'
                    }}
                    px={4}
                  >
                    Genre
                  </Tab>
                  <Tab 
                    _selected={{ 
                      color: 'white', 
                      bg: 'blue.600',
                      fontWeight: 'bold' 
                    }}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.300"
                    _hover={{
                      color: 'white',
                      bg: 'rgba(255, 255, 255, 0.08)'
                    }}
                    px={4}
                  >
                    Mood
                  </Tab>
                  <Tab 
                    _selected={{ 
                      color: 'white', 
                      bg: 'green.600',
                      fontWeight: 'bold' 
                    }}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.300"
                    _hover={{
                      color: 'white',
                      bg: 'rgba(255, 255, 255, 0.08)'
                    }}
                    px={4}
                  >
                    Instrument
                  </Tab>
                  <Tab 
                    _selected={{ 
                      color: 'white', 
                      bg: 'purple.600',
                      fontWeight: 'bold' 
                    }}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="medium"
                    color="gray.300"
                    _hover={{
                      color: 'white',
                      bg: 'rgba(255, 255, 255, 0.08)'
                    }}
                    px={4}
                  >
                    Tempo
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Genre Tags */}
                  <TabPanel p={0}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Wrap spacing={2}>
                        {SAMPLE_TAGS.genre.map(tag => (
                          <WrapItem key={tag}>
                            <MotionBox
                              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}
                              transition={{ duration: 0.2 }}
                            >
                              <Tag
                                size="lg"
                                colorScheme="red"
                                variant={selectedTags.includes(tag) ? "solid" : "subtle"}
                                cursor="pointer"
                                onClick={() => handleTagSelect(tag)}
                                px={3}
                                py={2}
                                borderRadius="full"
                                fontWeight={selectedTags.includes(tag) ? "bold" : "medium"}
                                opacity={selectedTags.includes(tag) ? 1 : 0.8}
                                boxShadow={selectedTags.includes(tag) ? "0 0 0 1px rgba(255,255,255,0.2)" : "none"}
                                _hover={{ opacity: 1 }}
                              >
                                {selectedTags.includes(tag) && (
                                  <Icon as={FaCheck} mr={1} boxSize={3} />
                                )}
                                {tag}
                              </Tag>
                            </MotionBox>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </motion.div>
                  </TabPanel>

                  {/* Mood Tags */}
                  <TabPanel p={0}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Wrap spacing={2}>
                        {SAMPLE_TAGS.mood.map(tag => (
                          <WrapItem key={tag}>
                            <MotionBox
                              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}
                              transition={{ duration: 0.2 }}
                            >
                              <Tag
                                size="lg"
                                colorScheme="blue"
                                variant={selectedTags.includes(tag) ? "solid" : "subtle"}
                                cursor="pointer"
                                onClick={() => handleTagSelect(tag)}
                                px={3}
                                py={2}
                                borderRadius="full"
                                fontWeight={selectedTags.includes(tag) ? "bold" : "medium"}
                                opacity={selectedTags.includes(tag) ? 1 : 0.8}
                                boxShadow={selectedTags.includes(tag) ? "0 0 0 1px rgba(255,255,255,0.2)" : "none"}
                                _hover={{ opacity: 1 }}
                              >
                                {selectedTags.includes(tag) && (
                                  <Icon as={FaCheck} mr={1} boxSize={3} />
                                )}
                                {tag}
                              </Tag>
                            </MotionBox>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </motion.div>
                  </TabPanel>

                  {/* Instrument Tags */}
                  <TabPanel p={0}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Wrap spacing={2}>
                        {SAMPLE_TAGS.instrument.map(tag => (
                          <WrapItem key={tag}>
                            <MotionBox
                              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}
                              transition={{ duration: 0.2 }}
                            >
                              <Tag
                                size="lg"
                                colorScheme="green"
                                variant={selectedTags.includes(tag) ? "solid" : "subtle"}
                                cursor="pointer"
                                onClick={() => handleTagSelect(tag)}
                                px={3}
                                py={2}
                                borderRadius="full"
                                fontWeight={selectedTags.includes(tag) ? "bold" : "medium"}
                                opacity={selectedTags.includes(tag) ? 1 : 0.8}
                                boxShadow={selectedTags.includes(tag) ? "0 0 0 1px rgba(255,255,255,0.2)" : "none"}
                                _hover={{ opacity: 1 }}
                              >
                                {selectedTags.includes(tag) && (
                                  <Icon as={FaCheck} mr={1} boxSize={3} />
                                )}
                                {tag}
                              </Tag>
                            </MotionBox>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </motion.div>
                  </TabPanel>

                  {/* Tempo Tags */}
                  <TabPanel p={0}>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Wrap spacing={2}>
                        {SAMPLE_TAGS.tempo.map(tag => (
                          <WrapItem key={tag}>
                            <MotionBox
                              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.3)" }}
                              transition={{ duration: 0.2 }}
                            >
                              <Tag
                                size="lg"
                                colorScheme="purple"
                                variant={selectedTags.includes(tag) ? "solid" : "subtle"}
                                cursor="pointer"
                                onClick={() => handleTagSelect(tag)}
                                px={3}
                                py={2}
                                borderRadius="full"
                                fontWeight={selectedTags.includes(tag) ? "bold" : "medium"}
                                opacity={selectedTags.includes(tag) ? 1 : 0.8}
                                boxShadow={selectedTags.includes(tag) ? "0 0 0 1px rgba(255,255,255,0.2)" : "none"}
                                _hover={{ opacity: 1 }}
                              >
                                {selectedTags.includes(tag) && (
                                  <Icon as={FaCheck} mr={1} boxSize={3} />
                                )}
                                {tag}
                              </Tag>
                            </MotionBox>
                          </WrapItem>
                        ))}
                      </Wrap>
                    </motion.div>
                  </TabPanel>
                </TabPanels>
              </Tabs>
              
              {/* Search for tags */}
              <InputGroup mb={4} size="md">
                <InputLeftElement pointerEvents="none">
                  <FaSearch color="gray.300" />
                </InputLeftElement>
                <Input
                  placeholder="Search tags..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  bg="rgba(0, 0, 0, 0.3)"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  color="white"
                  _placeholder={{ color: "gray.400" }}
                  _hover={{ borderColor: "whiteAlpha.400" }}
                  _focus={{ borderColor: "red.400", boxShadow: "0 0 0 1px var(--chakra-colors-red-400)" }}
                />
              </InputGroup>
            </Box>
            
            {/* Active Tags Display - Improved Style */}
            {selectedTags.length > 0 && (
              <MotionBox
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                bg="rgba(20, 20, 30, 0.8)"
                backdropFilter="blur(12px)"
                borderRadius="xl"
                borderWidth="1px"
                borderColor="whiteAlpha.200"
                p={4}
                mb={6}
                boxShadow="0 10px 30px -5px rgba(0, 0, 0, 0.3)"
              >
                <Flex justify="space-between" align="center" mb={3}>
                  <HStack>
                    <Icon as={FaFilter} color="brand.400" />
                    <Text color="white" fontWeight="semibold">
                      Active Filters
                    </Text>
                  </HStack>
                  <Button
                    size="xs"
                    colorScheme="gray"
                    variant="ghost"
                    onClick={clearFilters}
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    Clear All
                  </Button>
                </Flex>
                
                <Wrap spacing={2}>
                  {selectedTags.map(tag => (
                    <WrapItem key={tag}>
                      <MotionBox
                        whileHover={{ y: -2, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Tag
                          size="md"
                          borderRadius="full"
                          variant="solid"
                          colorScheme={getTagColorScheme(tag)}
                          boxShadow="0 2px 10px rgba(0,0,0,0.2)"
                          py={1.5}
                          px={3}
                        >
                          <TagLabel fontWeight="medium">{tag}</TagLabel>
                          <TagCloseButton 
                            onClick={() => handleTagSelect(tag)}
                            ml={1}
                            boxSize={4}
                            _hover={{ bg: "rgba(0,0,0,0.2)" }}
                          />
                        </Tag>
                      </MotionBox>
                    </WrapItem>
                  ))}
                </Wrap>
              </MotionBox>
            )}
          </MotionBox>
          
          {/* Samples Box */}
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Box
              bg="rgba(20, 20, 30, 0.7)"
              backdropFilter="blur(8px)"
              borderRadius="xl"
              p={{ base: 5, md: 7 }}
              border="1px solid"
              borderColor="whiteAlpha.200"
              boxShadow="0 10px 30px rgba(0,0,0,0.2)"
              overflow="hidden"
              position="relative"
            >
              {/* Results header with filter info */}
              {selectedTags.length > 0 && (
                <Box 
                  mb={6} 
                  p={4} 
                  bg="rgba(15, 15, 20, 0.6)" 
                  borderRadius="lg"
                  borderLeft="4px solid"
                  borderColor="brand.500"
                  as={motion.div}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Flex
                    justify="space-between"
                    align="center"
                    flexWrap="wrap"
                    gap={3}
                  >
                    <HStack spacing={3}>
                      <Icon as={FaFilter} color="brand.400" />
                      <Text color="whiteAlpha.900" fontWeight="medium">
                        Showing samples with all selected tags
                      </Text>
                    </HStack>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      borderColor="brand.500"
                      color="white"
                      onClick={clearFilters}
                      _hover={{ bg: "rgba(214, 34, 34, 0.1)" }}
                      transition="all 0.2s"
                    >
                      Clear Filters
                    </Button>
                  </Flex>
                </Box>
              )}
            
              {loading && samples.length === 0 ? (
                <Flex justify="center" align="center" h="300px" direction="column">
                  <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="whiteAlpha.200"
                    color="brand.500"
                    size="xl"
                    mb={4}
                  />
                  <Text color="whiteAlpha.800" fontSize="lg" fontWeight="medium">Loading samples...</Text>
                </Flex>
              ) : error ? (
                <Box textAlign="center" p={8} color="red.400">
                  <Text fontSize="lg">Error loading samples. Please try again later.</Text>
                  <Button 
                    mt={5} 
                    bgGradient="linear(to-r, brand.500, brand.600)"
                    _hover={{
                      bgGradient: "linear(to-r, brand.400, brand.500)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 5px 15px rgba(214, 34, 34, 0.3)",
                    }}
                    color="white"
                    onClick={refreshSamples}
                    px={8}
                    py={6}
                    fontWeight="medium"
                    transition="all 0.3s"
                  >
                    Retry
                  </Button>
                </Box>
              ) : samples.length === 0 ? (
                <Box 
                  textAlign="center" 
                  p={12} 
                  color="white"
                  bg="rgba(15, 15, 20, 0.3)"
                  borderRadius="lg"
                >
                  <Icon as={FaInfoCircle} boxSize={14} color="brand.400" mb={5} />
                  <Heading fontSize="2xl" mb={4} fontWeight="bold">No samples found</Heading>
                  <Text fontSize="md" color="whiteAlpha.800" mb={6} maxW="600px" mx="auto" lineHeight="1.7">
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
                    <Button 
                      bgGradient="linear(to-r, brand.500, brand.600)"
                      _hover={{
                        bgGradient: "linear(to-r, brand.400, brand.500)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 5px 15px rgba(214, 34, 34, 0.3)",
                      }}
                      color="white"
                      onClick={clearFilters}
                      px={6}
                      py={5}
                      fontWeight="medium"
                      transition="all 0.3s"
                    >
                      Clear All Filters
                    </Button>
                    <Button 
                      variant="outline" 
                      borderColor="accent.blue.500"
                      color="white"
                      _hover={{
                        bg: "rgba(66, 153, 225, 0.1)",
                        transform: "translateY(-2px)",
                      }}
                      onClick={refreshSamples}
                      px={6}
                      py={5}
                      fontWeight="medium"
                      transition="all 0.3s"
                    >
                      Refresh Samples
                    </Button>
                  </HStack>
                </Box>
              ) : (
                <VStack spacing={5} align="stretch">
                  {console.log(`Rendering ${samples.length} samples in SamplesPage`)}
                  {samples.map((sample, index) => (
                    <MotionBox
                      key={sample.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * Math.min(index, 10), duration: 0.4 }}
                    >
                      <SampleRow track={sample} onDelete={() => refreshSamples()} />
                    </MotionBox>
                  ))}
                </VStack>
              )}
              
              {/* Load More Button */}
              {hasMore && !loading && samples.length > 0 && (
                <MotionBox
                  display="flex"
                  justifyContent="center"
                  mt={8}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <Button
                    onClick={loadMoreSamples}
                    isLoading={loading}
                    bgGradient="linear(to-r, brand.500, brand.600)"
                    _hover={{
                      bgGradient: "linear(to-r, brand.400, brand.500)",
                      transform: "translateY(-2px)",
                      boxShadow: "0 5px 15px rgba(214, 34, 34, 0.3)",
                    }}
                    color="white"
                    size="lg"
                    px={8}
                    py={6}
                    fontWeight="medium"
                    transition="all 0.3s"
                    rightIcon={<FaChevronRight />}
                  >
                    Load More Samples
                  </Button>
                </MotionBox>
              )}
              
              {/* Load More Indicator */}
              {hasMore && loading && samples.length > 0 && (
                <Flex justify="center" py={8}>
                  <Spinner size="lg" color="brand.500" thickness="4px" />
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
        <DrawerOverlay bg="rgba(0,0,0,0.7)" backdropFilter="blur(5px)" />
        <DrawerContent 
          bg="rgba(20, 20, 30, 0.95)"
          backdropFilter="blur(10px)"
          boxShadow="-10px 0 30px rgba(0, 0, 0, 0.5)"
          borderLeft="1px solid"
          borderColor="whiteAlpha.100"
          color="white"
        >
          <DrawerCloseButton size="lg" top={6} right={6} color="whiteAlpha.700" _hover={{ color: "white" }} />
          <DrawerHeader 
            borderBottomWidth="1px" 
            borderColor="whiteAlpha.200"
            py={8}
            bgGradient="linear(to-r, darkBg.800, brand.800)"
          >
            <Heading 
              size="lg" 
              bgGradient="linear(to-r, white, whiteAlpha.700)"
              bgClip="text"
            >
              Filter Samples
            </Heading>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={8} align="stretch" pt={6}>
              {/* Multi-tag selection info */}
              <Box 
                p={5} 
                bg="rgba(66, 153, 225, 0.15)" 
                borderRadius="lg" 
                borderLeft="4px solid" 
                borderColor="accent.blue.500"
              >
                <HStack alignItems="flex-start" spacing={3}>
                  <Icon as={FaInfoCircle} color="accent.blue.400" mt={1} boxSize={5} />
                  <Text fontSize="sm" lineHeight="1.7" color="whiteAlpha.900">
                    When selecting multiple tags, only samples containing <Text as="span" fontWeight="bold">ALL</Text> selected tags will be shown
                  </Text>
                </HStack>
              </Box>
            
              {/* Sort Options */}
              <Box>
                <Flex align="center" mb={5}>
                  <Icon as={FaSearch} color="brand.400" boxSize={5} />
                  <Text ml={3} fontWeight="bold" fontSize="lg">Sort By</Text>
                </Flex>
                <Select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setTimeout(() => refreshSamples(), 0);
                  }}
                  bg="rgba(25, 25, 35, 0.6)"
                  border="1px solid"
                  borderColor="whiteAlpha.300"
                  size="lg"
                  _hover={{ borderColor: 'brand.500' }}
                  fontWeight="medium"
                  borderRadius="md"
                  h="50px"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="trending">Trending</option>
                </Select>
              </Box>

              <Divider borderColor="whiteAlpha.200" />
              
              {/* Musical Key Filter */}
              <Box>
                <Flex align="center" mb={4}>
                  <Icon as={MdMusicNote} color="orange.400" boxSize={5} />
                  <Text ml={3} fontWeight="bold" fontSize="lg">Musical Key</Text>
                </Flex>
                
                <Box 
                  bg="rgba(25, 25, 35, 0.6)" 
                  borderRadius="lg" 
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor="accent.orange.500"
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
                    <MenuList 
                      bg="rgba(20, 20, 30, 0.95)"
                      backdropFilter="blur(10px)"
                      borderColor="whiteAlpha.200"
                      boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
                      maxH="300px" 
                      overflowY="auto"
                    >
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
                            bg="transparent"
                            _hover={{ bg: "orange.700" }}
                            color="white"
                            transition="background 0.2s"
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
                            bg="transparent"
                            _hover={{ bg: "orange.700" }}
                            color="white"
                            transition="background 0.2s"
                          >
                            {key}
                          </MenuItem>
                        ))
                      }
                      <Divider my={2} borderColor="whiteAlpha.300" />
                      <MenuItem 
                        bg="transparent"
                        _hover={{ bg: "whiteAlpha.100" }}
                        color="gray.300"
                        onClick={() => {
                          const newTags = selectedTags.filter(tag => !SAMPLE_TAGS.key.includes(tag));
                          setSelectedTags(newTags);
                          setTimeout(() => refreshSamples(), 0);
                        }}
                        transition="background 0.2s"
                      >
                        Clear Key Filter
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Box>
              </Box>

              <Divider borderColor="whiteAlpha.200" />
              
              {/* Active Tags in Drawer */}
              {selectedTags.length > 0 && (
                <Box>
                  <Flex align="center" mb={4}>
                    <Icon as={FaFilter} color="brand.400" boxSize={5} />
                    <Text ml={3} fontWeight="bold" fontSize="lg">Selected Tags</Text>
                  </Flex>
                  
                  <Flex 
                    wrap="wrap" 
                    gap={2} 
                    p={4}
                    bg="rgba(25, 25, 35, 0.5)"
                    borderRadius="lg"
                    borderWidth="1px"
                    borderColor="whiteAlpha.200"
                  >
                    {selectedTags.map(tag => (
                      <Tag
                        key={tag}
                        size="lg"
                        borderRadius="full"
                        variant="solid"
                        colorScheme={getTagColorScheme(tag)}
                        boxShadow="0 2px 5px rgba(0,0,0,0.2)"
                        py={2}
                        px={4}
                        mb={1}
                      >
                        <TagLabel fontWeight="medium">{tag}</TagLabel>
                        <TagCloseButton onClick={() => handleTagSelect(tag)} />
                      </Tag>
                    ))}
                  </Flex>
                  
                  <Button
                    mt={4}
                    width="full"
                    bgGradient="linear(to-r, brand.500, brand.600)"
                    _hover={{
                      bgGradient: "linear(to-r, brand.400, brand.500)",
                    }}
                    color="white"
                    onClick={clearFilters}
                    py={6}
                    fontWeight="medium"
                    transition="all 0.3s"
                  >
                    Clear All Filters
                  </Button>
                </Box>
              )}
              
              <Divider borderColor="whiteAlpha.200" />

              {/* Close Button */}
              <Button
                onClick={onClose}
                variant="outline"
                borderColor="whiteAlpha.400"
                color="white"
                _hover={{ bg: "whiteAlpha.100" }}
                size="lg"
                py={6}
                leftIcon={<FaChevronRight transform="rotate(180deg)" />}
              >
                Apply Filters & Close
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
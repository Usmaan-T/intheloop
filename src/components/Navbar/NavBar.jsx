import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Button,
  Heading,
  Link,
  HStack,
  Spacer,
  IconButton,
  useColorModeValue,
  VStack,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  InputGroup,
  InputLeftElement,
  Avatar,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Divider,
  useOutsideClick,
  Portal,
  Center,
  Spinner,
  CloseButton,
  InputRightElement,
  Image,
  Kbd,
  List,
  ListItem,
  Tooltip,
  Badge,
  Collapse,
  Icon
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { useLogout } from '../../hooks/useLogout';
import { motion } from 'framer-motion';
import { useLocation, Link as RouterLink, useNavigate } from 'react-router-dom';
import { FaHome, FaCompass, FaHeadphones, FaUpload, FaUser, FaCalendarDay, FaUsers, FaHistory, FaTimes, FaMicrophone, FaUserAlt, FaTrash, FaKeyboard } from 'react-icons/fa';
import useFindUsers from '../../hooks/useFindUsers';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const NavBar = () => {
  const [user] = useAuthState(auth);
  const { handleLogout, error, loading } = useLogout();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const searchRef = useRef();
  const location = useLocation();
  const navigate = useNavigate();

  useOutsideClick({
    ref: searchRef,
    handler: onSearchClose,
  });

  const navItems = [
    { name: "Home", path: "/", icon: <FaHome /> },
    { name: "Explore", path: "/explore", icon: <FaCompass /> },
    { name: "Daily", path: "/daily", icon: <FaCalendarDay /> },
    { name: "Samples", path: "/samples", icon: <FaHeadphones /> },
    { name: "Upload", path: "/upload", icon: <FaUpload /> },
    { name: "Profile", path: "/profilepage", icon: <FaUser /> },
    { name: "Community", path: "/community", icon: <FaUsers /> },
  ];

  const isActive = (path) => location.pathname === path;

  const { 
    users, 
    loading: searchLoading, 
    error: searchError, 
    searchUsers, 
    clearSearch,
    recentSearches,
    addToRecentSearches,
    removeFromRecentSearches,
    clearSearchHistory
  } = useFindUsers();
  
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef();
  
  // New state for enhanced search functionality
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isListeningForVoice, setIsListeningForVoice] = useState(false);
  const [showSearchHelp, setShowSearchHelp] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Handle search input with debounce
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    setActiveIndex(-1);
    
    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a new timeout for searching
    if (value.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(value);
      }, 300);
    } else if (value.length === 0) {
      clearSearch();
    }
  };

  // Handle keyboard navigation in search results
  const handleSearchKeyDown = (e) => {
    const visibleResults = users.length > 0 ? users : [];
    const totalItems = visibleResults.length;
    
    if (totalItems === 0) return;
    
    // Arrow down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prevIndex) => (prevIndex < totalItems - 1 ? prevIndex + 1 : 0));
    }
    // Arrow up
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : totalItems - 1));
    }
    // Enter key
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < totalItems) {
        handleUserSelect(visibleResults[activeIndex]);
      }
    }
    // Escape key
    else if (e.key === 'Escape') {
      e.preventDefault();
      setIsSearchFocused(false);
    }
  };

  // Voice search functionality
  const startVoiceSearch = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.log("Speech recognition not supported");
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    
    setIsListeningForVoice(true);
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchValue(transcript);
      searchUsers(transcript);
      setIsListeningForVoice(false);
    };
    
    recognition.onerror = (event) => {
      console.log("Voice recognition error:", event.error);
      setIsListeningForVoice(false);
    };
    
    recognition.onend = () => {
      setIsListeningForVoice(false);
    };
    
    recognition.start();
  };

  // Update user select to add to recent searches
  const handleUserSelect = (user) => {
    if (!user || !user.id) return;
    
    // Navigate to the user profile page
    navigate(`/user/${user.id}`);
    
    // Add to recent searches
    addToRecentSearches(user);
    
    // Clear search state
    setIsSearchFocused(false);
    clearSearch();
    setSearchValue('');
  };

  // Clear search input
  const clearSearchInput = () => {
    setSearchValue('');
    clearSearch();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle outside clicks for search results
  useOutsideClick({
    ref: searchInputRef,
    handler: () => setIsSearchFocused(false),
  });

  return (
    <MotionBox 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      bg="rgba(10, 10, 14, 0.85)"
      backdropFilter="blur(10px)"
      color="white" 
      px={{ base: 4, md: 8 }} 
      py={3} 
      shadow="0 4px 30px rgba(0, 0, 0, 0.3)"
      position="sticky"
      top={0}
      zIndex={1000}
      borderBottom="1px solid"
      borderColor="whiteAlpha.100"
    >
      <Flex align="center">
        {/* Logo and Site Name */}
        <HStack 
          spacing={3} 
          as={RouterLink} 
          to="/" 
          _hover={{ 
            textDecoration: 'none',
            transform: 'scale(1.05)' 
          }}
          transition="transform 0.2s"
        >
          <Heading 
            size="xl" 
            fontWeight="bold" 
            bgGradient="linear(to-r, brand.400, brand.600)" 
            bgClip="text"
            letterSpacing="tight"
          >
            The Loop
          </Heading>
        </HStack>

        <Spacer />

        {/* Enhanced Search Bar */}
        <Box 
          display={{ base: 'none', md: 'block' }} 
          width="35%" 
          position="relative"
          ref={searchInputRef}
        >
          <InputGroup>
            <InputLeftElement pointerEvents="none" h="full">
              <SearchIcon color="whiteAlpha.600" />
            </InputLeftElement>
            <Input 
              placeholder="Search users..." 
              variant="filled" 
              bg="whiteAlpha.100" 
              _hover={{ bg: "whiteAlpha.200" }} 
              _focus={{ bg: "whiteAlpha.200", borderColor: "brand.500" }} 
              borderRadius="full"
              value={searchValue}
              onChange={handleSearchInput}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              fontSize="sm"
              fontWeight="medium"
              transition="all 0.3s ease"
              pr="85px"
              aria-label="Search for users"
            />
            <InputRightElement width="85px" h="full">
              <HStack spacing={1} pr={1}>
                {isListeningForVoice ? (
                  <Spinner size="sm" color="brand.400" />
                ) : (
                  <>
                    {searchValue && (
                      <IconButton
                        aria-label="Clear search"
                        icon={<FaTimes />}
                        size="sm"
                        variant="ghost"
                        color="whiteAlpha.700" 
                        _hover={{ color: "white" }}
                        onClick={clearSearchInput}
                      />
                    )}
                    <Tooltip label="Search with voice" placement="top" hasArrow>
                      <IconButton
                        aria-label="Voice search"
                        icon={<FaMicrophone />}
                        size="sm"
                        variant="ghost"
                        color="whiteAlpha.700" 
                        _hover={{ color: "brand.400" }}
                        onClick={startVoiceSearch}
                      />
                    </Tooltip>
                    <Tooltip label="Search tips" placement="top" hasArrow>
                      <IconButton
                        aria-label="Search help"
                        icon={<FaKeyboard />}
                        size="sm"
                        variant="ghost"
                        color="whiteAlpha.700" 
                        _hover={{ color: "brand.400" }}
                        onClick={() => setShowSearchHelp(!showSearchHelp)}
                      />
                    </Tooltip>
                  </>
                )}
              </HStack>
            </InputRightElement>
          </InputGroup>
          
          {/* Search keyboard shortcuts help */}
          <Collapse in={showSearchHelp} animateOpacity>
            <Box
              position="absolute"
              top="100%"
              right={0}
              mt={2}
              bg="rgba(20, 20, 30, 0.95)"
              backdropFilter="blur(10px)"
              boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
              borderRadius="md"
              zIndex={11}
              border="1px solid"
              borderColor="whiteAlpha.200"
              p={3}
              maxW="250px"
            >
              <Text fontSize="xs" color="whiteAlpha.700" mb={2}>Keyboard Shortcuts</Text>
              <HStack mb={1} fontSize="xs">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <Text color="white">Navigate results</Text>
              </HStack>
              <HStack mb={1} fontSize="xs">
                <Kbd>Enter</Kbd>
                <Text color="white">Select highlighted result</Text>
              </HStack>
              <HStack fontSize="xs">
                <Kbd>Esc</Kbd>
                <Text color="white">Close search results</Text>
              </HStack>
            </Box>
          </Collapse>
          
          {/* Enhanced Search Results Dropdown */}
          {isSearchFocused && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              mt={2}
              bg="rgba(20, 20, 30, 0.95)"
              backdropFilter="blur(10px)"
              boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
              borderRadius="md"
              overflow="hidden"
              maxH="400px"
              overflowY="auto"
              zIndex={10}
              border="1px solid"
              borderColor="whiteAlpha.200"
              animation="fadeIn 0.2s ease-out"
            >
              {searchLoading ? (
                <Center py={4}>
                  <Spinner size="sm" color="brand.400" mr={2} />
                  <Text>Searching...</Text>
                </Center>
              ) : searchError ? (
                <Box p={4} color="red.300">
                  Error: {searchError}
                </Box>
              ) : users.length > 0 ? (
                <List spacing={0}>
                  {users.map((user, index) => (
                    <ListItem
                      key={user.id}
                      bg={index === activeIndex ? "whiteAlpha.100" : "transparent"}
                      _hover={{ bg: "whiteAlpha.100" }}
                      transition="background 0.2s"
                    >
                      <Box 
                        p={3}
                        cursor="pointer"
                        onClick={() => handleUserSelect(user)}
                        display="flex"
                        alignItems="center"
                      >
                        <Avatar 
                          size="sm" 
                          src={user.photoURL} 
                          name={user.username || user.displayName}
                          mr={3}
                          border="2px solid"
                          borderColor={index === activeIndex ? "brand.500" : "transparent"}
                          transition="border-color 0.2s"
                        />
                        <Box flex="1">
                          <Text fontWeight="medium">
                            {user.username || user.displayName || 'Unnamed User'}
                          </Text>
                          {user.bio && (
                            <Text fontSize="xs" color="gray.400" noOfLines={1}>
                              {user.bio}
                            </Text>
                          )}
                        </Box>
                        {index === activeIndex && (
                          <Badge ml={2} colorScheme="brand" variant="subtle">
                            Enter ↵
                          </Badge>
                        )}
                      </Box>
                    </ListItem>
                  ))}
                </List>
              ) : searchValue.length >= 2 ? (
                <Box p={4} textAlign="center">
                  <Text>No users found matching "{searchValue}"</Text>
                </Box>
              ) : recentSearches.length > 0 ? (
                <Box>
                  <Flex justify="space-between" align="center" p={3} bg="whiteAlpha.50">
                    <Text fontSize="xs" color="whiteAlpha.700" fontWeight="medium">RECENT SEARCHES</Text>
                    <Button 
                      size="xs" 
                      colorScheme="whiteAlpha" 
                      variant="ghost" 
                      onClick={clearSearchHistory}
                      _hover={{ bg: "whiteAlpha.100" }}
                    >
                      Clear
                    </Button>
                  </Flex>
                  <List spacing={0}>
                    {recentSearches.map((item, index) => (
                      <ListItem
                        key={item.id}
                        bg={index === activeIndex ? "whiteAlpha.100" : "transparent"}
                        _hover={{ bg: "whiteAlpha.100" }}
                        transition="background 0.2s"
                      >
                        <Flex 
                          p={3}
                          cursor="pointer"
                          onClick={() => navigate(`/user/${item.id}`)}
                          align="center"
                          justify="space-between"
                        >
                          <HStack>
                            <Avatar 
                              size="sm" 
                              src={item.photoURL} 
                              name={item.name}
                              mr={2}
                            />
                            <Box>
                              <HStack>
                                <Icon as={FaHistory} color="whiteAlpha.500" boxSize={3} />
                                <Text>{item.name}</Text>
                              </HStack>
                            </Box>
                          </HStack>
                          <IconButton
                            icon={<FaTrash />}
                            variant="ghost"
                            size="xs"
                            color="whiteAlpha.500"
                            _hover={{ color: "red.400" }}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromRecentSearches(item.id);
                            }}
                            aria-label="Remove from search history"
                          />
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ) : (
                <Box p={4} textAlign="center" color="whiteAlpha.600">
                  <Text fontSize="sm">Start typing to search for users</Text>
                </Box>
              )}
            </Box>
          )}
        </Box>

        <Spacer />

        {/* Desktop Navigation */}
        <HStack spacing={4} display={{ base: 'none', md: 'flex' }}>
          {navItems.slice(0, 4).map((item) => (
            <Link 
              key={item.name}
              as={RouterLink}
              to={item.path}
              fontSize="md"
              display="flex"
              alignItems="center"
              position="relative"
              px={2}
              py={1}
              fontWeight="medium"
              color={isActive(item.path) ? "white" : "whiteAlpha.800"}
              _hover={{ 
                textDecoration: 'none', 
                color: "white",
                transform: "translateY(-2px)"
              }}
              transition="all 0.2s"
            >
              <Box mr={2}>{item.icon}</Box>
              {item.name}
              {isActive(item.path) && (
                <Box 
                  position="absolute" 
                  bottom="-6px" 
                  left="50%"
                  transform="translateX(-50%)"
                  width="20px" 
                  height="3px" 
                  bgGradient="linear(to-r, brand.400, brand.600)"
                  borderRadius="full"
                  as={motion.div}
                  initial={{ width: 0 }}
                  animate={{ width: "20px" }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </Link>
          ))}
          
          {/* More dropdown for additional nav items */}
          <Menu>
            <MenuButton 
              as={Button} 
              rightIcon={<ChevronDownIcon />} 
              variant="ghost" 
              color="white"
              fontWeight="medium"
              size="sm"
              _hover={{ bg: "whiteAlpha.100", transform: "translateY(-2px)" }}
              _active={{ bg: "whiteAlpha.200" }}
              transition="all 0.2s"
            >
              More
            </MenuButton>
            <MenuList 
              bg="rgba(20, 20, 30, 0.95)"
              backdropFilter="blur(10px)"
              borderColor="whiteAlpha.200"
              boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
            >
              {navItems.slice(4).map((item) => (
                <MenuItem 
                  key={item.name} 
                  as={RouterLink} 
                  to={item.path} 
                  icon={item.icon}
                  bg="transparent"
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  {item.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </HStack>

        {/* Desktop Auth / Profile */}
        <HStack spacing={4} display={{ base: 'none', md: 'flex' }} ml={4}>
          {user ? (
            <Popover placement="bottom-end">
              <PopoverTrigger>
                <Button 
                  variant="ghost" 
                  borderRadius="full" 
                  display="flex" 
                  alignItems="center"
                  color="white"
                  _hover={{ bg: "whiteAlpha.100", transform: "translateY(-2px)" }}
                  transition="all 0.2s"
                  pl={2}
                  pr={4}
                >
                  <Avatar 
                    size="sm" 
                    src={user.photoURL || undefined} 
                    mr={2}
                    border="2px solid"
                    borderColor="brand.500"
                  />
                  <Text display={{ base: 'none', lg: 'block' }} fontWeight="medium">
                    {user.displayName || user.email?.split('@')[0]}
                  </Text>
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                bg="rgba(20, 20, 30, 0.95)"
                backdropFilter="blur(10px)"
                borderColor="whiteAlpha.200"
                boxShadow="0 8px 32px rgba(0, 0, 0, 0.4)"
                width="200px"
                animation="fadeIn 0.2s ease-out"
              >
                <PopoverBody p={0}>
                  <VStack align="stretch" spacing={0}>
                    <Link as={RouterLink} to="/profilepage" py={3} px={4} _hover={{ bg: "whiteAlpha.100", textDecoration: 'none' }}>
                      Profile
                    </Link>
                    <Link as={RouterLink} to="/settings" py={3} px={4} _hover={{ bg: "whiteAlpha.100", textDecoration: 'none' }}>
                      Settings
                    </Link>
                    <Divider borderColor="whiteAlpha.200" />
                    <Button 
                      onClick={handleLogout} 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      py={3} 
                      px={4}
                      color="red.400"
                      borderRadius={0}
                      isLoading={loading}
                      _hover={{ bg: "rgba(229, 62, 62, 0.2)" }}
                      transition="all 0.2s"
                    >
                      Logout
                    </Button>
                  </VStack>
                </PopoverBody>
              </PopoverContent>
            </Popover>
          ) : (
            <>
              <Button 
                as={RouterLink} 
                to="/auth" 
                variant="ghost" 
                _hover={{ bg: "whiteAlpha.100", transform: "translateY(-2px)" }}
                color="white"
                fontWeight="medium"
                transition="all 0.2s"
              >
                Sign in
              </Button>
              <Button 
                as={RouterLink} 
                to="/auth?mode=register" 
                bgGradient="linear(to-r, brand.500, brand.600)"
                _hover={{ 
                  bgGradient: "linear(to-r, brand.400, brand.500)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(214, 34, 34, 0.4)"
                }}
                color="white"
                fontWeight="medium"
                transition="all 0.2s"
              >
                Register
              </Button>
            </>
          )}
        </HStack>

        {/* Mobile Menu Toggle */}
        <IconButton
          aria-label="Toggle Navigation"
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          display={{ base: 'flex', md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
          variant="ghost"
          fontSize="xl"
          ml={4}
        />
      </Flex>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <MotionBox
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
          mt={4}
          display={{ base: 'block', md: 'none' }}
          overflow="hidden"
        >
          {/* Mobile Logo */}
          <Flex justify="center" mb={4}>
            <Heading 
              size="xl" 
              fontWeight="bold" 
              bgGradient="linear(to-r, white, gray.300)" 
              bgClip="text"
            >
              The Loop
            </Heading>
          </Flex>
          
          {/* Mobile Search - Enhanced */}
          <InputGroup mb={4}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="whiteAlpha.600" />
            </InputLeftElement>
            <Input 
              placeholder="Search users..." 
              variant="filled" 
              bg="whiteAlpha.100" 
              _hover={{ bg: "whiteAlpha.200" }} 
              _focus={{ bg: "whiteAlpha.200", borderColor: "brand.500" }} 
              borderRadius="full"
              value={searchValue}
              onChange={handleSearchInput}
              fontSize="sm"
              fontWeight="medium"
              transition="all 0.3s ease"
            />
            {searchValue && (
              <InputRightElement>
                <IconButton
                  aria-label="Clear search"
                  icon={<FaTimes />}
                  size="sm"
                  variant="ghost"
                  color="whiteAlpha.700" 
                  _hover={{ color: "white" }}
                  onClick={clearSearchInput}
                />
              </InputRightElement>
            )}
          </InputGroup>

          <VStack spacing={0} align="stretch" divider={<Divider borderColor="whiteAlpha.200" />}>
            {navItems.map((item) => (
              <Link 
                key={item.name}
                as={RouterLink} 
                to={item.path} 
                py={3}
                px={2}
                display="flex"
                alignItems="center"
                onClick={onClose}
                bg={isActive(item.path) ? "whiteAlpha.200" : "transparent"}
                _hover={{ bg: "whiteAlpha.100", textDecoration: 'none' }}
              >
                <Box mr={3} fontSize="lg">{item.icon}</Box>
                <Text fontSize="lg">{item.name}</Text>
              </Link>
            ))}
            
            {user ? (
              <>
                <Flex p={4} alignItems="center">
                  <Avatar size="sm" src={user.photoURL || undefined} mr={3} />
                  <Text fontWeight="medium">{user.displayName || user.email?.split('@')[0]}</Text>
                </Flex>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  justifyContent="flex-start" 
                  py={3} 
                  px={4}
                  leftIcon={<Text fontSize="lg">👋</Text>}
                  isLoading={loading}
                  borderRadius={0}
                  _hover={{ bg: "red.700" }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Flex p={4} gap={3}>
                <Button 
                  as={RouterLink} 
                  to="/auth" 
                  variant="outline" 
                  flex={1}
                  onClick={onClose}
                  color="white"
                >
                  Sign in
                </Button>
                <Button 
                  as={RouterLink} 
                  to="/auth?mode=register" 
                  bg="red.600" 
                  _hover={{ bg: "red.700" }} 
                  flex={1}
                  onClick={onClose}
                  color="white"
                >
                  Register
                </Button>
              </Flex>
            )}
          </VStack>
        </MotionBox>
      )}

      {error && (
        <Box mt={2} color="yellow.300" textAlign="center" fontWeight="medium">
          {error}
        </Box>
      )}
    </MotionBox>
  );
};

export default NavBar;

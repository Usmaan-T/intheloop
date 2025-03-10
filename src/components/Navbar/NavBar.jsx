import React, { useRef } from 'react';
import {
  Box,
  Flex,
  Button,
  Heading,
  Link,
  HStack,
  Image,
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
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { useLogout } from '../../hooks/useLogout';
import { motion } from 'framer-motion';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { FaHome, FaCompass, FaHeadphones, FaUpload, FaUser, FaCalendarDay, FaUsers } from 'react-icons/fa';

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

const NavBar = () => {
  const [user] = useAuthState(auth);
  const { handleLogout, error, loading } = useLogout();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const searchRef = useRef();
  const location = useLocation();

  useOutsideClick({
    ref: searchRef,
    handler: onSearchClose,
  });

  const navItems = [
    { name: "Home", path: "/", icon: <FaHome /> },
    { name: "Explore", path: "/beats", icon: <FaCompass /> },
    { name: "Samples", path: "/samples", icon: <FaHeadphones /> },
    { name: "Upload", path: "/upload", icon: <FaUpload /> },
    { name: "Profile", path: "/profilepage", icon: <FaUser /> },
    { name: "Daily", path: "/marketplace", icon: <FaCalendarDay /> },
    { name: "Community", path: "/community", icon: <FaUsers /> },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <MotionBox 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      bgGradient="linear(to-r, red.900, #6F0A14, red.900)" 
      color="white" 
      px={{ base: 4, md: 8 }} 
      py={4} 
      shadow="lg"
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Flex align="center">
        {/* Logo and Site Name */}
        <HStack spacing={3} as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
          {/* <Image 
            src="/images/intheloop.png" 
            alt="Logo" 
            boxSize="40px"
            transition="transform 0.3s ease"
            _hover={{ transform: 'scale(1.1)' }}
          /> */}
          <Heading as="h1" size="lg" fontWeight="bold">
            In the Loop
          </Heading>
        </HStack>

        <Spacer />

        {/* Search Bar */}
        <Box display={{ base: 'none', md: 'block' }} width="30%" ref={searchRef}>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Search..." 
              variant="filled" 
              bg="whiteAlpha.200" 
              _hover={{ bg: "whiteAlpha.300" }} 
              _focus={{ bg: "whiteAlpha.400" }} 
              borderRadius="full"
            />
          </InputGroup>
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
              _hover={{ textDecoration: 'none', bg: "whiteAlpha.200", borderRadius: "md" }}
            >
              <Box mr={2}>{item.icon}</Box>
              {item.name}
              {isActive(item.path) && (
                <Box 
                  position="absolute" 
                  bottom="-8px" 
                  left={0} 
                  width="100%" 
                  height="2px" 
                  bg="red.300"
                  borderRadius="full"
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
              _hover={{ bg: "whiteAlpha.200" }}
              _active={{ bg: "whiteAlpha.300" }}
            >
              More
            </MenuButton>
            <MenuList bg="gray.800" borderColor="gray.700">
              {navItems.slice(4).map((item) => (
                <MenuItem 
                  key={item.name} 
                  as={RouterLink} 
                  to={item.path} 
                  icon={item.icon}
                  bg="transparent"
                  _hover={{ bg: "whiteAlpha.200" }}
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
                  _hover={{ bg: "whiteAlpha.200" }}
                >
                  <Avatar size="sm" src={user.photoURL || undefined} mr={2} />
                  <Text display={{ base: 'none', lg: 'block' }}>
                    {user.displayName || user.email?.split('@')[0]}
                  </Text>
                </Button>
              </PopoverTrigger>
              <PopoverContent bg="gray.800" borderColor="gray.700" width="200px">
                <PopoverBody p={0}>
                  <VStack align="stretch" spacing={0}>
                    <Link as={RouterLink} to="/profile" py={3} px={4} _hover={{ bg: "whiteAlpha.200", textDecoration: 'none' }}>
                      Profile
                    </Link>
                    <Link as={RouterLink} to="/settings" py={3} px={4} _hover={{ bg: "whiteAlpha.200", textDecoration: 'none' }}>
                      Settings
                    </Link>
                    <Divider borderColor="gray.600" />
                    <Button 
                      onClick={handleLogout} 
                      variant="ghost" 
                      justifyContent="flex-start" 
                      py={3} 
                      px={4}
                      borderRadius={0}
                      isLoading={loading}
                      _hover={{ bg: "red.700" }}
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
                to="/login" 
                variant="ghost" 
                _hover={{ bg: "whiteAlpha.200" }}
              >
                Sign in
              </Button>
              <Button 
                as={RouterLink} 
                to="/register" 
                bg="red.600"
                _hover={{ bg: "red.700" }}
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
          {/* Mobile Search */}
          <InputGroup mb={4}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.300" />
            </InputLeftElement>
            <Input 
              placeholder="Search..." 
              variant="filled" 
              bg="whiteAlpha.200" 
              _hover={{ bg: "whiteAlpha.300" }} 
              _focus={{ bg: "whiteAlpha.400" }} 
            />
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
                  to="/login" 
                  variant="outline" 
                  flex={1}
                  onClick={onClose}
                >
                  Sign in
                </Button>
                <Button 
                  as={RouterLink} 
                  to="/register" 
                  bg="red.600" 
                  _hover={{ bg: "red.700" }} 
                  flex={1}
                  onClick={onClose}
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

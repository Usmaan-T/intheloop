import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Spinner,
  useToast,
  Input,
  FormControl,
  FormLabel,
  Switch,
  Divider,
  Badge,
  Card,
  CardBody,
  Flex,
  IconButton,
  Image,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton
} from '@chakra-ui/react';
import { FaArrowUp, FaArrowDown, FaStar, FaRegStar, FaEdit, FaSearch } from 'react-icons/fa';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  updateDoc, 
  doc, 
  limit 
} from 'firebase/firestore';
import { firestore } from '../../firebase/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { isAdmin as checkIsAdmin } from '../../utils/adminUtils';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';

// Helper function to get badge color based on privacy
const getPrivacyColor = (privacy) => {
  return privacy === 'public' ? 'green' : 'red';
};

const ManageFeaturedCollections = () => {
  const [user] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([]);
  const [allPlaylists, setAllPlaylists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    // Use the utility function to check admin status
    const adminStatus = checkIsAdmin(user);
    console.log("Admin check for user:", user.email, "Result:", adminStatus);
    setIsAdmin(adminStatus);
  }, [user]);

  // Fetch featured playlists
  useEffect(() => {
    const fetchFeaturedPlaylists = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const featuredQuery = query(
          collection(firestore, 'playlists'),
          where('isFeatured', '==', true),
          orderBy('featuredOrder', 'asc')
        );

        const snapshot = await getDocs(featuredQuery);
        const playlists = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setFeaturedPlaylists(playlists);
      } catch (error) {
        console.error("Error fetching featured playlists:", error);
        toast({
          title: "Error",
          description: "Failed to load featured playlists",
          status: "error",
          duration: 3000,
          isClosable: true
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedPlaylists();
  }, [user, toast]);

  // Handle search
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      // We'll use a simple query to fetch playlists that potentially match the search term
      // In a real app, you might want to implement a more sophisticated search with Algolia or similar
      const playlistsQuery = query(
        collection(firestore, 'playlists'),
        limit(20)
      );

      const snapshot = await getDocs(playlistsQuery);
      const playlists = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Simple client-side filtering
      const filteredPlaylists = playlists.filter(playlist => 
        playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (playlist.description && playlist.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      setSearchResults(filteredPlaylists);
    } catch (error) {
      console.error("Error searching playlists:", error);
      toast({
        title: "Error",
        description: "Failed to search playlists",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Toggle featured status
  const toggleFeatured = async (playlist) => {
    try {
      const playlistRef = doc(firestore, 'playlists', playlist.id);
      const isFeatured = !playlist.isFeatured;
      
      // If featuring, assign the next order number
      const featuredOrder = isFeatured 
        ? featuredPlaylists.length > 0 
          ? Math.max(...featuredPlaylists.map(p => p.featuredOrder || 0)) + 1
          : 1
        : null;
      
      await updateDoc(playlistRef, {
        isFeatured,
        featuredOrder
      });
      
      toast({
        title: isFeatured ? "Added to Featured" : "Removed from Featured",
        status: "success",
        duration: 2000,
        isClosable: true
      });
      
      // Update local state
      if (isFeatured) {
        const updatedPlaylist = { ...playlist, isFeatured, featuredOrder };
        setFeaturedPlaylists([...featuredPlaylists, updatedPlaylist]);
      } else {
        setFeaturedPlaylists(featuredPlaylists.filter(p => p.id !== playlist.id));
      }
      
      // Update the search results if applicable
      if (searchResults.some(p => p.id === playlist.id)) {
        setSearchResults(searchResults.map(p => 
          p.id === playlist.id ? { ...p, isFeatured, featuredOrder } : p
        ));
      }
    } catch (error) {
      console.error("Error toggling featured status:", error);
      toast({
        title: "Error",
        description: "Failed to update featured status",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Reorder featured playlists
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(featuredPlaylists);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update local state first for responsiveness
    setFeaturedPlaylists(items);
    
    // Now update the order in Firestore
    try {
      const batch = firestore.batch();
      
      items.forEach((playlist, index) => {
        const playlistRef = doc(firestore, 'playlists', playlist.id);
        batch.update(playlistRef, { featuredOrder: index + 1 });
      });
      
      await batch.commit();
      
      toast({
        title: "Order updated",
        status: "success",
        duration: 2000,
        isClosable: true
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order",
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  // Render a playlist card
  const renderPlaylistCard = (playlist, index, isDraggable = false) => {
    const card = (
      <Card 
        bg="gray.800" 
        color="white" 
        borderColor="whiteAlpha.300"
        borderWidth="1px"
        boxShadow="md"
        height="100%"
      >
        <CardBody>
          <Flex direction="row" gap={4}>
            <Box width="80px" height="80px" flexShrink={0}>
              {playlist.coverImage ? (
                <Image 
                  src={playlist.coverImage} 
                  alt={playlist.name} 
                  borderRadius="md"
                  objectFit="cover"
                  height="100%"
                  width="100%"
                />
              ) : (
                <Flex 
                  height="100%"
                  width="100%"
                  bg="purple.700"
                  borderRadius="md"
                  align="center"
                  justify="center"
                >
                  <Text fontSize="2xl">🎵</Text>
                </Flex>
              )}
            </Box>
            
            <Box flex="1">
              <Flex justify="space-between" align="flex-start">
                <VStack align="start" spacing={1}>
                  <Heading size="sm" noOfLines={1}>{playlist.name}</Heading>
                  <Badge colorScheme={getPrivacyColor(playlist.privacy)}>
                    {playlist.privacy}
                  </Badge>
                  <Text fontSize="xs" color="gray.400" noOfLines={2}>
                    {playlist.description || "No description"}
                  </Text>
                </VStack>
                
                <IconButton
                  icon={playlist.isFeatured ? <FaStar /> : <FaRegStar />}
                  colorScheme={playlist.isFeatured ? "yellow" : "gray"}
                  variant="ghost"
                  aria-label={playlist.isFeatured ? "Remove from featured" : "Add to featured"}
                  onClick={() => toggleFeatured(playlist)}
                />
              </Flex>
            </Box>
          </Flex>
        </CardBody>
      </Card>
    );

    if (isDraggable) {
      return (
        <Draggable key={playlist.id} draggableId={playlist.id} index={index}>
          {(provided) => (
            <Box
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              mb={4}
            >
              <Flex align="center" width="100%">
                <Box width="30px" textAlign="center" mr={2}>
                  <Text fontWeight="bold">{index + 1}</Text>
                </Box>
                <Box flex="1">
                  {card}
                </Box>
                <VStack ml={2}>
                  <IconButton 
                    icon={<FaArrowUp />} 
                    size="sm"
                    aria-label="Move up"
                    isDisabled={index === 0}
                    onClick={() => {
                      const newItems = [...featuredPlaylists];
                      [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
                      setFeaturedPlaylists(newItems);
                    }}
                  />
                  <IconButton 
                    icon={<FaArrowDown />} 
                    size="sm"
                    aria-label="Move down"
                    isDisabled={index === featuredPlaylists.length - 1}
                    onClick={() => {
                      const newItems = [...featuredPlaylists];
                      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
                      setFeaturedPlaylists(newItems);
                    }}
                  />
                </VStack>
              </Flex>
            </Box>
          )}
        </Draggable>
      );
    }

    return (
      <Box key={playlist.id} mb={4}>
        {card}
      </Box>
    );
  };

  return (
    <>
      <NavBar />
      <Box bg="gray.900" minH="calc(100vh - 80px)" py={10}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" h="60vh">
            <Spinner size="xl" color="purple.500" />
          </Box>
        ) : !isAdmin ? (
          <Box maxW="container.md" mx="auto" p={8} bg="gray.800" borderRadius="md" boxShadow="lg">
            <Heading size="lg" mb={4} color="white">Access Denied</Heading>
            <Text color="gray.300">
              You don't have permission to access this page. This feature is only available to administrators.
            </Text>
          </Box>
        ) : (
          <VStack spacing={8} w="full" maxW="container.xl" mx="auto" px={4}>
            <Box w="full" textAlign="left">
              <Heading size="2xl" color="white" mb={2}>Manage Featured Collections</Heading>
              <Text color="gray.400" fontSize="lg">
                Select which playlists are featured on the homepage. Drag and drop to reorder.
              </Text>
            </Box>
            
            <HStack w="full" justify="space-between">
              <Button leftIcon={<FaSearch />} colorScheme="purple" onClick={onOpen}>
                Search & Add Featured Playlists
              </Button>
            </HStack>

            {/* Featured playlists section */}
            <Box w="full" bg="gray.800" p={6} borderRadius="md" boxShadow="md">
              <Heading size="md" color="white" mb={4}>
                Featured Collections ({featuredPlaylists.length})
              </Heading>
              
              {featuredPlaylists.length === 0 ? (
                <Text color="gray.400" my={10} textAlign="center">
                  No featured playlists yet. Use the search button to find and feature playlists.
                </Text>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="featuredPlaylists">
                    {(provided) => (
                      <VStack
                        spacing={4}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        align="stretch"
                        w="full"
                      >
                        {featuredPlaylists.map((playlist, index) => (
                          <Draggable key={playlist.id} draggableId={playlist.id} index={index}>
                            {(provided) => (
                              <Box
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                {renderPlaylistCard(playlist, index, true)}
                              </Box>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </VStack>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </Box>
          </VStack>
        )}
        
        {/* Search Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg="gray.800">
            <ModalHeader color="white">Search Playlists</ModalHeader>
            <ModalCloseButton color="white" />
            <ModalBody>
              <VStack spacing={4}>
                <HStack w="full">
                  <Input 
                    placeholder="Search playlists..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    bg="gray.700"
                    color="white"
                    _placeholder={{ color: 'gray.400' }}
                  />
                  <Button colorScheme="purple" onClick={handleSearch}>
                    Search
                  </Button>
                </HStack>
                
                <Divider />
                
                <VStack spacing={3} w="full" align="stretch" maxH="400px" overflowY="auto">
                  {searchResults.length === 0 ? (
                    <Text color="gray.400" textAlign="center" py={4}>
                      {searchTerm ? "No playlists found. Try a different search term." : "Search for playlists above."}
                    </Text>
                  ) : (
                    searchResults.map((playlist) => renderPlaylistCard(playlist))
                  )}
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" color="white" onClick={onClose}>Close</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
      <Footer />
    </>
  );
};

export default ManageFeaturedCollections; 
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Alert,
  AlertIcon,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardHeader,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useToast,
  Flex,
  Badge,
  Input,
  Select,
  Spinner,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
  Progress,
  Icon,
} from '@chakra-ui/react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  auth, 
  firestore 
} from '../../firebase/firebase';
import NavBar from '../../components/Navbar/NavBar';
import Footer from '../../components/footer/Footer';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  deleteDoc, 
  orderBy, 
  limit,
  where,
  getCountFromServer,
  Timestamp
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { storage } from '../../firebase/firebase';
import { isAdmin } from '../../utils/adminUtils';
import { FaUser, FaMusic, FaList, FaChartLine, FaThumbsUp, FaDownload, FaEye, FaClock, FaCalendarAlt } from 'react-icons/fa';
// Import Recharts components
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

// Replace direct admin check constants with the utility function
// const ADMIN_USER_IDS = [
//   // Add your admin user IDs here
//   "ydweC38oMnXgd1BxKkj574Vrsnn2"
// ];

// // Email-based admin check (as a fallback)
// const ADMIN_EMAILS = [
//   'admin@example.com'
// ];

const StatCard = ({ title, value, helpText, isLoading, colorScheme = "blue" }) => (
  <Card 
    boxShadow="lg" 
    bg="gray.800" 
    borderColor={`${colorScheme}.500`} 
    borderWidth="1px" 
    borderLeftWidth="4px"
  >
    <CardBody>
      <Stat>
        <StatLabel fontSize="md" color="gray.300">{title}</StatLabel>
        {isLoading ? (
          <Box py={2}>
            <Spinner size="sm" color={`${colorScheme}.400`} />
          </Box>
        ) : (
          <>
            <StatNumber fontSize="3xl" color="white">{value}</StatNumber>
            {helpText && <StatHelpText color="gray.400">{helpText}</StatHelpText>}
          </>
        )}
      </Stat>
    </CardBody>
  </Card>
);

const AdminDashboard = () => {
  const [user] = useAuthState(auth);
  const toast = useToast();
  
  // Check if current user is an admin using the utility
  // const isAdmin = user && (ADMIN_USER_IDS.includes(user.uid) || ADMIN_EMAILS.includes(user.email));
  const isAdminUser = isAdmin(user);
  
  // State for statistics
  const [stats, setStats] = useState({
    totalSamples: 0,
    totalUsers: 0,
    totalPlaylists: 0,
    mostPopularSample: null,
  });
  
  // State for samples list with pagination
  const [samples, setSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Add these state variables in the AdminDashboard component
  const [interactionStats, setInteractionStats] = useState({
    likes: 0,
    views: 0,
    downloads: 0,
    dailyActivity: [],
    popularTags: [],
    newUsers: 0,
    newSamples: 0,
  });

  const [timeframe, setTimeframe] = useState('weekly');
  
  // Fetch statistics and initial sample data
  useEffect(() => {
    if (!isAdminUser) return;
    
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // Get counts using countFromServer for efficiency
        const usersSnapshot = await getCountFromServer(collection(firestore, 'users'));
        const samplesSnapshot = await getCountFromServer(collection(firestore, 'posts'));
        const playlistsSnapshot = await getCountFromServer(collection(firestore, 'playlists'));
        
        // Get most popular sample
        const popularSamplesQuery = query(
          collection(firestore, 'posts'),
          orderBy('likes', 'desc'),
          limit(1)
        );
        const popularSampleSnapshot = await getDocs(popularSamplesQuery);
        const mostPopular = popularSampleSnapshot.docs.length > 0 
          ? { id: popularSampleSnapshot.docs[0].id, ...popularSampleSnapshot.docs[0].data() }
          : null;
        
        setStats({
          totalUsers: usersSnapshot.data().count,
          totalSamples: samplesSnapshot.data().count,
          totalPlaylists: playlistsSnapshot.data().count,
          mostPopularSample: mostPopular,
        });
        
        // Also fetch interaction stats
        await fetchInteractionStats();
        
        // Load initial samples
        await fetchSamples();
        
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        toast({
          title: "Error loading statistics",
          description: error.message,
          status: "error",
          duration: 5000,
          isClosable: true
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [isAdminUser, toast, timeframe]);
  
  // Function to fetch samples with search and sort
  const fetchSamples = async () => {
    setIsLoading(true);
    try {
      let samplesQuery;
      
      // Base query
      if (searchQuery) {
        // Search by name if search query exists
        samplesQuery = query(
          collection(firestore, 'posts'),
          where('name', '>=', searchQuery),
          where('name', '<=', searchQuery + '\uf8ff'),
          orderBy('name'),
          limit(20)
        );
      } else {
        // Default sorting
        samplesQuery = query(
          collection(firestore, 'posts'),
          orderBy(sortField, sortOrder),
          limit(20)
        );
      }
      
      const samplesSnapshot = await getDocs(samplesQuery);
      const samplesData = samplesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setSamples(samplesData);
    } catch (error) {
      console.error("Error fetching samples:", error);
      toast({
        title: "Error loading samples",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to delete a sample
  const deleteSample = async (sampleId, audioUrl, imageUrl) => {
    if (!isAdminUser) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can delete samples",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      // 1. Delete the document from Firestore
      const sampleRef = doc(firestore, 'posts', sampleId);
      await deleteDoc(sampleRef);
      
      // 2. Delete audio file from Storage if URL exists
      if (audioUrl) {
        try {
          // Extract the file path from the URL
          const audioPath = audioUrl.split('?')[0].split('/').slice(7).join('/');
          if (audioPath) {
            const audioRef = ref(storage, audioPath);
            await deleteObject(audioRef);
          }
        } catch (audioError) {
          console.error("Error deleting audio file:", audioError);
          // Continue execution - we still want to delete the image if possible
        }
      }
      
      // 3. Delete image file from Storage if URL exists
      if (imageUrl) {
        try {
          // Extract the file path from the URL
          const imagePath = imageUrl.split('?')[0].split('/').slice(7).join('/');
          if (imagePath) {
            const imageRef = ref(storage, imagePath);
            await deleteObject(imageRef);
          }
        } catch (imageError) {
          console.error("Error deleting image file:", imageError);
          // Continue execution - we've already deleted the document
        }
      }
      
      toast({
        title: "Sample Deleted",
        description: "The sample has been permanently deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      
      // Refresh the samples list
      await fetchSamples();
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalSamples: prev.totalSamples - 1
      }));
      
    } catch (error) {
      console.error("Error deleting sample:", error);
      toast({
        title: "Error Deleting Sample",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    fetchSamples();
  };
  
  const handleSortChange = (e) => {
    setSortField(e.target.value);
    fetchSamples();
  };
  
  const handleOrderChange = (e) => {
    setSortOrder(e.target.value);
    fetchSamples();
  };
  
  // Fetch interaction statistics 
  const fetchInteractionStats = async () => {
    try {
      // Get total interactions
      const samplesRef = collection(firestore, 'posts');
      const samplesSnapshot = await getDocs(samplesRef);
      
      let totalLikes = 0;
      let totalViews = 0;
      let totalDownloads = 0;
      let tagCounts = {};
      
      samplesSnapshot.forEach(doc => {
        const data = doc.data();
        totalLikes += data.likes || 0;
        
        if (data.stats) {
          totalViews += data.stats.views || 0;
          totalDownloads += data.stats.downloads || 0;
        }
        
        // Count tag frequencies
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });
      
      // Format popular tags data
      const popularTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));
      
      // Get new users and samples in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysTimestamp = Timestamp.fromDate(thirtyDaysAgo);
      
      const newUsersQuery = query(
        collection(firestore, 'users'),
        where('createdAt', '>=', thirtyDaysTimestamp)
      );
      const newUsersSnapshot = await getDocs(newUsersQuery);
      
      const newSamplesQuery = query(
        collection(firestore, 'posts'),
        where('createdAt', '>=', thirtyDaysTimestamp)
      );
      const newSamplesSnapshot = await getDocs(newSamplesQuery);
      
      // Generate mock daily activity data (replace with real data if available)
      const dailyActivity = generateMockActivityData(timeframe);
      
      setInteractionStats({
        likes: totalLikes,
        views: totalViews,
        downloads: totalDownloads,
        popularTags,
        dailyActivity,
        newUsers: newUsersSnapshot.size,
        newSamples: newSamplesSnapshot.size,
      });
      
    } catch (error) {
      console.error("Error fetching interaction stats:", error);
      toast({
        title: "Error loading interaction statistics",
        description: error.message,
        status: "error",
        duration: 5000,
        isClosable: true
      });
    }
  };

  // Generate mock activity data (replace with real data when available)
  const generateMockActivityData = (timeframe) => {
    const data = [];
    const now = new Date();
    
    let days = 7;
    if (timeframe === 'monthly') days = 30;
    if (timeframe === 'yearly') days = 12; // Will use months instead of days
    
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      
      if (timeframe === 'yearly') {
        date.setMonth(now.getMonth() - i);
        data.unshift({
          date: date.toLocaleString('default', { month: 'short' }),
          samples: Math.floor(Math.random() * 50) + 10,
          likes: Math.floor(Math.random() * 300) + 50,
          views: Math.floor(Math.random() * 2000) + 500,
        });
      } else {
        date.setDate(now.getDate() - i);
        data.unshift({
          date: date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }),
          samples: Math.floor(Math.random() * 15) + 1,
          likes: Math.floor(Math.random() * 100) + 10,
          views: Math.floor(Math.random() * 600) + 100,
        });
      }
    }
    
    return data;
  };

  // Add the handleTimeframeChange function
  const handleTimeframeChange = (value) => {
    setTimeframe(value);
  };

  // Add ActivityLineChart component using Recharts
  const ActivityLineChart = ({ data, timeframe, onTimeframeChange }) => {
    return (
      <Card bg="gray.800" boxShadow="lg" borderColor="gray.700" borderWidth="1px">
        <CardHeader pb={0}>
          <Flex justify="space-between" align="center">
            <Heading size="md" color="white">Activity Over Time</Heading>
            <Select 
              value={timeframe}
              onChange={(e) => onTimeframeChange(e.target.value)}
              width="120px"
              size="sm"
              bg="gray.700"
              color="white"
              borderColor="gray.600"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
          </Flex>
        </CardHeader>
        <CardBody>
          <Box h="300px" w="100%">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 40,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#cbd5e0' }}
                  axisLine={{ stroke: '#666' }}
                  tickLine={{ stroke: '#666' }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  tick={{ fill: '#cbd5e0' }}
                  axisLine={{ stroke: '#666' }}
                  tickLine={{ stroke: '#666' }}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568', color: 'white' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend 
                  verticalAlign="top" 
                  wrapperStyle={{ paddingBottom: '10px' }} 
                  formatter={(value) => <span style={{ color: '#cbd5e0' }}>{value}</span>}
                />
                <Line 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#63B3ED" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                  dot={{ stroke: '#63B3ED', strokeWidth: 2, r: 4, fill: '#1A202C' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="likes" 
                  stroke="#F56565" 
                  activeDot={{ r: 6 }} 
                  strokeWidth={2}
                  dot={{ stroke: '#F56565', strokeWidth: 2, r: 4, fill: '#1A202C' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="samples" 
                  stroke="#48BB78" 
                  strokeWidth={2}
                  dot={{ stroke: '#48BB78', strokeWidth: 2, r: 4, fill: '#1A202C' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    );
  };

  // Add TagsBarChart component using Recharts
  const TagsBarChart = ({ tags }) => {
    const data = tags.map(tag => ({
      name: tag.tag,
      count: tag.count
    }));

    const COLORS = ['#805AD5', '#3182CE', '#38A169', '#ECC94B', '#E53E3E'];

    return (
      <Card bg="gray.800" boxShadow="lg" borderColor="gray.700" borderWidth="1px">
        <CardHeader pb={0}>
          <Heading size="md" color="white">Popular Tags</Heading>
        </CardHeader>
        <CardBody>
          <Box h="250px" w="100%">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 40,
                }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  tick={{ fill: '#cbd5e0' }}
                  axisLine={{ stroke: '#666' }}
                  tickLine={{ stroke: '#666' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: '#cbd5e0' }}
                  axisLine={{ stroke: '#666' }}
                  tickLine={{ stroke: '#666' }}
                  width={80}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568' }}
                  formatter={(value, name) => [value, 'Count']}
                  labelStyle={{ color: 'white' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    );
  };

  // Add InteractionsPieChart component using Recharts
  const InteractionsPieChart = ({ likes, views, downloads }) => {
    const data = [
      { name: 'Likes', value: likes, color: '#F56565' },
      { name: 'Views', value: views, color: '#63B3ED' },
      { name: 'Downloads', value: downloads, color: '#48BB78' },
    ];

    return (
      <Card bg="gray.800" boxShadow="lg" borderColor="gray.700" borderWidth="1px">
        <CardHeader pb={0}>
          <Heading size="md" color="white">Interaction Distribution</Heading>
        </CardHeader>
        <CardBody>
          <Box h="260px" w="100%">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568' }}
                  formatter={(value) => [value.toLocaleString(), 'Count']}
                  labelStyle={{ color: 'white' }}
                />
                <Legend 
                  formatter={(value) => <span style={{ color: '#cbd5e0' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    );
  };

  // Add GrowthAreaChart component using Recharts
  const GrowthAreaChart = ({ data }) => {
    // Create monthly growth data (for demonstration)
    const growthData = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(now.getMonth() - i);
      
      growthData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: 20 + Math.floor(Math.random() * 50) * (6-i+1),
        samples: 10 + Math.floor(Math.random() * 30) * (6-i+1),
      });
    }
    
    return (
      <Card bg="gray.800" boxShadow="lg" borderColor="gray.700" borderWidth="1px">
        <CardHeader pb={0}>
          <Heading size="md" color="white">Growth Trends</Heading>
        </CardHeader>
        <CardBody>
          <Box h="250px" w="100%">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={growthData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#cbd5e0' }}
                  axisLine={{ stroke: '#666' }}
                  tickLine={{ stroke: '#666' }}
                />
                <YAxis 
                  tick={{ fill: '#cbd5e0' }}
                  axisLine={{ stroke: '#666' }}
                  tickLine={{ stroke: '#666' }}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1A202C', borderColor: '#4A5568' }}
                  itemStyle={{ color: 'white' }}
                />
                <Legend 
                  formatter={(value) => <span style={{ color: '#cbd5e0' }}>{value}</span>}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stackId="1" 
                  stroke="#805AD5" 
                  fill="#805AD5" 
                  fillOpacity={0.6} 
                />
                <Area 
                  type="monotone" 
                  dataKey="samples" 
                  stackId="1" 
                  stroke="#3182CE" 
                  fill="#3182CE" 
                  fillOpacity={0.6} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardBody>
      </Card>
    );
  };

  // If user is not logged in
  if (!user) {
    return (
      <>
        <NavBar />
        <Container maxW="container.lg" py={10}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            Please login to access this page
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }
  
  // If user is not an admin
  if (!isAdminUser) {
    return (
      <>
        <NavBar />
        <Container maxW="container.lg" py={10}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            You don't have permission to access this page
          </Alert>
        </Container>
        <Footer />
      </>
    );
  }
  
  return (
    <>
      <NavBar />
      <Box bg="gray.900" minH="calc(100vh - 80px)">
        <Container maxW="container.xl" py={10}>
          <VStack spacing={8} align="stretch">
            <Box 
              bg="gray.800" 
              p={6} 
              borderRadius="md" 
              borderLeft="4px solid" 
              borderColor="red.500"
              boxShadow="lg"
            >
              <Heading size="xl" color="white" mb={2}>Admin Dashboard</Heading>
              <Text color="gray.400">Manage samples and monitor platform activity</Text>
            </Box>
            
            {/* Platform Statistics Section */}
            <Box>
              <Heading size="lg" mb={4} color="white">Platform Statistics</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
                <StatCard 
                  title="Total Samples" 
                  value={stats.totalSamples}
                  isLoading={isLoading}
                  colorScheme="blue"
                />
                <StatCard 
                  title="Total Users" 
                  value={stats.totalUsers} 
                  isLoading={isLoading}
                  colorScheme="green"
                />
                <StatCard 
                  title="Total Playlists" 
                  value={stats.totalPlaylists}
                  isLoading={isLoading}
                  colorScheme="purple"
                />
                <StatCard 
                  title="Most Popular Sample" 
                  value={stats.mostPopularSample?.name || "N/A"}
                  helpText={stats.mostPopularSample ? `${stats.mostPopularSample.likes || 0} likes` : null}
                  isLoading={isLoading}
                  colorScheme="red"
                />
              </SimpleGrid>
            </Box>
            
            {/* User Interactions & Analytics Section */}
            <Box mt={8}>
              <Heading size="lg" mb={4} color="white">User Interactions & Analytics</Heading>
              
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={5}>
                <InteractionsPieChart 
                  likes={interactionStats.likes} 
                  views={interactionStats.views} 
                  downloads={interactionStats.downloads} 
                />
                <TagsBarChart tags={interactionStats.popularTags} />
              </SimpleGrid>
              
              <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} mb={5}>
                <ActivityLineChart 
                  data={interactionStats.dailyActivity} 
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                />
                <GrowthAreaChart />
              </SimpleGrid>
              
              <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5}>
                <StatCard 
                  title="Total Likes" 
                  value={interactionStats.likes.toLocaleString()}
                  colorScheme="red"
                  helpText="All time"
                />
                <StatCard 
                  title="Total Views" 
                  value={interactionStats.views.toLocaleString()} 
                  colorScheme="blue"
                  helpText="All time"
                />
                <StatCard 
                  title="Total Downloads" 
                  value={interactionStats.downloads.toLocaleString()}
                  colorScheme="green"
                  helpText="All time"
                />
                <StatCard 
                  title="New Users (30 days)" 
                  value={interactionStats.newUsers}
                  colorScheme="teal"
                />
              </SimpleGrid>
            </Box>
            
            {/* Sample Management Section */}
            <Box 
              bg="gray.800" 
              p={6} 
              borderRadius="md" 
              borderLeft="4px solid" 
              borderColor="blue.500"
              boxShadow="lg"
            >
              <Heading size="lg" mb={4} color="white">Sample Management</Heading>
              
              {/* Search and Sort Controls */}
              <HStack 
                mb={4} 
                spacing={4} 
                flexWrap="wrap" 
                justifyContent="space-between"
                bg="gray.800"
                p={4}
                borderRadius="md"
                borderLeft="4px solid"
                borderColor="blue.500"
                boxShadow="md"
              >
                <Box minW="250px">
                  <form onSubmit={handleSearch}>
                    <Flex>
                      <Input
                        placeholder="Search by name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        borderRight="none"
                        borderRightRadius="0"
                        bg="gray.700"
                        color="white"
                        borderColor="gray.600"
                        _hover={{ borderColor: "blue.400" }}
                        _focus={{ borderColor: "blue.400", boxShadow: "none" }}
                      />
                      <Button 
                        type="submit" 
                        colorScheme="blue"
                        borderLeftRadius="0"
                        isLoading={isLoading}
                      >
                        Search
                      </Button>
                    </Flex>
                  </form>
                </Box>
                
                <HStack spacing={2}>
                  <Select 
                    value={sortField} 
                    onChange={handleSortChange} 
                    width="auto"
                    bg="gray.700"
                    color="white"
                    borderColor="gray.600"
                  >
                    <option value="createdAt">Created Date</option>
                    <option value="name">Name</option>
                    <option value="likes">Likes</option>
                  </Select>
                  
                  <Select 
                    value={sortOrder} 
                    onChange={handleOrderChange}
                    width="auto"
                    bg="gray.700"
                    color="white"
                    borderColor="gray.600"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </Select>
                </HStack>
              </HStack>
              
              {/* Samples Table */}
              <Box 
                overflowX="auto" 
                bg="gray.800" 
                borderRadius="md" 
                boxShadow="lg" 
                borderColor="gray.700" 
                borderWidth="1px"
              >
                <TableContainer>
                  <Table variant="simple" colorScheme="whiteAlpha">
                    <Thead bg="gray.900">
                      <Tr>
                        <Th color="gray.300">Name</Th>
                        <Th color="gray.300">Owner</Th>
                        <Th isNumeric color="gray.300">Likes</Th>
                        <Th color="gray.300">Created</Th>
                        <Th color="gray.300">Action</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {isLoading ? (
                        <Tr>
                          <Td colSpan={5} textAlign="center">
                            <Spinner />
                          </Td>
                        </Tr>
                      ) : samples.length === 0 ? (
                        <Tr>
                          <Td colSpan={5} textAlign="center">No samples found</Td>
                        </Tr>
                      ) : (
                        samples.map(sample => (
                          <Tr key={sample.id} _hover={{ bg: "gray.700" }}>
                            <Td>
                              <Text fontWeight="medium" color="white">{sample.name}</Text>
                              <HStack mt={1}>
                                {sample.tags && sample.tags.map((tag, index) => (
                                  <Badge key={index} colorScheme="blue" size="sm">{tag}</Badge>
                                ))}
                              </HStack>
                            </Td>
                            <Td color="gray.300">{sample.userEmail || sample.userId}</Td>
                            <Td isNumeric color="gray.300">{sample.likes || 0}</Td>
                            <Td color="gray.300">
                              {sample.createdAt && new Date(sample.createdAt.seconds * 1000).toLocaleDateString()}
                            </Td>
                            <Td>
                              <Button
                                colorScheme="red"
                                size="sm"
                                onClick={() => deleteSample(sample.id, sample.audioUrl, sample.coverImage)}
                                isLoading={isDeleting}
                              >
                                Delete
                              </Button>
                            </Td>
                          </Tr>
                        ))
                      )}
                    </Tbody>
                  </Table>
                </TableContainer>
              </Box>
            </Box>
          </VStack>
        </Container>
      </Box>
      <Footer />
    </>
  );
};

export default AdminDashboard; 
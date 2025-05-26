import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, where, doc, getDoc, writeBatch, runTransaction } from 'firebase/firestore';
import { firestore as db } from '../firebase/firebase';

// Pre-defined tags by category - Updated to match Upload.jsx
export const SAMPLE_TAGS = {
  genre: ['Hip Hop', 'EDM', 'Rock', 'Lo-Fi', 'Trap', 'House', 'Pop', 'RnB', 'Jazz', 'Classical'],
  mood: ['Energetic', 'Chill', 'Intense', 'Dark', 'Happy', 'Sad', 'Calm', 'Aggressive'],
  instrument: ['Piano', 'Guitar', 'Synth', 'Pad', 'Bass', 'Warm-Up', 'Drums', 'Strings', 'Brass'],
  tempo: ['Slow', 'Medium', 'Fast', 'Variable'],
  key: ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B', 'Am', 'A#m/Bbm', 'Bm', 'Cm', 'C#m/Dbm', 'Dm', 'D#m/Ebm', 'Em', 'Fm', 'F#m/Gbm', 'Gm', 'G#m/Abm']
};

// Helper function to get tag category
const getTagCategory = (tag) => {
  for (const [category, tags] of Object.entries(SAMPLE_TAGS)) {
    if (tags.includes(tag)) {
      return category;
    }
  }
  return null;
};

// Get all tags as a flat array
const getAllTags = () => {
  return Object.values(SAMPLE_TAGS).flat();
};

const useSamplesData = (pageSize = 10, initialSearchTerm = '', initialTags = [], initialSortBy = 'newest') => {
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedTags, setSelectedTags] = useState(initialTags);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [noResultsReason, setNoResultsReason] = useState('');
  const lastAppliedFilters = useRef({ searchTerm: '', selectedTags: [], sortBy: 'newest' });
  const isInitialLoad = useRef(true);

  // Memoize available tags to prevent unnecessary re-renders
  const availableTags = useMemo(() => getAllTags(), []);

  // Helper to get tags by category
  const getTagsByCategory = useCallback((category) => {
    return SAMPLE_TAGS[category] || [];
  }, []);

  // Helper function to normalize case for tag comparison
  const normalizeTag = (tag) => {
    return tag ? tag.toLowerCase().trim() : '';
  };

  // Helper to check if filters have changed
  const haveFiltersChanged = useCallback(() => {
    const current = {
      searchTerm: searchTerm.trim(),
      selectedTags: selectedTags.map(normalizeTag).sort(),
      sortBy
    };
    
    const last = {
      searchTerm: lastAppliedFilters.current.searchTerm.trim(),
      selectedTags: lastAppliedFilters.current.selectedTags.map(normalizeTag).sort(),
      sortBy: lastAppliedFilters.current.sortBy
    };
    
    return JSON.stringify(current) !== JSON.stringify(last);
  }, [searchTerm, selectedTags, sortBy]);

  // Fetch samples from Firestore
  const fetchSamples = useCallback(async (isInitial = false) => {
    // Don't fetch if we're already loading, unless it's the initial load
    if (loading && !isInitial) return;

    // Always reload when filters have changed or it's the initial load
    const shouldReload = isInitial || haveFiltersChanged();
    
    // Force a reload if we need one
    if (shouldReload) {
      try {
        setLoading(true);
        setError(null);
        setNoResultsReason('');
        
        // Clear samples and pagination state on filter change or initial load
        setSamples([]);
        setLastVisible(null);
        setHasMore(true);
        
        // Update last applied filters immediately to prevent double-loading
        lastAppliedFilters.current = {
          searchTerm,
          selectedTags: [...selectedTags],
          sortBy
        };

        // Determine sort field based on sortBy option
        let sortField = 'createdAt';
        let sortDirection = 'desc';
        
        if (sortBy === 'popular') {
          // Sort by all-time popularity score
          sortField = 'popularityScores.allTime';
        } else if (sortBy === 'trending') {
          // Sort by weekly popularity score
          sortField = 'popularityScores.weekly';
        }

        // Start building the query
        let samplesQuery;
        const samplesRef = collection(db, 'posts');
        
        // If we're using complex filtering (multiple tags), we need to 
        // fetch a large batch of samples without tag filtering and filter client-side
        const useClientSideFiltering = selectedTags.length > 0;

        // Set a large batch size for client-side filtering
        const batchSize = useClientSideFiltering ? pageSize * 30 : pageSize * 2;

        // Basic query without tag filtering
        if (lastVisible) {
          samplesQuery = query(
            samplesRef,
            orderBy(sortField, sortDirection),
            startAfter(lastVisible),
            limit(batchSize)
          );
        } else {
          samplesQuery = query(
            samplesRef,
            orderBy(sortField, sortDirection),
            limit(batchSize)
          );
        }

        // Execute the query
        let samplesSnapshot;
        try {
          samplesSnapshot = await getDocs(samplesQuery);
        } catch (error) {
          console.error('Error fetching samples with sortBy:', sortBy, 'Error:', error);
          
          // If the query fails (likely due to missing field), try again with createdAt as fallback
          if (sortField !== 'createdAt') {
            console.log('Falling back to createdAt sort');
            if (lastVisible) {
              samplesQuery = query(
                samplesRef,
                orderBy('createdAt', 'desc'),
                startAfter(lastVisible),
                limit(batchSize)
              );
            } else {
              samplesQuery = query(
                samplesRef,
                orderBy('createdAt', 'desc'),
                limit(batchSize)
              );
            }
            samplesSnapshot = await getDocs(samplesQuery);
          } else {
            throw error; // Re-throw if we're already using createdAt
          }
        }
        
        // Check if we have results
        if (samplesSnapshot.empty) {
          if (selectedTags.length > 0) {
            setNoResultsReason(`No samples found containing all selected tags: ${selectedTags.join(', ')}`);
          } else if (searchTerm) {
            setNoResultsReason(`No samples found matching search term: "${searchTerm}"`);
          } else {
            setNoResultsReason('No samples available');
          }
          
          setHasMore(false);
          setLoading(false);
          return;
        }

        // Process the results
        let fetchedSamples = samplesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure tags exist as an array
          tags: doc.data().tags || []
        }));

        console.log(`Fetched ${fetchedSamples.length} samples before filtering`);

        // If we're sorting by popularity and some samples don't have popularityScores, 
        // make sure we sort them correctly by adding fallback values
        if ((sortBy === 'popular' || sortBy === 'trending') && fetchedSamples.length > 0) {
          fetchedSamples = fetchedSamples.map(sample => {
            if (!sample.popularityScores) {
              // Calculate a basic score based on likes
              const likes = sample.likes || 0;
              const score = likes * 5; // Basic calculation
              
              return {
                ...sample,
                popularityScores: {
                  daily: 0,
                  weekly: 0,
                  monthly: 0,
                  allTime: score
                }
              };
            }
            return sample;
          });
          
          // Sort manually if we're using a fallback
          if (sortField === 'popularityScores.allTime') {
            fetchedSamples.sort((a, b) => {
              const scoreA = a.popularityScores?.allTime || 0;
              const scoreB = b.popularityScores?.allTime || 0;
              return scoreB - scoreA; // Descending order
            });
          } else if (sortField === 'popularityScores.weekly') {
            fetchedSamples.sort((a, b) => {
              const scoreA = a.popularityScores?.weekly || 0;
              const scoreB = b.popularityScores?.weekly || 0;
              return scoreB - scoreA; // Descending order
            });
          }
        }

        // For search term, filter in client
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const beforeCount = fetchedSamples.length;
          
          fetchedSamples = fetchedSamples.filter(sample => {
            return (
              (sample.name?.toLowerCase() || '').includes(searchLower) ||
              (sample.description?.toLowerCase() || '').includes(searchLower) ||
              (sample.tags && Array.isArray(sample.tags) && sample.tags.some(tag => 
                tag.toLowerCase().includes(searchLower)
              ))
            );
          });

          console.log(`Filtered by search term: ${beforeCount} → ${fetchedSamples.length}`);

          if (fetchedSamples.length === 0) {
            setNoResultsReason(`No samples found matching search term: "${searchTerm}"`);
          }
        }

        // For tags, filter to ensure ALL tags match
        if (selectedTags.length > 0) {
          const beforeCount = fetchedSamples.length;
          
          fetchedSamples = fetchedSamples.filter(sample => {
            // Make sure sample.tags exists and is an array
            if (!sample.tags || !Array.isArray(sample.tags)) {
              return false;
            }
            
            // Check if every selected tag is included in the sample's tags
            return selectedTags.every(selectedTag => 
              sample.tags.some(sampleTag => 
                sampleTag.toLowerCase() === selectedTag.toLowerCase()
              )
            );
          });

          console.log(`Filtered by ${selectedTags.length} tags: ${beforeCount} → ${fetchedSamples.length}`);
          
          // If no samples match all tags, set a specific reason
          if (fetchedSamples.length === 0 && beforeCount > 0) {
            setNoResultsReason(`No samples contain all selected tags: ${selectedTags.join(', ')}`);
          }
        }

        // Limit to pageSize results for the UI display
        const limitedResults = fetchedSamples.slice(0, pageSize);
        
        console.log(`Displaying ${limitedResults.length} samples (limited to page size)`);

        // Update state based on filtered results
        const hasMoreResults = fetchedSamples.length > pageSize;
        setHasMore(hasMoreResults);


        if (selectedTags.length === 0 || fetchedSamples.length >= pageSize) {
          setLastVisible(samplesSnapshot.docs[samplesSnapshot.docs.length - 1]);
        } else {
          setLastVisible(null);
        }
        
        // Update samples state
        setSamples(prevSamples => {
          // If we're loading a new search or filter, replace the previous results
          if (isInitial || haveFiltersChanged()) {
            return limitedResults;
          }
          // Otherwise append to existing results (pagination)
          const combinedResults = [...prevSamples, ...limitedResults];
          // Remove duplicates
          const uniqueResults = Array.from(
            new Map(combinedResults.map(item => [item.id, item])).values()
          );
          return uniqueResults;
        });
        
      } catch (err) {
        console.error('Error fetching samples:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        isInitialLoad.current = false;
      }
    }
  }, [loading, haveFiltersChanged, searchTerm, selectedTags, sortBy, samples.length, pageSize]);

  // Load initial data
  useEffect(() => {
    if (isInitialLoad.current) {
      fetchSamples(true);
    }
  }, [fetchSamples]);

  // When filters change, fetch new samples
  useEffect(() => {
    if (!isInitialLoad.current) {
      const filtersChanged = haveFiltersChanged();
      console.log("Filters changed:", filtersChanged);
      
      if (filtersChanged) {
        // Reset pagination when filters change
        setLastVisible(null);
        setHasMore(true);
        fetchSamples(true);
      }
    }
  }, [fetchSamples, haveFiltersChanged]);

  // Load more samples for pagination
  const loadMoreSamples = () => {
    if (!loading && hasMore) {
      // For heavily filtered results that might have limited matches
      if (selectedTags.length > 1 && samples.length < 30) {
        console.log("Using aggressive loading strategy for filtered results");
        // Start with a fresh query instead of pagination to ensure we get all possible matches
        setLastVisible(null);
        fetchSamples(true);
      } else {
        // Normal pagination
        fetchSamples();
      }
    }
  };

  // Initialise popularity scores for samples that don't have them
  const initializePopularityScores = async () => {
    console.log("Initializing popularity scores for samples");
    try {
      const samplesRef = collection(db, 'posts');
      const snapshot = await getDocs(samplesRef);
      
      // Use batched writes for better performance
      const batchSize = 500; // Firestore batch limit is 500
      let batch = writeBatch(db);
      let operationCount = 0;
      let updatedCount = 0;
      
      for (const sampleDoc of snapshot.docs) {
        const data = sampleDoc.data();
        
        // Check if popularityScores exists
        if (!data.popularityScores) {
          // Calculate score based on existing data
          const likes = data.likes || 0;
          const stats = data.stats || { views: 0, downloads: 0 };
          
          // Basic popularity score calculation
          const score = (likes * 5) + ((stats.downloads || 0) * 3) + (stats.views || 0);
          
          batch.update(doc(db, 'posts', sampleDoc.id), {
            popularityScores: {
              daily: 0,
              weekly: 0,
              monthly: 0,
              allTime: score
            }
          });
          
          operationCount++;
          updatedCount++;
        }
        
        // Commit batch if we're at the limit
        if (operationCount >= batchSize) {
          await batch.commit();
          console.log(`Processed ${operationCount} samples`);
          batch = writeBatch(db);
          operationCount = 0;
        }
      }
      
      // Commit any remaining operations
      if (operationCount > 0) {
        await batch.commit();
      }
      
      console.log(`Updated ${updatedCount} samples with popularity scores`);
      return updatedCount;
    } catch (error) {
      console.error("Error initializing popularity scores:", error);
      return 0;
    }
  };

  // Add initialization to refreshSamples
  const refreshSamples = () => {
    // Using a callback to ensure we have the latest state
    setLastVisible(null);
    setHasMore(true);
    
    // Initialize popularity scores if sorting by popularity metrics
    if (sortBy === 'popular' || sortBy === 'trending') {
      initializePopularityScores().then(count => {
        console.log(`Initialized ${count} samples with popularity scores`);
        // Mark as initial fetch to force refresh
        fetchSamples(true);
      });
    } else {
      // Mark as initial fetch to force refresh
      fetchSamples(true);
    }
  };

  return {
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
    refreshSamples,
    SAMPLE_TAGS,
    noResultsReason
  };
};

export default useSamplesData; 
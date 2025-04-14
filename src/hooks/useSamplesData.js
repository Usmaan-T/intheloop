import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { collection, query, orderBy, limit, startAfter, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { firestore as db } from '../firebase/firebase';

// Pre-defined tags by category
export const SAMPLE_TAGS = {
  genre: ['Hip Hop', 'R&B', 'Pop', 'EDM', 'Rock', 'Jazz', 'Lo-Fi', 'Trap', 'Drill', 'Ambient'],
  mood: ['Chill', 'Dark', 'Happy', 'Sad', 'Energetic', 'Relaxed', 'Aggressive', 'Melancholic'],
  instrument: ['Guitar', 'Piano', 'Strings', 'Drums', 'Bass', 'Synth', 'Vocal', 'Brass', 'Percussion'],
  tempo: ['Slow', 'Medium', 'Fast', 'Very Fast']
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

  // Helper to check if filters have changed
  const haveFiltersChanged = useCallback(() => {
    const current = JSON.stringify({ searchTerm, selectedTags, sortBy });
    const last = JSON.stringify(lastAppliedFilters.current);
    return current !== last;
  }, [searchTerm, selectedTags, sortBy]);

  // Fetch samples from Firestore
  const fetchSamples = useCallback(async (isInitial = false) => {
    // Don't fetch if we're already loading, unless it's the initial load
    if (loading && !isInitial) return;

    // Check if filters have changed - if not and it's not initial, don't reload
    if (!isInitial && !haveFiltersChanged() && samples.length > 0) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNoResultsReason('');
      
      // If this is not for pagination (either initial load or filter change),
      // clear samples and lastVisible
      if (isInitial || haveFiltersChanged()) {
        setSamples([]);
        setLastVisible(null);
        setHasMore(true);
      }

      // Update last applied filters
      lastAppliedFilters.current = {
        searchTerm,
        selectedTags: [...selectedTags],
        sortBy
      };

      // Determine sort field based on sortBy option
      let sortField = 'createdAt';
      if (sortBy === 'popular') sortField = 'plays';
      if (sortBy === 'trending') sortField = 'recentPlays';

      // Start building the query
      let samplesQuery;
      const samplesRef = collection(db, 'posts');

      // When multiple tags selected, we need to handle filtering differently
      if (selectedTags.length > 1) {
        // For multiple tags, we need to do client-side filtering after fetching
        // Get a larger batch to ensure we have enough after filtering
        const batchSize = pageSize * 5;
        
        // Apply other filters but not tag filters yet
        if (lastVisible) {
          samplesQuery = query(
            samplesRef,
            orderBy(sortField, 'desc'),
            startAfter(lastVisible),
            limit(batchSize)
          );
        } else {
          samplesQuery = query(
            samplesRef,
            orderBy(sortField, 'desc'),
            limit(batchSize)
          );
        }

      } else if (selectedTags.length === 1) {
        // For a single tag, we can use Firestore's array-contains
        if (lastVisible) {
          samplesQuery = query(
            samplesRef,
            where('tags', 'array-contains', selectedTags[0]),
            orderBy(sortField, 'desc'),
            startAfter(lastVisible),
            limit(pageSize)
          );
        } else {
          samplesQuery = query(
            samplesRef,
            where('tags', 'array-contains', selectedTags[0]),
            orderBy(sortField, 'desc'),
            limit(pageSize)
          );
        }
      } else {
        // No tags selected, use basic query
        if (lastVisible) {
          samplesQuery = query(
            samplesRef,
            orderBy(sortField, 'desc'),
            startAfter(lastVisible),
            limit(pageSize)
          );
        } else {
          samplesQuery = query(
            samplesRef,
            orderBy(sortField, 'desc'),
            limit(pageSize)
          );
        }
      }

      // Execute the query
      const samplesSnapshot = await getDocs(samplesQuery);
      
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
        ...doc.data()
      }));

      // For search term, filter in client
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        fetchedSamples = fetchedSamples.filter(sample => {
          return (
            sample.name?.toLowerCase().includes(searchLower) ||
            sample.description?.toLowerCase().includes(searchLower) ||
            sample.tags?.some(tag => tag.toLowerCase().includes(searchLower))
          );
        });

        if (fetchedSamples.length === 0) {
          setNoResultsReason(`No samples found matching search term: "${searchTerm}"`);
        }
      }

      // For multiple tags, filter in client to ensure ALL tags match
      if (selectedTags.length > 1) {
        const previousLength = fetchedSamples.length;
        fetchedSamples = fetchedSamples.filter(sample => {
          // Make sure sample.tags exists and is an array before checking
          if (!sample.tags || !Array.isArray(sample.tags)) {
            return false;
          }
          // Check if every selected tag is included in the sample's tags
          return selectedTags.every(tag => sample.tags.includes(tag));
        });
        
        // If no samples match all tags, set a specific reason
        if (fetchedSamples.length === 0 && previousLength > 0) {
          setNoResultsReason(`No samples contain all selected tags: ${selectedTags.join(', ')}`);
        }
      }

      // Limit to pageSize results
      const limitedResults = fetchedSamples.slice(0, pageSize);

      // Update state
      setHasMore(fetchedSamples.length >= pageSize);
      setLastVisible(samplesSnapshot.docs[samplesSnapshot.docs.length - 1]);
      
      // Update samples state
      setSamples(prevSamples => {
        // If we're loading a new search or filter, replace the previous results
        if (isInitial || haveFiltersChanged()) {
          return limitedResults;
        }
        // Otherwise append to existing results (pagination)
        return [...prevSamples, ...limitedResults];
      });
      
    } catch (err) {
      console.error('Error fetching samples:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      isInitialLoad.current = false;
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
    if (!isInitialLoad.current && haveFiltersChanged()) {
      fetchSamples(true);
    }
  }, [fetchSamples, haveFiltersChanged]);

  // Load more samples for pagination
  const loadMoreSamples = () => {
    if (!loading && hasMore) {
      fetchSamples();
    }
  };

  // Refresh samples (e.g. after a delete)
  const refreshSamples = () => {
    setLastVisible(null);
    setHasMore(true);
    setError(null);
    fetchSamples(true);
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
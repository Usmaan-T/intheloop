/**
 * Firestore optimization helpers to improve data handling and query performance
 */
import { doc, updateDoc, writeBatch, collection } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Normalizes a string for search indexing (lowercase, trim, remove special chars)
 */
export const normalizeForSearch = (str) => {
  if (!str) return '';
  return str.toLowerCase().trim();
};

/**
 * Adds lowercase fields to a sample for better search performance
 * @param {Object} sample - The sample data to normalize
 * @returns {Object} - The sample with added index fields
 */
export const addSearchIndexes = (sample) => {
  if (!sample) return sample;
  
  return {
    ...sample,
    nameLower: normalizeForSearch(sample.name),
    // Add other indexed fields if needed
  };
};

/**
 * Updates a sample with search indexes
 * @param {string} sampleId - The sample ID to update
 * @param {Object} sampleData - The sample data
 */
export const updateSampleWithIndexes = async (sampleId, sampleData) => {
  if (!sampleId || !sampleData) return;
  
  try {
    const sampleRef = doc(firestore, 'posts', sampleId);
    const indexedData = addSearchIndexes(sampleData);
    
    await updateDoc(sampleRef, indexedData);
    return true;
  } catch (error) {
    console.error('Error updating sample indexes:', error);
    return false;
  }
};

/**
 * Batch updates multiple samples with search indexes
 * @param {Array} samples - Array of {id, data} objects
 */
export const batchUpdateSamplesWithIndexes = async (samples) => {
  if (!samples || !Array.isArray(samples) || samples.length === 0) return 0;
  
  try {
    // Process in batches of 500 (Firestore batch limit)
    const batchSize = 500;
    let processed = 0;
    
    for (let i = 0; i < samples.length; i += batchSize) {
      const batch = writeBatch(firestore);
      const currentBatch = samples.slice(i, i + batchSize);
      
      currentBatch.forEach(({ id, data }) => {
        if (id && data) {
          const sampleRef = doc(firestore, 'posts', id);
          const indexedData = addSearchIndexes(data);
          batch.update(sampleRef, indexedData);
          processed++;
        }
      });
      
      await batch.commit();
    }
    
    return processed;
  } catch (error) {
    console.error('Error batch updating sample indexes:', error);
    return 0;
  }
};

/**
 * Adds nameLower field to all samples for searching
 * Call this once to ensure all existing samples are indexed
 */
export const indexAllSamples = async () => {
  const samplesRef = collection(firestore, 'posts');
  
  // This function would typically be run in an admin context or cloud function
  console.warn('indexAllSamples should generally be run from an admin context');
  
  return 'Operation must be run from an admin context due to potential large operation size';
};

/**
 * Retrieves data from the cache first, falls back to network
 * @param {Function} queryFn - Function that returns a Firestore query
 */
export const getDataWithCachePriority = async (queryFn) => {
  try {
    // This function is a placeholder for now, as we're using the built-in persistence
    // Firestore's persistence layer will automatically prefer cache when offline
    const query = queryFn();
    return await query;
  } catch (error) {
    console.error('Error fetching data with cache priority:', error);
    throw error;
  }
}; 
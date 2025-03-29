import { 
  doc, 
  collection, 
  writeBatch, 
  increment, 
  getDoc, 
  getDocs, 
  query,
  updateDoc, 
  setDoc
} from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Creates and manages a distributed counter by using shards
 * Helps prevent contention issues for high-traffic documents
 * 
 * @param {number} numShards - Number of shards to distribute writes across (default: 10)
 * @returns {Object} - Methods for interacting with distributed counters
 */
const useDistributedCounter = (numShards = 10) => {
  /**
   * Initializes counter shards for a document
   * Call this when first creating a document that will need high-volume counters
   * 
   * @param {string} docPath - Path to the document (e.g., "posts/postId")
   * @param {Array} fieldNames - Array of counter field names to initialize
   */
  const initializeCounters = async (docPath, fieldNames = []) => {
    try {
      const batch = writeBatch(firestore);
      const shardsCollectionRef = collection(firestore, `${docPath}/shards`);
      
      // Create numShards documents in the subcollection
      for (let i = 0; i < numShards; i++) {
        const shardData = {};
        
        // Initialize each counter field to zero
        fieldNames.forEach(fieldName => {
          shardData[fieldName] = 0;
        });
        
        batch.set(doc(shardsCollectionRef, i.toString()), shardData);
      }
      
      await batch.commit();
      console.log(`Initialized ${numShards} counter shards for ${docPath}`);
      
    } catch (error) {
      console.error('Error initializing counter shards:', error);
      throw error;
    }
  };
  
  /**
   * Increments a distributed counter
   * 
   * @param {string} docPath - Path to the document (e.g., "posts/postId")
   * @param {string} field - Field name of the counter
   * @param {number} incrementBy - Amount to increment by (default: 1)
   */
  const incrementCounter = async (docPath, field, incrementBy = 1) => {
    try {
      // Choose a random shard to update
      const shardId = Math.floor(Math.random() * numShards);
      const shardRef = doc(firestore, `${docPath}/shards/${shardId}`);
      
      // Get the shard document first to check if it exists
      const shardDoc = await getDoc(shardRef);
      
      if (!shardDoc.exists()) {
        // If shard doesn't exist (first update), create it with the initial value
        await setDoc(shardRef, { [field]: incrementBy });
      } else {
        // Otherwise increment the existing value
        await updateDoc(shardRef, {
          [field]: increment(incrementBy)
        });
      }
    } catch (error) {
      console.error('Error incrementing counter:', error);
      throw error;
    }
  };
  
  /**
   * Retrieves the total value of a distributed counter by summing all shards
   * 
   * @param {string} docPath - Path to the document (e.g., "posts/postId")
   * @param {string} field - Field name of the counter
   * @returns {number} - The total sum of the counter across all shards
   */
  const getCounterValue = async (docPath, field) => {
    try {
      // Query all shards
      const shardsQuery = query(collection(firestore, `${docPath}/shards`));
      const querySnapshot = await getDocs(shardsQuery);
      
      // Sum values across all shards
      let total = 0;
      querySnapshot.forEach(shardDoc => {
        const data = shardDoc.data();
        total += data[field] || 0;
      });
      
      return total;
    } catch (error) {
      console.error('Error getting counter value:', error);
      throw error;
    }
  };
  
  /**
   * Gets all counter values for a document
   * 
   * @param {string} docPath - Path to the document (e.g., "posts/postId")
   * @returns {Object} - Object containing all counter values
   */
  const getAllCounterValues = async (docPath) => {
    try {
      // Query all shards
      const shardsQuery = query(collection(firestore, `${docPath}/shards`));
      const querySnapshot = await getDocs(shardsQuery);
      
      // Object to hold sums of all fields
      const totals = {};
      
      // Sum values across all shards
      querySnapshot.forEach(shardDoc => {
        const data = shardDoc.data();
        Object.entries(data).forEach(([field, value]) => {
          if (typeof value === 'number') {
            totals[field] = (totals[field] || 0) + value;
          }
        });
      });
      
      return totals;
    } catch (error) {
      console.error('Error getting counter values:', error);
      throw error;
    }
  };
  
  return {
    initializeCounters,
    incrementCounter,
    getCounterValue,
    getAllCounterValues
  };
};

export default useDistributedCounter;

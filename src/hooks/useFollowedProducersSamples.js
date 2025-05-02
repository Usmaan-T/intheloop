import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '../firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  doc, 
  getDoc,
  documentId
} from 'firebase/firestore';

const useFollowedProducersSamples = (sampleLimit = 5) => {
  const [user] = useAuthState(auth);
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSamples = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get current user's data to find who they're following
        const userRef = doc(firestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          console.log('User document not found:', user.uid);
          setLoading(false);
          return;
        }
        
        const userData = userSnap.data();
        const following = userData.following || [];
        
        console.log('User is following:', following);
        
        if (following.length === 0) {
          console.log('User is not following anyone');
          setSamples([]);
          setLoading(false);
          return;
        }

        // Step 1: Get user documents for everyone the user is following
        // This will let us map between uid in following array and userId in samples
        const userDocs = [];
        // Process in batches of 10 due to Firestore limitations
        for (let i = 0; i < following.length; i += 10) {
          const batch = following.slice(i, i + 10);
          const usersQuery = query(
            collection(firestore, 'users'),
            where(documentId(), 'in', batch)
          );
          
          const usersSnap = await getDocs(usersQuery);
          usersSnap.forEach(doc => {
            userDocs.push({
              id: doc.id,
              ...doc.data()
            });
          });
        }
        
        console.log('Found user documents:', userDocs.length);
        
        // If we couldn't find any user documents, return early
        if (userDocs.length === 0) {
          setSamples([]);
          setLoading(false);
          return;
        }
        
        // Create a list of user IDs to query with
        const userIds = userDocs.map(doc => doc.id);
        console.log('User IDs to query samples with:', userIds);
        
        // Fetch samples from these users
        const allSamples = [];
        
        // Process in batches of 10
        for (let i = 0; i < userIds.length; i += 10) {
          const batch = userIds.slice(i, i + 10);
          
          // Query posts collection instead of samples
          const samplesQuery = query(
            collection(firestore, 'posts'),
            where('userId', 'in', batch),
            orderBy('createdAt', 'desc'),
            limit(sampleLimit)
          );
          
          const samplesSnap = await getDocs(samplesQuery);
          
          samplesSnap.forEach(doc => {
            allSamples.push({
              id: doc.id,
              ...doc.data()
            });
          });
        }
        
        console.log('Total samples found:', allSamples.length);
        
        // Sort all samples by createdAt and take the top 'sampleLimit'
        const sortedSamples = allSamples
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
          .slice(0, sampleLimit);
        
        setSamples(sortedSamples);
      } catch (err) {
        console.error('Error fetching followed producers samples:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSamples();
  }, [user, sampleLimit]);

  return { samples, loading, error };
};

export default useFollowedProducersSamples; 
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

/**
 * Normalizes a sample document to ensure it has all required fields
 * @param {Object} sample - The sample object to normalize
 * @returns {Object} - The normalized sample object
 */
export const normalizeSample = (sample) => {
  if (!sample) return null;

  // Create the normalized schema with default values
  return {
    // Required fields with fallbacks
    id: sample.id || `track-${Date.now()}`,
    name: sample.name || 'Untitled Track',
    audioUrl: sample.audioUrl || '',
    userId: sample.userId || 'unknown',
    
    // Add these fields with defaults if they don't exist
    bpm: sample.bpm || 0,
    key: sample.key || 'Unknown',
    createdAt: sample.createdAt || new Date(),
    likes: typeof sample.likes === 'number' ? sample.likes : 0,
    
    // Maintain existing or add empty array for comments
    comments: Array.isArray(sample.comments) ? sample.comments : [],
    
    // Only include these fields if they exist in the original
    ...(sample.coverImage ? { coverImage: sample.coverImage } : {}),
    ...(sample.tags ? { tags: sample.tags } : { tags: [] }),
    
    // Add any other fields that should be part of the standard schema
    lastUpdated: new Date()
  };
};

/**
 * Normalizes a user document to ensure it has all required fields
 * @param {Object} user - The user object to normalize
 * @returns {Object} - The normalized user object
 */
export const normalizeUser = (user) => {
  if (!user) return null;

  return {
    // Preserve existing ID and essential fields
    id: user.id || `user-${Date.now()}`,
    email: user.email || '',
    displayName: user.displayName || '',
    
    // Add username if not exists (for backward compatibility)
    username: user.username || user.displayName || '',
    
    // Ensure these arrays exist
    likes: Array.isArray(user.likes) ? user.likes : [], // Add likes array if it doesn't exist
    following: Array.isArray(user.following) ? user.following : [],
    followers: Array.isArray(user.followers) ? user.followers : [],
    
    // Only include these fields if they exist in the original
    ...(user.photoURL ? { photoURL: user.photoURL } : {}),
    ...(user.bio ? { bio: user.bio } : { bio: '' }),
    
    // Add timestamps if they don't exist
    createdAt: user.createdAt || new Date(),
    lastLogin: user.lastLogin || new Date(),
    updatedAt: new Date()
  };
};

/**
 * Updates all samples in the database to have a consistent schema
 * @returns {Promise<{success: boolean, updated: number, errors: number}>}
 */
export const migrateAllSamples = async () => {
  try {
    console.log('Starting sample migration...');
    const samplesRef = collection(firestore, 'posts');
    const querySnapshot = await getDocs(samplesRef);
    
    // Use batch writes for better performance and atomicity
    const batch = writeBatch(firestore);
    let updated = 0;
    let errors = 0;
    
    // Process each document
    querySnapshot.forEach((docSnapshot) => {
      try {
        const sampleId = docSnapshot.id;
        const originalData = docSnapshot.data();
        
        // Create normalized version of the document
        const normalizedData = normalizeSample({
          id: sampleId,
          ...originalData
        });
        
        // Add to batch
        const sampleRef = doc(firestore, 'posts', sampleId);
        batch.update(sampleRef, normalizedData);
        updated++;
      } catch (err) {
        console.error(`Error processing document: ${docSnapshot.id}`, err);
        errors++;
      }
    });
    
    // Commit the batch
    await batch.commit();
    console.log(`Migration completed: ${updated} documents updated, ${errors} errors`);
    
    return { success: true, updated, errors };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, updated: 0, errors: 1, error };
  }
};

/**
 * Updates all playlists in the database to ensure consistent schema for tracks
 * @returns {Promise<{success: boolean, updated: number, errors: number}>}
 */
export const migrateAllPlaylists = async () => {
  try {
    console.log('Starting playlist migration...');
    const playlistsRef = collection(firestore, 'playlists');
    const querySnapshot = await getDocs(playlistsRef);
    
    let updated = 0;
    let errors = 0;
    
    // Process each playlist document
    for (const docSnapshot of querySnapshot.docs) {
      try {
        const playlistId = docSnapshot.id;
        const playlistData = docSnapshot.data();
        
        // Check if the playlist has tracks
        if (playlistData.tracks && Array.isArray(playlistData.tracks)) {
          // Normalize each track in the playlist
          const normalizedTracks = playlistData.tracks.map(track => 
            normalizeSample(track)
          ).filter(Boolean); // Remove any null results
          
          // Update the playlist
          const playlistRef = doc(firestore, 'playlists', playlistId);
          await updateDoc(playlistRef, { tracks: normalizedTracks });
          updated++;
        }
      } catch (err) {
        console.error(`Error processing playlist: ${docSnapshot.id}`, err);
        errors++;
      }
    }
    
    console.log(`Playlist migration completed: ${updated} playlists updated, ${errors} errors`);
    return { success: true, updated, errors };
  } catch (error) {
    console.error('Playlist migration failed:', error);
    return { success: false, updated: 0, errors: 1, error };
  }
};

/**
 * Updates all users in the database to have a consistent schema
 * @returns {Promise<{success: boolean, updated: number, errors: number}>}
 */
export const migrateAllUsers = async () => {
  try {
    console.log('Starting user migration...');
    const usersRef = collection(firestore, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    // Use batch writes for better performance and atomicity
    const batch = writeBatch(firestore);
    let updated = 0;
    let errors = 0;
    
    // Process each document
    querySnapshot.forEach((docSnapshot) => {
      try {
        const userId = docSnapshot.id;
        const originalData = docSnapshot.data();
        
        // Create normalized version of the user
        const normalizedData = normalizeUser({
          id: userId,
          ...originalData
        });
        
        // Add to batch
        const userRef = doc(firestore, 'users', userId);
        batch.update(userRef, normalizedData);
        updated++;
      } catch (err) {
        console.error(`Error processing user document: ${docSnapshot.id}`, err);
        errors++;
      }
    });
    
    // Commit the batch
    await batch.commit();
    console.log(`User migration completed: ${updated} documents updated, ${errors} errors`);
    
    return { success: true, updated, errors };
  } catch (error) {
    console.error('User migration failed:', error);
    return { success: false, updated: 0, errors: 1, error };
  }
};

/**
 * Run a complete migration of all relevant collections
 */
export const runFullMigration = async () => {
  const samplesResult = await migrateAllSamples();
  const playlistsResult = await migrateAllPlaylists();
  const usersResult = await migrateAllUsers(); // Add users migration
  
  return {
    samples: samplesResult,
    playlists: playlistsResult,
    users: usersResult, // Include users results
    success: samplesResult.success && 
             playlistsResult.success && 
             usersResult.success
  };
};

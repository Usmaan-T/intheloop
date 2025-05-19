export const ADMIN_USER_IDS = [
  "ydweC38oMnXgd1BxKkj574Vrsnn2"
];

/**
 * Admin email addresses for fallback check
 */
export const ADMIN_EMAILS = [
  'admin@example.com',
  'utariq2004@gmail.com'
];

/**
 * Check if a user is an admin
 * @param {Object} user - Firebase user object
 * @returns {boolean} - Whether the user is an admin
 */
export const isAdmin = (user) => {
  if (!user) {
    console.log("Admin check failed: No user object provided");
    return false;
  }
  
  console.log("Checking admin status for:", {
    uid: user.uid,
    email: user.email,
    allowedIds: ADMIN_USER_IDS,
    allowedEmails: ADMIN_EMAILS
  });
  
  // Check by user ID
  if (ADMIN_USER_IDS.includes(user.uid)) {
    console.log("Admin check passed: User ID found in allowed list");
    return true;
  }
  
  // Fallback check by email - case insensitive comparison
  if (user.email && ADMIN_EMAILS.some(email => 
    email.trim().toLowerCase() === user.email.trim().toLowerCase())) {
    console.log("Admin check passed: Email found in allowed list");
    return true;
  }
  
  console.log("Admin check failed: Neither user ID nor email matched allowed lists");
  return false;
};

/**
 * Check if a user has access to admin features
 * Returns a component to display if the user doesn't have access
 * @param {Object} user - Firebase user object
 * @param {JSX.Element} component - Component to render if user is admin
 * @param {JSX.Element} accessDeniedComponent - Component to render if user is not admin
 * @returns {JSX.Element} - The appropriate component
 */
export const withAdminAccess = (user, component, accessDeniedComponent) => {
  return isAdmin(user) ? component : accessDeniedComponent;
};

// Function to update playlists with featured fields
export const updatePlaylistsWithFeaturedFields = async (firestore) => {
  try {
    const { collection, query, getDocs, updateDoc, doc, where } = await import('firebase/firestore');
    
    // Query for playlists that don't have isFeatured field
    const playlistsRef = collection(firestore, 'playlists');
    const playlistsSnap = await getDocs(playlistsRef);
    
    let updatedCount = 0;
    const batch = [];
    
    // Process each playlist
    playlistsSnap.forEach((doc) => {
      const playlist = doc.data();
      
      // Only update if isFeatured is undefined
      if (playlist.isFeatured === undefined) {
        batch.push(
          updateDoc(doc.ref, {
            isFeatured: false,
            featuredOrder: 9999 // Default high number so newly featured playlists appear at the end
          })
        );
        updatedCount++;
      }
    });
    
    // Execute all updates
    if (batch.length > 0) {
      await Promise.all(batch);
    }
    
    return {
      success: true,
      updatedCount
    };
  } catch (error) {
    console.error('Error updating playlists with featured fields:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 
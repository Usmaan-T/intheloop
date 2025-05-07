export const ADMIN_USER_IDS = [
  // Add your admin user IDs here
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
  if (!user) return false;
  
  // Check by user ID
  if (ADMIN_USER_IDS.includes(user.uid)) return true;
  
  // Fallback check by email - case insensitive comparison
  if (user.email && ADMIN_EMAILS.some(email => 
    email.trim().toLowerCase() === user.email.trim().toLowerCase())) {
    return true;
  }
  
  console.log("Admin check for:", user.email);
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
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialize Firebase
admin.initializeApp();

// Import function modules
const { updateDailySample } = require('./dailySample');

// Schedule function to update user heat scores
exports.updateUserHeatScores = functions.pubsub.schedule('0 0 * * *') // Run at midnight every day
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const usersRef = db.collection('users');
      const postsRef = db.collection('posts');
      
      // Get all users
      const usersSnapshot = await usersRef.get();
      
      // Get current date info
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentWeek = getWeekNumber(now);
      const weekString = `${now.getFullYear()}-W${currentWeek}`;
      const monthString = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Track processed users
      let userCount = 0;
      
      // Process each user
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;
        
        // Get all posts by this user
        const postsQuery = await postsRef.where('userId', '==', userId).get();
        
        // Calculate total popularity across time periods
        let totalPopularity = {
          daily: 0,
          weekly: 0,
          monthly: 0,
          allTime: 0
        };
        
        // Sum scores from tracks with time-appropriate filtering
        postsQuery.forEach(doc => {
          const data = doc.data();
          const stats = data.stats || { 
            views: 0, 
            likes: 0, 
            downloads: 0, 
            dailyStats: {}, 
            weeklyStats: {}, 
            monthlyStats: {} 
          };
          const scores = data.popularityScores || {};
          
          // Sum time-specific scores
          totalPopularity.allTime += scores.allTime || 0;
          
          // Only count recent interactions for decay
          const dailyStats = stats.dailyStats?.[today] || { views: 0, likes: 0, downloads: 0 };
          const weeklyStats = {};
          const monthlyStats = {};
          
          // Get only this week's stats
          Object.keys(stats.weeklyStats || {}).forEach(key => {
            if (key === weekString) {
              weeklyStats[key] = stats.weeklyStats[key];
            }
          });
          
          // Get only this month's stats
          Object.keys(stats.monthlyStats || {}).forEach(key => {
            if (key === monthString) {
              monthlyStats[key] = stats.monthlyStats[key];
            }
          });
          
          // Calculate period scores using the same formula as in the app
          totalPopularity.daily += calculateScore(dailyStats);
          totalPopularity.weekly += calculateWeeklyScore(weeklyStats);
          totalPopularity.monthly += calculateMonthlyScore(monthlyStats);
        });
        
        // Update user document with new popularity scores
        await usersRef.doc(userId).update({
          popularityScores: totalPopularity,
          lastPopularityUpdate: admin.firestore.FieldValue.serverTimestamp()
        });
        
        userCount++;
      }
      
      console.log(`Updated heat scores for ${userCount} users`);
      return null;
    } catch (error) {
      console.error('Error updating user heat scores:', error);
      return null;
    }
  });

// Helper function for score calculation
function calculateScore(stats) {
  const likes = stats.likes || 0;
  const downloads = stats.downloads || 0;
  const views = stats.views || 0;
  
  return (likes * 5) + (downloads * 3) + views;
}

// Calculate weekly score from weekly stats objects
function calculateWeeklyScore(weeklyStats) {
  let score = 0;
  
  Object.values(weeklyStats).forEach(stats => {
    score += calculateScore(stats);
  });
  
  return score;
}

// Calculate monthly score from monthly stats objects
function calculateMonthlyScore(monthlyStats) {
  let score = 0;
  
  Object.values(monthlyStats).forEach(stats => {
    score += calculateScore(stats);
  });
  
  return score;
}

// Helper function to get ISO week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Export all functions
exports.updateDailySample = updateDailySample; 
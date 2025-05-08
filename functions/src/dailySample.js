const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

exports.updateDailySample = functions.pubsub.schedule('0 0 * * *') // Run at midnight every day
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      
      // Get date for 2 days ago
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);
      
      const endDate = new Date(twoDaysAgo);
      endDate.setHours(23, 59, 59, 999);
      
      // Query samples from 2 days ago
      const samplesRef = db.collection('posts');
      const samplesSnapshot = await samplesRef
        .where('createdAt', '>=', twoDaysAgo)
        .where('createdAt', '<=', endDate)
        .get();
      
      if (samplesSnapshot.empty) {
        console.log('No samples found for the target date');
        return null;
      }
      
      // Calculate scores for each sample
      const samplesWithScores = await Promise.all(
        samplesSnapshot.docs.map(async (doc) => {
          const sample = doc.data();
          const sampleId = doc.id;
          
          // Get interaction stats
          const statsRef = db.collection('sampleStats').doc(sampleId);
          const statsDoc = await statsRef.get();
          const stats = statsDoc.data() || { likes: 0, downloads: 0, views: 0 };
          
          // Calculate score (likes = 5 points, downloads = 3 points, views = 1 point)
          const score = (stats.likes * 5) + (stats.downloads * 3) + stats.views;
          
          return {
            sample: {
              ...sample,
              id: sampleId
            },
            score
          };
        })
      );
      
      // Sort by score and get the highest
      const sortedSamples = samplesWithScores.sort((a, b) => b.score - a.score);
      const topSample = sortedSamples[0];
      
      if (!topSample) {
        console.log('No samples with scores found');
        return null;
      }
      
      // Format date string for document ID
      const dateString = twoDaysAgo.toISOString().split('T')[0];
      
      // Save to dailySamples collection
      await db.collection('dailySamples').doc(dateString).set({
        sample: topSample.sample,
        score: topSample.score,
        date: twoDaysAgo,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Successfully updated daily sample for ${dateString}`);
      return null;
    } catch (error) {
      console.error('Error updating daily sample:', error);
      return null;
    }
  }); 
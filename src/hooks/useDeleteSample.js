import { useState } from 'react';
import { doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { firestore, storage } from '../firebase/firebase';
import { useToast } from '@chakra-ui/react';

/**
 * Hook for deleting a sample from Firestore and Storage
 * @returns {Object} Object containing delete function and loading state
 */
const useDeleteSample = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  /**
   * Delete a sample and its associated media files
   * @param {string} sampleId - The ID of the sample to delete
   * @param {string} audioUrl - URL of the audio file to delete from storage
   * @param {string} imageUrl - URL of the image file to delete from storage (optional)
   * @param {string} userId - Current user's ID to verify ownership
   * @param {string} sampleOwnerId - The user ID of the sample owner
   * @returns {Promise<boolean>} Whether the deletion was successful
   */
  const deleteSample = async (sampleId, audioUrl, imageUrl, userId, sampleOwnerId) => {
    // Verify ownership - only the sample owner can delete it
    if (userId !== sampleOwnerId) {
      toast({
        title: "Permission Denied",
        description: "You can only delete your own samples",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }

    setIsDeleting(true);

    try {
      // 1. Delete the document from Firestore
      // First, determine the collection name - we use 'posts' as that's where samples are stored
      const collectionName = 'posts';
      const sampleRef = doc(firestore, collectionName, sampleId);
      await deleteDoc(sampleRef);
      console.log(`Document deleted from ${collectionName} collection`);

      // 2. Delete audio file from Storage if URL exists
      if (audioUrl) {
        try {
          // Extract the storage path from the URL
          // The URL format is typically https://firebasestorage.googleapis.com/v0/b/[PROJECT_ID].appspot.com/o/[FILE_PATH]?[PARAMS]
          // We need to extract just the [FILE_PATH] part and decode it
          const audioUrlObj = new URL(audioUrl);
          const pathWithQueryString = audioUrlObj.pathname.split('/o/')[1];
          if (pathWithQueryString) {
            const decodedPath = decodeURIComponent(pathWithQueryString);
            console.log('Deleting audio file from path:', decodedPath);
            const audioRef = ref(storage, decodedPath);
            await deleteObject(audioRef);
            console.log('Audio file deleted successfully');
          } else {
            throw new Error('Could not parse audio file path from URL');
          }
        } catch (audioError) {
          console.error("Error deleting audio file:", audioError);
          // Continue execution - we still want to delete the image if possible
        }
      }

      // 3. Delete image file from Storage if URL exists
      if (imageUrl) {
        try {
          // Extract the storage path using the same logic as for audio
          const imageUrlObj = new URL(imageUrl);
          const pathWithQueryString = imageUrlObj.pathname.split('/o/')[1];
          if (pathWithQueryString) {
            const decodedPath = decodeURIComponent(pathWithQueryString);
            console.log('Deleting image file from path:', decodedPath);
            const imageRef = ref(storage, decodedPath);
            await deleteObject(imageRef);
            console.log('Image file deleted successfully');
          } else {
            throw new Error('Could not parse image file path from URL');
          }
        } catch (imageError) {
          console.error("Error deleting image file:", imageError);
          // Continue execution - we've already deleted the document
        }
      }

      toast({
        title: "Sample Deleted",
        description: "Your sample has been permanently deleted",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      return true;
    } catch (error) {
      console.error("Error deleting sample:", error);
      toast({
        title: "Error",
        description: "Failed to delete the sample. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteSample, isDeleting };
};

export default useDeleteSample; 
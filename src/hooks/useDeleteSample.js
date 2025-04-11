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
      const sampleRef = doc(firestore, 'samples', sampleId);
      await deleteDoc(sampleRef);

      // 2. Delete audio file from Storage if URL exists
      if (audioUrl) {
        try {
          // Extract the file path from the URL
          const audioPath = audioUrl.split('?')[0].split('/').slice(7).join('/');
          if (audioPath) {
            const audioRef = ref(storage, audioPath);
            await deleteObject(audioRef);
          }
        } catch (audioError) {
          console.error("Error deleting audio file:", audioError);
          // Continue execution - we still want to delete the image if possible
        }
      }

      // 3. Delete image file from Storage if URL exists
      if (imageUrl) {
        try {
          // Extract the file path from the URL
          const imagePath = imageUrl.split('?')[0].split('/').slice(7).join('/');
          if (imagePath) {
            const imageRef = ref(storage, imagePath);
            await deleteObject(imageRef);
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
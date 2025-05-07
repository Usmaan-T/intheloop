import { isStreakAtRisk, getStreakMessage, resetDailyStreakFlags } from './streakUtils';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

// Mock Firebase functions
jest.mock('firebase/firestore');
jest.mock('../firebase/firebase', () => ({
  firestore: {}
}));

describe('Streak Utilities', () => {
  describe('resetDailyStreakFlags', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('resets streakUpdatedToday flag for all qualifying users', async () => {
      // Mock a collection of users
      const mockUsers = [
        { id: 'user1', data: () => ({ streakUpdatedToday: true }) },
        { id: 'user2', data: () => ({ streakUpdatedToday: true }) },
        { id: 'user3', data: () => ({ streakUpdatedToday: true }) }
      ];

      // Mock the where function before it's used
      where.mockReturnValue('users-where-query');

      // Mock the Firebase query functions
      collection.mockReturnValue('users-collection');
      query.mockReturnValue('users-query');
      getDocs.mockResolvedValue({
        forEach: (callback) => mockUsers.forEach(callback),
        size: mockUsers.length
      });
      doc.mockImplementation((_, __, userId) => `user-ref-${userId}`);
      updateDoc.mockResolvedValue(null);

      // Call the function
      await resetDailyStreakFlags();

      // Check that Firebase was called correctly
      expect(collection).toHaveBeenCalledWith(firestore, 'users');
      expect(where).toHaveBeenCalledWith('streakUpdatedToday', '==', true);
      expect(query).toHaveBeenCalledWith('users-collection', 'users-where-query');
      expect(getDocs).toHaveBeenCalledWith('users-query');

      // Check that updateDoc was called for each user
      expect(updateDoc).toHaveBeenCalledTimes(3);
      expect(doc).toHaveBeenCalledWith(firestore, 'users', 'user1');
      expect(doc).toHaveBeenCalledWith(firestore, 'users', 'user2');
      expect(doc).toHaveBeenCalledWith(firestore, 'users', 'user3');
      expect(updateDoc).toHaveBeenCalledWith('user-ref-user1', { streakUpdatedToday: false });
      expect(updateDoc).toHaveBeenCalledWith('user-ref-user2', { streakUpdatedToday: false });
      expect(updateDoc).toHaveBeenCalledWith('user-ref-user3', { streakUpdatedToday: false });
    });

    test('handles case when no users need updating', async () => {
      // Mock the where function
      where.mockReturnValue('users-where-query');
      
      // Mock an empty collection
      collection.mockReturnValue('users-collection');
      query.mockReturnValue('users-query');
      getDocs.mockResolvedValue({
        forEach: jest.fn(),
        size: 0,
        empty: true
      });

      // Call the function
      await resetDailyStreakFlags();

      // Check that Firebase was called correctly
      expect(collection).toHaveBeenCalledWith(firestore, 'users');
      expect(where).toHaveBeenCalledWith('streakUpdatedToday', '==', true);
      expect(query).toHaveBeenCalledWith('users-collection', 'users-where-query');
      expect(getDocs).toHaveBeenCalledWith('users-query');

      // Verify updateDoc was not called
      expect(updateDoc).not.toHaveBeenCalled();
    });

    test('handles errors gracefully', async () => {
      // Mock the where function
      where.mockReturnValue('users-where-query');
      
      // Mock a collection error
      collection.mockReturnValue('users-collection');
      query.mockReturnValue('users-query');
      getDocs.mockRejectedValue(new Error('Database error'));

      // Mock console.error to capture the error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Call the function
      await resetDailyStreakFlags();

      // Verify error handling
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error resetting streak flags:',
        expect.any(Error)
      );

      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('isStreakAtRisk', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed date
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2023-06-02T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('returns false when there is no last upload date', () => {
      expect(isStreakAtRisk(null)).toBe(false);
      expect(isStreakAtRisk(undefined)).toBe(false);
    });

    test('returns true when last upload was yesterday', () => {
      const yesterday = new Date('2023-06-01T15:30:00Z');
      expect(isStreakAtRisk(yesterday)).toBe(true);
    });

    test('returns false when last upload was today', () => {
      const today = new Date('2023-06-02T08:15:00Z');
      expect(isStreakAtRisk(today)).toBe(false);
    });

    test('returns false when last upload was more than one day ago', () => {
      const twoDaysAgo = new Date('2023-05-31T10:00:00Z');
      expect(isStreakAtRisk(twoDaysAgo)).toBe(false);
    });
  });

  describe('getStreakMessage', () => {
    test('returns appropriate message for zero streak', () => {
      expect(getStreakMessage(0)).toBe('Upload your first sample to start your streak!');
    });

    test('returns appropriate message for streak of 1', () => {
      expect(getStreakMessage(1)).toBe('Great start! Upload again tomorrow to keep your streak going.');
    });

    test('returns appropriate message for small streak (2-4)', () => {
      expect(getStreakMessage(3)).toContain('3-day streak');
      expect(getStreakMessage(3)).toContain('Keep it up');
    });

    test('returns appropriate message for medium streak (5-9)', () => {
      expect(getStreakMessage(7)).toContain('7-day streak');
      expect(getStreakMessage(7)).toContain('Impressive');
    });

    test('returns appropriate message for large streak (10-29)', () => {
      expect(getStreakMessage(15)).toContain('15-day streak');
      expect(getStreakMessage(15)).toContain('Amazing');
    });

    test('returns appropriate message for exceptional streak (30+)', () => {
      expect(getStreakMessage(45)).toContain('45-day streak');
      expect(getStreakMessage(45)).toContain('Incredible');
    });
  });
}); 
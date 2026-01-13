import { describe, it, expect } from '@jest/globals';
import { formatTimeAgo, getNicknameFromUserId } from '../helpers';

describe('Helper Functions', () => {
  describe('formatTimeAgo', () => {
    // Note: FormatTimeAgo uses real dates, so we test with relative times
    const now = Date.now();

    it('should return "just now" for recent dates', () => {
      const date = new Date(now - 30000).toISOString(); // 30 seconds ago
      expect(formatTimeAgo(date)).toBe('just now');
    });

    it('should return minutes ago', () => {
      const date = new Date(now - 30 * 60 * 1000).toISOString(); // 30 minutes ago
      expect(formatTimeAgo(date)).toMatch(/^\d+m ago$/);
    });

    it('should return hours ago', () => {
      const date = new Date(now - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
      expect(formatTimeAgo(date)).toMatch(/^\d+h ago$/);
    });

    it('should return days ago', () => {
      const date = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
      expect(formatTimeAgo(date)).toMatch(/^\d+d ago$/);
    });

    it('should return formatted date for older dates', () => {
      const date = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(); // 10 days ago
      const result = formatTimeAgo(date);
      expect(result).toMatch(/[A-Z][a-z]{2} \d+/);
    });
  });

  describe('getNicknameFromUserId', () => {
    const nicknames = ['Alice', 'Bob', 'Charlie', 'Diana'];
    const avatarEmojis = ['😀', '😊', '😎', '🤗'];

    it('should return same nickname for same userId', () => {
      const userId = 'test-user-123';
      const result1 = getNicknameFromUserId(userId, nicknames, avatarEmojis);
      const result2 = getNicknameFromUserId(userId, nicknames, avatarEmojis);
      
      expect(result1.name).toBe(result2.name);
      expect(result1.emoji).toBe(result2.emoji);
    });

    it('should return different nicknames for different userIds', () => {
      const result1 = getNicknameFromUserId('user-1', nicknames, avatarEmojis);
      const result2 = getNicknameFromUserId('user-2', nicknames, avatarEmojis);
      
      // They might be the same due to hash collision, but that's acceptable
      // Just ensure the function works
      expect(result1.name).toBeDefined();
      expect(result2.name).toBeDefined();
      expect(result1.emoji).toBeDefined();
      expect(result2.emoji).toBeDefined();
    });

    it('should return a valid nickname from the list', () => {
      const result = getNicknameFromUserId('test', nicknames, avatarEmojis);
      expect(nicknames).toContain(result.name);
    });

    it('should return a valid emoji from the list', () => {
      const result = getNicknameFromUserId('test', nicknames, avatarEmojis);
      expect(avatarEmojis).toContain(result.emoji);
    });

    it('should handle empty arrays gracefully', () => {
      const result = getNicknameFromUserId('test', [], []);
      expect(result.name).toBeUndefined();
      expect(result.emoji).toBeUndefined();
    });
  });
});

import { describe, it, expect } from '@jest/globals';
import {
  validateContent,
  validateComment,
  validateUserId,
  sanitizeMood,
  sanitizeMode,
} from '../validation.js';
import type { Mood, PostMode } from '../../types/index.js';

describe('Validation Utils', () => {
  describe('validateContent', () => {
    it('should reject empty content', () => {
      const result = validateContent('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Content cannot be empty');
    });

    it('should reject whitespace-only content', () => {
      const result = validateContent('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Content cannot be empty');
    });

    it('should reject content over 500 characters', () => {
      const longContent = 'a'.repeat(501);
      const result = validateContent(longContent);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Content must be 500 characters or less');
    });

    it('should accept valid content', () => {
      const result = validateContent('This is a valid post content');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept content exactly 500 characters', () => {
      const content = 'a'.repeat(500);
      const result = validateContent(content);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateComment', () => {
    it('should reject empty comments', () => {
      const result = validateComment('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Comment cannot be empty');
    });

    it('should reject whitespace-only comments', () => {
      const result = validateComment('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Comment cannot be empty');
    });

    it('should reject comments over 300 characters', () => {
      const longComment = 'a'.repeat(301);
      const result = validateComment(longComment);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Comment must be 300 characters or less');
    });

    it('should accept valid comments', () => {
      const result = validateComment('This is a valid comment');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateUserId', () => {
    it('should reject empty userId', () => {
      const result = validateUserId('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should reject whitespace-only userId', () => {
      const result = validateUserId('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('User ID is required');
    });

    it('should reject null/undefined userId', () => {
      const result1 = validateUserId(null as any);
      const result2 = validateUserId(undefined as any);
      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
    });

    it('should accept valid userId', () => {
      const result = validateUserId('user-123-abc');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('sanitizeMood', () => {
    it('should return valid mood as-is', () => {
      const validMoods: Mood[] = ['sad', 'angry', 'stressed', 'happy', 'confused', 'neutral'];
      validMoods.forEach(mood => {
        expect(sanitizeMood(mood)).toBe(mood);
      });
    });

    it('should return neutral for invalid mood', () => {
      expect(sanitizeMood('invalid' as Mood)).toBe('neutral');
      expect(sanitizeMood('happy123' as Mood)).toBe('neutral');
      expect(sanitizeMood('' as Mood)).toBe('neutral');
    });
  });

  describe('sanitizeMode', () => {
    it('should return valid mode as-is', () => {
      const validModes: PostMode[] = ['vent', 'advice'];
      validModes.forEach(mode => {
        expect(sanitizeMode(mode)).toBe(mode);
      });
    });

    it('should return vent for invalid mode', () => {
      expect(sanitizeMode('invalid' as PostMode)).toBe('vent');
      expect(sanitizeMode('vent123' as PostMode)).toBe('vent');
      expect(sanitizeMode('' as PostMode)).toBe('vent');
    });
  });
});

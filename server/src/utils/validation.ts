import type { Mood, PostMode } from '../types';

export const validateContent = (content: string): { valid: boolean; error?: string } => {
  const trimmed = content?.trim() || '';
  
  if (trimmed.length < 1) {
    return { valid: false, error: 'Content cannot be empty' };
  }
  
  if (trimmed.length > 500) {
    return { valid: false, error: 'Content must be 500 characters or less' };
  }
  
  return { valid: true };
};

export const validateComment = (text: string): { valid: boolean; error?: string } => {
  const trimmed = text?.trim() || '';
  
  if (trimmed.length < 1) {
    return { valid: false, error: 'Comment cannot be empty' };
  }
  
  if (trimmed.length > 300) {
    return { valid: false, error: 'Comment must be 300 characters or less' };
  }
  
  return { valid: true };
};

export const validateUserId = (userId: string): { valid: boolean; error?: string } => {
  if (!userId || userId.trim().length === 0) {
    return { valid: false, error: 'User ID is required' };
  }
  
  return { valid: true };
};

export const sanitizeMood = (mood: Mood): Mood => {
  const allowedMoods: Mood[] = ['sad', 'angry', 'stressed', 'happy', 'confused', 'neutral'];
  return allowedMoods.includes(mood) ? mood : 'neutral';
};

export const sanitizeMode = (mode: PostMode): PostMode => {
  const allowedModes: PostMode[] = ['vent', 'advice'];
  return allowedModes.includes(mode) ? mode : 'vent';
};

/**
 * @file comms.validators.test.ts
 * @domain comms
 * @description Tests for comms Zod validators (US-21-01)
 *
 * @spec
 * - getConversationsQuerySchema validates empty object as valid
 * - getConversationsQuerySchema validates search param (min 2, max 100 chars)
 * - getConversationsQuerySchema validates limit param (1-100, string input)
 * - getConversationsQuerySchema validates page param (>= 1, string input)
 * - getConversationsQuerySchema transforms string numbers to integers
 * - getConversationsQuerySchema rejects invalid data with Russian error messages
 * - conversationListItemSchema validates valid conversation item
 * - conversationListResponseSchema validates valid response structure
 */

import { describe, it, expect } from 'vitest';
import {
  getConversationsQuerySchema,
  conversationListItemSchema,
  conversationListResponseSchema,
} from '@/domains/comms/comms.validators';

describe('getConversationsQuerySchema', () => {
  describe('valid data', () => {
    it('should pass empty object', () => {
      const result = getConversationsQuerySchema.parse({});
      expect(result).toEqual({
        search: undefined,
        limit: undefined,
        page: undefined,
      });
    });

    it('should pass valid search query', () => {
      const result = getConversationsQuerySchema.parse({ search: 'Иван' });
      expect(result.search).toBe('Иван');
      expect(result.limit).toBeUndefined();
      expect(result.page).toBeUndefined();
    });

    it('should pass search with exactly 2 characters', () => {
      const result = getConversationsQuerySchema.parse({ search: 'Ив' });
      expect(result.search).toBe('Ив');
    });

    it('should pass search with 100 characters', () => {
      const longSearch = 'a'.repeat(100);
      const result = getConversationsQuerySchema.parse({ search: longSearch });
      expect(result.search).toBe(longSearch);
    });

    it('should pass valid limit as string', () => {
      const result = getConversationsQuerySchema.parse({ limit: '20' });
      expect(result.limit).toBe(20);
    });

    it('should pass valid page as string', () => {
      const result = getConversationsQuerySchema.parse({ page: '1' });
      expect(result.page).toBe(1);
    });

    it('should pass limit at boundary (1)', () => {
      const result = getConversationsQuerySchema.parse({ limit: '1' });
      expect(result.limit).toBe(1);
    });

    it('should pass limit at boundary (100)', () => {
      const result = getConversationsQuerySchema.parse({ limit: '100' });
      expect(result.limit).toBe(100);
    });

    it('should pass page at boundary (1)', () => {
      const result = getConversationsQuerySchema.parse({ page: '1' });
      expect(result.page).toBe(1);
    });

    it('should pass page with large value', () => {
      const result = getConversationsQuerySchema.parse({ page: '999' });
      expect(result.page).toBe(999);
    });

    it('should pass all params together', () => {
      const result = getConversationsQuerySchema.parse({
        search: 'Петров',
        limit: '10',
        page: '3',
      });
      expect(result).toEqual({
        search: 'Петров',
        limit: 10,
        page: 3,
      });
    });

    it('should transform non-numeric limit to undefined', () => {
      const result = getConversationsQuerySchema.parse({ limit: 'abc' });
      expect(result.limit).toBeUndefined();
    });

    it('should transform non-numeric page to undefined', () => {
      const result = getConversationsQuerySchema.parse({ page: 'abc' });
      expect(result.page).toBeUndefined();
    });
  });

  describe('invalid data', () => {
    it('should reject search with 1 character', () => {
      const result = getConversationsQuerySchema.safeParse({ search: 'И' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.errors[0]?.message;
        expect(message).toContain('минимум 2 символа');
      }
    });

    it('should reject search with empty string', () => {
      const result = getConversationsQuerySchema.safeParse({ search: '' });
      expect(result.success).toBe(false);
    });

    it('should reject search exceeding 100 characters', () => {
      const longSearch = 'a'.repeat(101);
      const result = getConversationsQuerySchema.safeParse({ search: longSearch });
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.errors[0]?.message;
        expect(message).toContain('100 символов');
      }
    });

    it('should reject limit = 0', () => {
      const result = getConversationsQuerySchema.safeParse({ limit: '0' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.errors[0]?.message;
        expect(message).toContain('от 1 до 100');
      }
    });

    it('should reject limit = -1', () => {
      const result = getConversationsQuerySchema.safeParse({ limit: '-1' });
      expect(result.success).toBe(false);
    });

    it('should reject limit = 101', () => {
      const result = getConversationsQuerySchema.safeParse({ limit: '101' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.errors[0]?.message;
        expect(message).toContain('от 1 до 100');
      }
    });

    it('should reject page = 0', () => {
      const result = getConversationsQuerySchema.safeParse({ page: '0' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const message = result.error.errors[0]?.message;
        expect(message).toContain('не менее 1');
      }
    });

    it('should reject page = -1', () => {
      const result = getConversationsQuerySchema.safeParse({ page: '-1' });
      expect(result.success).toBe(false);
    });
  });
});

describe('conversationListItemSchema', () => {
  const validItem = {
    conversationId: 'conv-123',
    participantId: 'user-2',
    participantName: 'Иван Петров',
    participantAvatar: '/avatars/ivan.jpg',
    lastMessagePreview: 'Привет, как дела?',
    lastMessageAt: new Date('2024-01-15T10:00:00.000Z'),
    unreadCount: 3,
  };

  it('should pass valid conversation list item', () => {
    const result = conversationListItemSchema.safeParse(validItem);
    expect(result.success).toBe(true);
  });

  it('should pass with null avatar', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      participantAvatar: null,
    });
    expect(result.success).toBe(true);
  });

  it('should pass with undefined avatar', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      participantAvatar: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('should pass with null lastMessagePreview', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      lastMessagePreview: null,
    });
    expect(result.success).toBe(true);
  });

  it('should pass with unreadCount = 0', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      unreadCount: 0,
    });
    expect(result.success).toBe(true);
  });

  it('should reject empty conversationId', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      conversationId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty participantId', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      participantId: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty participantName', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      participantName: '',
    });
    expect(result.success).toBe(false);
  });

  it('should reject participantName exceeding 100 characters', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      participantName: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('should reject lastMessagePreview exceeding 60 characters', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      lastMessagePreview: 'a'.repeat(61),
    });
    expect(result.success).toBe(false);
  });

  it('should reject negative unreadCount', () => {
    const result = conversationListItemSchema.safeParse({
      ...validItem,
      unreadCount: -1,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const message = result.error.errors[0]?.message;
      expect(message).toContain('не может быть отрицательным');
    }
  });
});

describe('conversationListResponseSchema', () => {
  it('should pass valid response with items', () => {
    const response = {
      items: [
        {
          conversationId: 'conv-1',
          participantId: 'user-2',
          participantName: 'Иван Петров',
          lastMessageAt: new Date(),
          unreadCount: 0,
        },
      ],
      total: 1,
    };
    const result = conversationListResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should pass valid response with empty items', () => {
    const response = {
      items: [],
      total: 0,
    };
    const result = conversationListResponseSchema.safeParse(response);
    expect(result.success).toBe(true);
  });

  it('should reject negative total', () => {
    const response = {
      items: [],
      total: -1,
    };
    const result = conversationListResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject missing items', () => {
    const response = {
      total: 0,
    };
    const result = conversationListResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });

  it('should reject missing total', () => {
    const response = {
      items: [],
    };
    const result = conversationListResponseSchema.safeParse(response);
    expect(result.success).toBe(false);
  });
});

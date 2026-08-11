/**
 * @file comms.validators.markRead.test.ts
 * @domain comms
 * @description Unit-тесты для markAsReadSchema (B-026, US-39-01 AC-4)
 *
 * @spec
 * - markAsReadSchema принимает UUID
 * - markAsReadSchema отклоняет не-UUID
 */
import { describe, it, expect } from 'vitest';
import { markAsReadSchema } from '@/domains/comms/comms.validators';

const VALID_UUID = '11111111-1111-4111-8111-111111111111';

describe('markAsReadSchema (US-39-01 AC-4)', () => {
  it('должен принимать валидный UUID-конверсации', () => {
    const result = markAsReadSchema.parse({ id: VALID_UUID });
    expect(result.id).toBe(VALID_UUID);
  });

  it('должен отклонять не-UUID как "Некорректный ID диалога"', () => {
    expect(() => markAsReadSchema.parse({ id: 'invalid-id' })).toThrow(
      'Некорректный ID диалога'
    );
  });

  it('должен отклонять пустой id', () => {
    expect(() => markAsReadSchema.parse({ id: '' })).toThrow();
  });

  it('должен отклонять отсутствующий id', () => {
    expect(() => markAsReadSchema.parse({})).toThrow();
  });
});

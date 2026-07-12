/**
 * @file register.test.ts
 * @description Интеграционные тесты для API регистрации пользователей
 *
 * @spec
 * - POST /api/v1/auth/register
 *   - 201: Успешная регистрация
 *   - 400: Валидация не прошла
 *   - 409: Пользователь с email уже существует
 *
 * @see docs/tests/integration-tests.md
 */

import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import bcrypt from 'bcryptjs';
import { prisma } from '../setup';
import { createUniqueEmail } from '../helpers';
import { POST } from '@/app/api/v1/auth/register/route';
import { NextRequest } from 'next/server';

// ============================================================================
// Test Helpers
// ============================================================================

function createMockRequest(url: string, body: unknown): NextRequest {
  return new NextRequest(new URL(url), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

// ============================================================================
// Integration Tests
// ============================================================================

describe('Auth Registration API (Integration)', () => {
  let testPassword: string;

  beforeEach(async () => {
    testPassword = 'TestPassword123!';
  });

  afterAll(async () => {
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user (201)', async () => {
      const email = createUniqueEmail('registration');
      const password = testPassword;

      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email,
        password,
        confirmPassword: password,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: expect.objectContaining({
          email,
          name: null,
          id: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      });
      // Password должен отсутствовать в ответе
      expect(data.data.password).toBeUndefined();
      expect(data.data.passwordHash).toBeUndefined();

      // Проверяем, что пользователь создан в БД
      const user = await prisma.user.findUnique({
        where: { email },
      });
      expect(user).not.toBeNull();
      expect(user?.email).toBe(email);
      expect(user?.name).toBeNull();
    });

    it('should convert email to lowercase', async () => {
      const email = createUniqueEmail('registration').toUpperCase();
      const password = testPassword;

      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email,
        password,
        confirmPassword: password,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(user).not.toBeNull();
      expect(user?.email).toBe(email.toLowerCase());
    });

    it('should trim email before creating user', async () => {
      const email = `  ${createUniqueEmail('registration')}  `;
      const password = testPassword;

      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email,
        password,
        confirmPassword: password,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);

      const user = await prisma.user.findUnique({
        where: { email: email.trim() },
      });
      expect(user).not.toBeNull();
      expect(user?.email).toBe(email.trim().toLowerCase());
    });

    it('should return 409 when email already exists', async () => {
      const email = createUniqueEmail('registration');
      const password = testPassword;

      // Создаём пользователя заранее
      await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 10),
        },
      });

      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email,
        password,
        confirmPassword: password,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'CONFLICT_ERROR',
          message: expect.any(String),
        },
      });
    });

    it('should return 400 for invalid email format', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email: 'invalid-email',
        password: testPassword,
        confirmPassword: testPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });

    it('should accept 8 character password (minimum is 6)', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email: createUniqueEmail('short'),
        password: 'Short1!',
        confirmPassword: 'Short1!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual({
        success: true,
        data: expect.objectContaining({
          email: expect.stringContaining('short'),
        }),
      });
    });

    it('should return 400 when passwords do not match', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email: createUniqueEmail('nomatch'),
        password: 'TestPassword123!',
        confirmPassword: 'DifferentPassword123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });

    it('should return 400 for empty email', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email: '',
        password: testPassword,
        confirmPassword: testPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });

    it('should return 400 for empty password', async () => {
      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email: createUniqueEmail('emptypass'),
        password: '',
        confirmPassword: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });

    it('should assign GUEST role to new user', async () => {
      const email = createUniqueEmail('guest-role');
      const password = testPassword;

      const request = createMockRequest('http://localhost:3000/api/v1/auth/register', {
        email,
        password,
        confirmPassword: password,
      });

      const response = await POST(request);
      await response.json();

      // Проверяем, что назначена роль GUEST
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      expect(user).not.toBeNull();
      expect(user?.roles).toHaveLength(1);
      expect(user?.roles[0].role.name).toBe('GUEST');
    });
  });
});

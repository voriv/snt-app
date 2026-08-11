/**
 * @route POST /api/v1/test/users
 * @auth none
 * @description ТЕСТОВЫЙ endpoint для создания пользователей в e2e-тестах.
 *
 * ⚠️ ТОЛЬКО ДЛЯ TEST/DEV. В production возвращает 403.
 * Защита:
 *   - NODE_ENV !== 'production' И
 *   - ENABLE_TEST_ROUTES === 'true'
 *
 * @body { email, password, firstName, lastName, role? }
 * @response 200/201 { success: true, data: { id, email, firstName, lastName } }
 *  - идемпотентно: при существующем email возвращает существующего пользователя (200)
 *  - при создании нового — 201
 *
 * @response 403 { success: false, error: { code: 'TEST_ROUTES_DISABLED', message } }
 * @response 400 { success: false, error: { code: 'INVALID_DATA', message } }
 * @response 500 { success: false, error: { code: 'INTERNAL_ERROR', message } }
 *
 * @covers e2e/comms/new-conversation.e2e.spec.ts — B030-T3-1, B030-T4-1, US-21-39
 * @see tests/e2e/shared/test-helpers.ts — TEST_USERS
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/infrastructure/prisma/client';

/** Количество раундов salt для bcrypt (как в AuthService) */
const BCRYPT_SALT_ROUNDS = 10;

/** Схема валидации тела запроса */
const CreateTestUserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(128),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.string().min(1).max(100).optional(),
});

/**
 * Проверка: разрешён ли тестовый роут в текущем окружении.
 *
 * @returns true, если NODE_ENV !== 'production' И ENABLE_TEST_ROUTES === 'true'
 */
function isTestRoutesEnabled(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  return process.env.ENABLE_TEST_ROUTES === 'true';
}

/**
 * POST /api/v1/test/users
 *
 * Создаёт пользователя с профилем (firstName/lastName) напрямую через Prisma.
 * Идемпотентно по email: при существующем пользователе возвращает его без ошибки.
 *
 * @param request — NextRequest с JSON-телом
 * @returns JSON { success, data: { id, email, firstName, lastName } }
 */
export async function POST(request: NextRequest) {
  // --- Защита от production ---
  if (!isTestRoutesEnabled()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEST_ROUTES_DISABLED',
          message: 'Тестовые роуты отключены в данном окружении',
        },
      },
      { status: 403 },
    );
  }

  try {
    // --- Парсинг и валидация тела ---
    const json = await request.json();
    const parsed = CreateTestUserSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATA',
            message: 'Невалидные данные запроса',
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 },
      );
    }

    const { email, password, firstName, lastName, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // --- Идемпотентность: найти существующего пользователя ---
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: true,
          data: {
            id: existing.id,
            email: existing.email,
            firstName: existing.profile?.first_name ?? null,
            lastName: existing.profile?.last_name ?? null,
          },
        },
        { status: 200 },
      );
    }

    // --- Опциональный resolve роли по имени ---
    let roleConnect: { id: string } | null = null;
    if (role) {
      const roleRecord = await prisma.role.findUnique({
        where: { name: role },
        select: { id: true },
      });
      if (!roleRecord) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_DATA',
              message: `Роль "${role}" не найдена`,
            },
          },
          { status: 400 },
        );
      }
      roleConnect = { id: roleRecord.id };
    }

    // --- Создание нового пользователя с профилем ---
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: `${firstName} ${lastName}`.trim(),
        password: passwordHash,
        profile: {
          create: {
            first_name: firstName,
            last_name: lastName,
          },
        },
        roles: roleConnect
          ? {
              create: [{ role: { connect: roleConnect } }],
            }
          : undefined,
      },
      include: { profile: true },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: created.id,
          email: created.email,
          firstName: created.profile?.first_name ?? null,
          lastName: created.profile?.last_name ?? null,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Ошибка при создании тестового пользователя';

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message,
        },
      },
      { status: 500 },
    );
  }
}

/**
 * @file src/app/api/auth/next-auth.config.ts
 * @description NextAuth конфигурация для API маршрутов
 *
 * @spec
 * - Реэкспортирует обработчики из @/lib/auth — единая точка конфигурации NextAuth
 * - Расширение типов NextAuth находится в next-auth.d.ts (RBAC, US-8)
 *
 * @see src/lib/auth.ts — основная конфигурация NextAuth
 */
// Эпоксируем GET/POST для совместимости с предыдущей версией
import { NextAuthHandler as NextAuth } from '@/lib/auth';

export const GET = NextAuth;
export const POST = NextAuth;

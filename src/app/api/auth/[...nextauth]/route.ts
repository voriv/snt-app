/**
 * @route GET, POST /api/auth/*
 * @auth none
 * @description NextAuth.js API endpoint для обработки аутентификационных запросов (вход, выход, сессия, callbacks)
 *
 * @spec
 * - Catch-all route для NextAuth — обрабатывает все подпути /api/auth/*
 * - Поддерживает GET и POST методы для JWT сессий
 * - Все конфигурации централизованы в lib/auth.ts
 * - NextAuthHandler - это handleAuth обёртка, которая сама маршрутизирует запросы
 * - Обработка callbacks: /api/auth/callback/*, /api/auth/signin/*, /api/auth/session/*
 */

import { NextAuthHandler } from '@/lib/auth';

/**
 * Обработка всех запросов к NextAuth API (GET, POST)
 * NextAuthHandler сам определяет метод и маршрутизирует запрос
 * @param {any} request - NextRequest объект
 * @param {any} context - Параметры контекста (пары роли, параметры route)
 * @returns {Promise<any>} Response от NextAuth
 */
export async function GET(request: Request, context: any): Promise<any> {
  return NextAuthHandler(request, context);
}

/**
 * Обработка всех запросов к NextAuth API (GET, POST)
 * NextAuthHandler сам определяет метод и маршрутизирует запрос
 * @param {any} request - NextRequest объект
 * @param {any} context - Параметры контекста (пары роли, параметры route)
 * @returns {Promise<any>} Response от NextAuth
 */
export async function POST(request: Request, context: any): Promise<any> {
  return NextAuthHandler(request, context);
}

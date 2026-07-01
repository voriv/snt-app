/**
 * @route GET, POST /api/auth/nextauth
 * @auth none
 * @description NextAuth.js API endpoint для обработки аутентификационных запросов
 * 
 * @spec
 * - Обёртка для NextAuth handler из lib/auth.ts
 * - Поддерживает GET и POST методы для JWT сессий
 * - Все конфигурации централизованы в lib/auth.ts
 * - NextAuthHandler - это handleAuth обёртка, которая сама маршрутизирует запросы
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

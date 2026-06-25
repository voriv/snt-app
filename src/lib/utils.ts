import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

/**
 * Combines clsx and tailwind-merge for conditional class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a readable format
 * @param date - Date to format
 * @param formatStr - Format string (default: 'dd.MM.yyyy')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string = 'dd.MM.yyyy',
): string {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: ru });
  } catch {
    return '-';
  }
}

/**
 * Formats a date to a relative format (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative date string
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ru });
  } catch {
    return '-';
  }
}

/**
 * Formats a number as currency (RUB)
 * @param amount - Amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatMoney(
  amount: number | string | null | undefined,
  decimals: number = 2,
): string {
  if (amount === null || amount === undefined) return '0.00 ₽';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '0.00 ₽';
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount);
}

/**
 * Formats a phone number
 * @param phone - Phone number to format
 * @returns Formatted phone number
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Format as +7 (XXX) XXX-XX-XX
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  if (digits.length === 10) {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }
  return phone;
}

/**
 * Truncates text to a specified length
 * @param text - Text to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to add if truncated (default: '...')
 * @returns Truncated text
 */
export function truncate(
  text: string,
  length: number,
  suffix: string = '...',
): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + suffix;
}

/**
 * Generates a random string
 * @param length - Length of the string (default: 32)
 * @returns Random string
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validates an email address
 * @param email - Email to validate
 * @returns True if valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Paginates an array
 * @param array - Array to paginate
 * @param page - Current page (1-indexed)
 * @param perPage - Items per page
 * @returns Paginated array
 */
export function paginate<T>(array: T[], page: number, perPage: number): T[] {
  const start = (page - 1) * perPage;
  return array.slice(start, start + perPage);
}

/**
 * Counts pages based on total items and items per page
 * @param totalItems - Total number of items
 * @param perPage - Items per page
 * @returns Number of pages
 */
export function countPages(totalItems: number, perPage: number): number {
  return Math.ceil(totalItems / perPage);
}

/**
 * Calculates file size in human readable format
 * @param bytes - File size in bytes
 * @returns Human readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Debounces a function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Sleeps for a specified number of milliseconds
 * @param ms - Milliseconds to sleep
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

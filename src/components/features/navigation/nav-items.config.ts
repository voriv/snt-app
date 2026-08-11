/**
 * @module nav-items.config
 * @description Конфигурация пунктов навигации: 8 пунктов с иконками Lucide,
 * ролевой видимостью, группами и маппингом сегментов пути для breadcrumbs.
 *
 * @spec docs/specs/nav/component-spec.md → 3.1.1
 * @task NAV-02-T1
 *
 * @covers AC-NAV-02-4 — Ролевые пункты меню
 * @covers AC-NAV-05-2 — Ролевые пункты в sidebar
 * @covers AC-NAV-07-7 — Ролевые пункты в drawer
 */

import {
  LayoutDashboard,
  Map,
  FileText,
  MessageCircle,
  User,
  Users,
  Shield,
  CreditCard,
  type LucideIcon,
} from 'lucide-react';

/**
 * Группы навигации — используются для разделения пунктов в sidebar.
 */
export type NavGroup = 'main' | 'account' | 'admin' | 'finance';

/**
 * Пункт навигации.
 *
 * @property path           - Маршрут (начинается с `/dashboard`)
 * @property title          - Отображаемое название
 * @property icon           - Иконка Lucide
 * @property roles          - Роли, которым доступен пункт. Если undefined — доступен всем.
 * @property group          - Группа для sidebar (main, account, admin, finance)
 * @property breadcrumbLabel - Подпись для breadcrumbs (без эмодзи — эмодзи в breadcrumbMap)
 */
export interface NavItem {
  path: string;
  title: string;
  icon: LucideIcon;
  roles?: string[];
  group: NavGroup;
  breadcrumbLabel?: string;
}

/**
 * Список пунктов навигации (8 штук).
 *
 * Ролевая видимость:
 * - GUEST / без роли → Дашборд, Участки, Документы, Профиль
 * - MEMBER           → + Общение
 * - ADMIN            → + Пользователи, Платежи
 * - SUPER_ADMIN      → + Роли
 */
export const navItems: NavItem[] = [
  {
    path: '/dashboard',
    title: 'Дашборд',
    icon: LayoutDashboard,
    group: 'main',
    breadcrumbLabel: 'Дашборд',
  },
  {
    path: '/dashboard/plots',
    title: 'Участки',
    icon: Map,
    group: 'main',
    breadcrumbLabel: 'Участки',
  },
  {
    path: '/dashboard/documents',
    title: 'Документы',
    icon: FileText,
    group: 'main',
    breadcrumbLabel: 'Документы',
  },
  {
    path: '/dashboard/comms',
    title: 'Общение',
    icon: MessageCircle,
    group: 'main',
    breadcrumbLabel: 'Общение',
  },
  {
    path: '/dashboard/profile',
    title: 'Профиль',
    icon: User,
    group: 'account',
    breadcrumbLabel: 'Профиль',
  },
  {
    path: '/dashboard/users',
    title: 'Пользователи',
    icon: Users,
    roles: ['ADMIN', 'SUPER_ADMIN'],
    group: 'admin',
    breadcrumbLabel: 'Пользователи',
  },
  {
    path: '/dashboard/roles',
    title: 'Роли',
    icon: Shield,
    roles: ['SUPER_ADMIN'],
    group: 'admin',
    breadcrumbLabel: 'Роли',
  },
  {
    path: '/dashboard/payments',
    title: 'Платежи',
    icon: CreditCard,
    roles: ['ADMIN', 'SUPER_ADMIN'],
    group: 'finance',
    breadcrumbLabel: 'Платежи',
  },
];

/**
 * Маппинг сегментов пути → подпись для breadcrumbs (с эмодзи).
 *
 * Ключи — это либо одиночные сегменты (`dashboard`, `plots`),
 * либо составные пути через `/` (`comms/messages`) для уточнения вложенных разделов.
 */
export const breadcrumbMap: Record<string, string> = {
  dashboard: '🏠 Дашборд',
  plots: '📋 Участки',
  documents: '📄 Документы',
  comms: '💬 Общение',
  'comms/messages': '💬 Личные сообщения',
  'comms/chats': '💬 Групповые чаты',
  'comms/announcements': '📢 Объявления',
  'comms/moderation': '🛡 Модерация',
  users: '👥 Пользователи',
  roles: '🔐 Роли',
  profile: '👤 Профиль',
  payments: '💳 Платежи',
  edit: '✏️ Редактирование',
  new: '➕ Создание',
  create: '➕ Создание',
};

/**
 * Порядок групп в sidebar.
 */
export const navGroupOrder: NavGroup[] = ['main', 'account', 'admin', 'finance'];

/**
 * Подписи групп для заголовков разделов sidebar (опционально).
 */
export const navGroupLabels: Record<NavGroup, string> = {
  main: 'Основное',
  account: 'Аккаунт',
  admin: 'Администрирование',
  finance: 'Финансы',
};

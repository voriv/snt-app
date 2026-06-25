// User roles
export enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  GUEST = 'GUEST',
}

export const USER_ROLES = Object.values(UserRole);

// Plot status
export enum PlotStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ABANDONED = 'ABANDONED',
}

export const PLOT_STATUSES = Object.values(PlotStatus);

// Membership role
export enum MembershipRole {
  OWNER = 'OWNER',
  CO_OWNER = 'CO_OWNER',
  TENANT = 'TENANT',
  FAMILY = 'FAMILY',
}

export const MEMBERSHIP_ROLES = Object.values(MembershipRole);

// Charge types
export enum ChargeType {
  MEMBERSHIP_FEE = 'MEMBERSHIP_FEE',
  TARGET_FEE = 'TARGET_FEE',
  ELECTRICITY = 'ELECTRICITY',
  WATER = 'WATER',
  LAND_TAX = 'LAND_TAX',
  OTHER = 'OTHER',
}

export const CHARGE_TYPES = Object.values(ChargeType);

// Charge status
export enum ChargeStatus {
  PENDING = 'PENDING',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export const CHARGE_STATUSES = Object.values(ChargeStatus);

// Payment methods
export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  TRANSFER = 'TRANSFER',
  SBERPAY = 'SBERPAY',
  OTHER = 'OTHER',
}

export const PAYMENT_METHODS = Object.values(PaymentMethod);

// Document categories
export enum DocCategory {
  CHARTER = 'CHARTER',
  PROTOCOL = 'PROTOCOL',
  RULE = 'RULE',
  REPORT = 'REPORT',
  CONTRACT = 'CONTRACT',
  INVOICE = 'INVOICE',
  OTHER = 'OTHER',
}

export const DOC_CATEGORIES = Object.values(DocCategory);

// Vote types
export enum VoteType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
}

export const VOTE_TYPES = Object.values(VoteType);

// Vote status
export enum VoteStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export const VOTE_STATUSES = Object.values(VoteStatus);

// Chat types
export enum ChatType {
  PRIVATE = 'PRIVATE',
  GROUP = 'GROUP',
}

export const CHAT_TYPES = Object.values(ChatType);

// Notification types
export enum NotificationType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  VOTE_STARTED = 'VOTE_STARTED',
  VOTE_ENDED = 'VOTE_ENDED',
  CHARGE_CREATED = 'CHARGE_CREATED',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  CHAT_MESSAGE = 'CHAT_MESSAGE',
  FORUM_REPLY = 'FORUM_REPLY',
  SYSTEM = 'SYSTEM',
}

export const NOTIFICATION_TYPES = Object.values(NotificationType);

// File upload constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Pagination constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Date format patterns
export const DATE_FORMAT = 'dd.MM.yyyy';
export const DATETIME_FORMAT = 'dd.MM.yyyy HH:mm';
export const FULL_DATETIME_FORMAT = 'dd MMMM yyyy, HH:mm';

// API response codes
export const API_RESPONSE = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

// Route groups
export const ROUTE_GROUPS = {
  PUBLIC: '(public)',
  AUTH: '(auth)',
  ADMIN: '(admin)',
} as const;

// WebSocket message types
export const WS_MESSAGE_TYPES = {
  CHAT_JOIN: 'chat.join',
  CHAT_LEAVE: 'chat.leave',
  CHAT_MESSAGE: 'chat.message',
  CHAT_TYPING: 'chat.typing',
  CHAT_MESSAGES: 'chat.messages',
  NOTIFICATION: 'notification',
  ERROR: 'error',
} as const;

// Sort orders
export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

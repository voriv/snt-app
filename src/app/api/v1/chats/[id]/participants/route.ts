/**
 * @file src/app/api/v1/chats/[id]/participants/route.ts
 * @domain comms
 * @description API endpoints для управления участниками чата
 *
 * @route GET /api/v1/chats/:id/participants - Получить список участников чата
 * @route POST /api/v1/chats/:id/participants - Добавить участника в чат
 * @auth required
 *
 * @spec
 * - GET: Возвращает список участников чата с информацией о ролях
 * - POST: Добавляет нового участника в чат с указанием роли
 * @see docs/user-stories/US-21-07-добавление-участников-в-чат.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getContainer } from '@/di/container';
import {
  addChatParticipantSchema,
  updateParticipantRoleSchema,
  removeChatParticipantSchema
} from '@/domains/comms/comms.validators';
import { 
  ChatParticipantNotFoundError,
  ParticipantAlreadyExistsError,
  CannotAddParticipantError,
  ForbiddenError,
  BadRequestError,
  InternalServerError
} from '@/domains/comms/comms.errors';
import { ZodError } from 'zod';

/**
 * GET /api/v1/chats/[id]/participants
 * Получить список участников группового чата
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { id: chatId } = await params;
    const commsService = getContainer().getCommsService();

    // Получаем список участников
    const participants = await commsService.getChatParticipants(chatId, session.user.id);

    return NextResponse.json({
      success: true,
      data: participants,
    });
  } catch (error) {
    if (error instanceof ChatParticipantNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'CHAT_NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      );
    }

    if (error instanceof BadRequestError) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: error.message } },
        { status: 400 }
      );
    }

    console.error('Error in GET /api/v1/chats/[id]/participants:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/chats/[id]/participants
 * Добавить участника в чат
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { id: chatId } = await params;
    const body = await request.json();

    // Валидация входных данных
    const validated = addChatParticipantSchema.parse(body);

    const commsService = getContainer().getCommsService();

    const result = await commsService.addParticipantToChat(
      chatId,
      session.user.id,
      validated.userId,
      validated.role
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors.map(e => e.message).join(', '),
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof ParticipantAlreadyExistsError) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_EXISTS', message: error.message } },
        { status: 409 }
      );
    }

    if (error instanceof CannotAddParticipantError) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      );
    }

    if (error instanceof ChatParticipantNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      );
    }

    console.error('Error in POST /api/v1/chats/[id]/participants:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/v1/chats/[id]/participants/[userId]
 * Изменить роль участника в чате
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { id: chatId, userId } = await params;
    const body = await request.json();

    // Валидация входных данных
    const validated = updateParticipantRoleSchema.parse(body);

    const commsService = getContainer().getCommsService();

    const result = await commsService.updateParticipantRole(
      chatId,
      session.user.id,
      userId,
      validated.role
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.errors.map(e => e.message).join(', '),
          },
        },
        { status: 400 }
      );
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      );
    }

    if (error instanceof ChatParticipantNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    console.error('Error in PATCH /api/v1/chats/[id]/participants/[userId]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/chats/[id]/participants/[userId]
 * Удалить участника из чата
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Необходима авторизация' } },
        { status: 401 }
      );
    }

    const { id: chatId, userId } = await params;
    const commsService = getContainer().getCommsService();

    await commsService.removeParticipantFromChat(chatId, session.user.id, userId);

    return NextResponse.json({
      success: true,
      data: { message: 'Участник успешно удален из чата' },
    });
  } catch (error) {
    if (error instanceof ForbiddenError) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: error.message } },
        { status: 403 }
      );
    }

    if (error instanceof ChatParticipantNotFoundError) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: error.message } },
        { status: 404 }
      );
    }

    console.error('Error in DELETE /api/v1/chats/[id]/participants/[userId]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } },
      { status: 500 }
    );
  }
}

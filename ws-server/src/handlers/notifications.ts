import { WebSocket } from 'ws';
import { PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class NotificationHandler {
  constructor() {}

  async createNotification(userId: string, type: Prisma.NotificationType, title: string, content?: string, link?: string): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        link,
      },
    });
  }

  async createChatNotification(chatUserId: string, senderUserId: string, chatId: string): Promise<void> {
    const sender = await prisma.user.findUnique({
      where: { id: senderUserId },
      select: { name: true, email: true },
    });

    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { participants: true },
    });

    const senderName = sender?.name || sender?.email || 'Unknown';

    await this.createNotification(
      chatUserId,
      Prisma.NotificationType.CHAT_MESSAGE,
      `${senderName} sent you a message`,
      'You have a new message in your chat',
      `/chat/${chatId}`
    );
  }

  async createAnnouncementNotification(announcedUserId: string, announcementTitle: string): Promise<void> {
    await this.createNotification(
      announcedUserId,
      Prisma.NotificationType.ANNOUNCEMENT,
      'New Announcement',
      announcementTitle,
      `/announcements/`
    );
  }

  async createVoteNotification(voterUserId: string, voteTitle: string): Promise<void> {
    await this.createNotification(
      voterUserId,
      Prisma.NotificationType.VOTE_STARTED,
      'New Vote Available',
      voteTitle,
      `/votes/`
    );
  }

  async createVoteEndedNotification(voteId: string, voteTitle: string): Promise<void> {
    const voters = await prisma.voteResponse.findMany({
      where: { voteId },
      select: { userId: true },
      distinct: ['userId'],
    });

    await prisma.$transaction(
      voters.map(v =>
        this.createNotification(
          v.userId,
          Prisma.NotificationType.VOTE_ENDED,
          `Vote Result: ${voteTitle}`,
          'The vote has ended. Check the results.',
          `/votes/${voteId}`
        )
      )
    );
  }

  async createChargeNotification(memberId: string, chargeAmount: string): Promise<void> {
    await this.createNotification(
      memberId,
      Prisma.NotificationType.CHARGE_CREATED,
      'New Charge Applied',
      `A charge of ${chargeAmount} has been applied to your account`,
      `/accounting/charges`
    );
  }

  async createPaymentNotification(memberId: string, paymentAmount: string): Promise<void> {
    await this.createNotification(
      memberId,
      Prisma.NotificationType.PAYMENT_RECEIVED,
      'Payment Received',
      `A payment of ${paymentAmount} has been recorded`,
      `/accounting/payments`
    );
  }

  async createDocumentNotification(uploadedById: string, documentTitle: string): Promise<void> {
    await this.createNotification(
      uploadedById,
      Prisma.NotificationType.DOCUMENT_UPLOADED,
      'Document Uploaded',
      documentTitle,
      `/documents/`
    );
  }
}

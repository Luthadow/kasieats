import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PushPayload {
  userId: string;
  title: string;
  message: string;
  data?: Record<string, string>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(private readonly prisma: PrismaService) {}

  async sendToUser(payload: PushPayload) {
    const tokens = await this.prisma.devicePushToken.findMany({
      where: { user_id: payload.userId },
      select: { token: true },
    });

    if (tokens.length === 0) {
      return;
    }

    const messages = tokens.map(({ token }) => ({
      to: token,
      sound: 'default' as const,
      title: payload.title,
      body: payload.message,
      data: payload.data,
    }));

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        const body = await response.text();
        this.logger.warn(`Expo push failed (${response.status}): ${body}`);
      }
    } catch (error) {
      this.logger.warn(
        `Expo push error: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}

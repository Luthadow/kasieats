import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateSupportTicketDto, UpdateSupportTicketDto } from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async createTicket(userId: string, dto: CreateSupportTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        user_id: userId,
        order_id: dto.orderId,
        subject: dto.subject,
        description: dto.description,
        category: dto.category,
        status: 'open',
        priority: dto.orderId ? 'high' : 'medium',
      },
    });

    return {
      success: true,
      data: this.formatTicket(ticket),
    };
  }

  async listMyTickets(userId: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 30,
    });

    return {
      success: true,
      data: tickets.map((t) => this.formatTicket(t)),
    };
  }

  async listAllTickets(status?: string) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: status && status !== 'all' ? { status } : {},
      orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
      take: 50,
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: tickets.map((t) => t.user_id) } },
      include: { customer: true, vendor: true, driver: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      success: true,
      data: tickets.map((t) => {
        const user = userMap.get(t.user_id);
        return {
          ...this.formatTicket(t),
          userPhone: user?.phone,
          userType: user?.user_type,
          userName:
            user?.customer
              ? `${user.customer.first_name} ${user.customer.last_name}`
              : user?.vendor?.store_name ??
                (user?.driver ? `${user.driver.first_name} ${user.driver.last_name}` : user?.phone),
        };
      }),
    };
  }

  async updateTicket(ticketId: string, adminUserId: string, dto: UpdateSupportTicketDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const now = new Date();
    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.resolutionNotes !== undefined ? { resolution_notes: dto.resolutionNotes } : {}),
        ...(dto.status === 'in_progress' && !ticket.responded_at ? { responded_at: now } : {}),
        ...(dto.status === 'resolved' ? { resolved_at: now, assigned_to_admin_id: adminUserId } : {}),
        ...(dto.status === 'closed' ? { closed_at: now } : {}),
      },
    });

    if (dto.status === 'resolved' || dto.status === 'closed') {
      await this.notifications.notify({
        userId: ticket.user_id,
        title: 'Support ticket updated',
        message: dto.resolutionNotes ?? `Your ticket "${ticket.subject}" has been ${dto.status}.`,
        notificationType: 'support_update',
      });
    }

    return { success: true, data: this.formatTicket(updated) };
  }

  private formatTicket(t: {
    id: string;
    subject: string;
    description: string;
    category: string;
    status: string;
    priority: string;
    order_id: string | null;
    resolution_notes: string | null;
    created_at: Date;
    resolved_at: Date | null;
  }) {
    return {
      id: t.id,
      subject: t.subject,
      description: t.description,
      category: t.category,
      status: t.status,
      priority: t.priority,
      orderId: t.order_id,
      resolutionNotes: t.resolution_notes,
      createdAt: t.created_at,
      resolvedAt: t.resolved_at,
    };
  }
}

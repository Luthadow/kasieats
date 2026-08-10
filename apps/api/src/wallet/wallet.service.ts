import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequestWithdrawalDto } from './dto/wallet.dto';

const MIN_WITHDRAWAL_ZAR = 50;

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWallet(userId: string) {
    const existing = await this.prisma.wallet.findUnique({ where: { user_id: userId } });
    if (existing) return existing;

    return this.prisma.wallet.create({
      data: { user_id: userId },
    });
  }

  async getSummary(userId: string) {
    const wallet = await this.getOrCreateWallet(userId);

    const recent = await this.prisma.transaction.findMany({
      where: {
        OR: [{ to_user_id: userId }, { from_user_id: userId }],
      },
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    return {
      success: true,
      data: {
        balance: Number(wallet.balance),
        pendingBalance: Number(wallet.pending_balance),
        currency: wallet.currency,
        lastTransactionAt: wallet.last_transaction_at,
        recentTransactions: recent.map((tx) => this.formatTransaction(tx, userId)),
      },
    };
  }

  async listTransactions(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        OR: [{ to_user_id: userId }, { from_user_id: userId }],
      },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: transactions.map((tx) => this.formatTransaction(tx, userId)),
    };
  }

  async creditForOrderPayout(input: {
    userId: string;
    amount: number;
    orderId: string;
    description: string;
    transactionType: 'vendor_payout' | 'driver_earning';
  }) {
    if (input.amount <= 0) return null;

    const wallet = await this.getOrCreateWallet(input.userId);
    const reference = `KE-${input.transactionType.toUpperCase()}-${input.orderId.slice(-8)}`;

    const existing = await this.prisma.transaction.findUnique({
      where: { reference_code: reference },
    });
    if (existing) return existing;

    return this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: input.amount },
          last_transaction_at: new Date(),
        },
      });

      return tx.transaction.create({
        data: {
          order_id: input.orderId,
          to_user_id: input.userId,
          to_wallet_id: wallet.id,
          amount: input.amount,
          transaction_type: input.transactionType,
          status: 'completed',
          reference_code: reference,
          description: input.description,
          completed_at: new Date(),
        },
      });
    });
  }

  async requestWithdrawal(userId: string, dto: RequestWithdrawalDto) {
    if (dto.amount < MIN_WITHDRAWAL_ZAR) {
      throw new BadRequestException(`Minimum withdrawal is R${MIN_WITHDRAWAL_ZAR}`);
    }

    const wallet = await this.getOrCreateWallet(userId);

    if (Number(wallet.balance) < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const reference = `KE-WD-${Date.now()}`;

    const transaction = await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: dto.amount },
          pending_balance: { increment: dto.amount },
          last_transaction_at: new Date(),
        },
      });

      return tx.transaction.create({
        data: {
          from_user_id: userId,
          from_wallet_id: wallet.id,
          amount: dto.amount,
          transaction_type: 'withdrawal',
          status: 'pending',
          reference_code: reference,
          description: 'Withdrawal request',
          metadata: {
            bankAccountHolder: dto.bankAccountHolder,
            bankAccountNumber: dto.bankAccountNumber,
            bankCode: dto.bankCode,
          },
        },
      });
    });

    return {
      success: true,
      data: this.formatTransaction(transaction, userId),
    };
  }

  async listPendingWithdrawals() {
    const withdrawals = await this.prisma.transaction.findMany({
      where: { transaction_type: 'withdrawal', status: 'pending' },
      orderBy: { created_at: 'asc' },
      take: 50,
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: withdrawals.map((w) => w.from_user_id!).filter(Boolean) } },
      include: { vendor: true, driver: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return {
      success: true,
      data: withdrawals.map((tx) => {
        const user = tx.from_user_id ? userMap.get(tx.from_user_id) : null;
        return {
          id: tx.id,
          amount: Number(tx.amount),
          referenceCode: tx.reference_code,
          createdAt: tx.created_at,
          userType: user?.user_type,
          name:
            user?.vendor?.store_name ??
            (user?.driver ? `${user.driver.first_name} ${user.driver.last_name}` : user?.phone),
          metadata: tx.metadata,
        };
      }),
    };
  }

  async approveWithdrawal(withdrawalId: string, adminUserId: string) {
    const withdrawal = await this.prisma.transaction.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal || withdrawal.transaction_type !== 'withdrawal') {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Withdrawal already processed');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { user_id: withdrawal.from_user_id! },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: withdrawalId },
        data: { status: 'completed', completed_at: new Date() },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { pending_balance: { decrement: Number(withdrawal.amount) } },
      }),
      this.prisma.auditLog.create({
        data: {
          user_id: adminUserId,
          user_type: 'admin',
          action: 'approve_withdrawal',
          table_name: 'transactions',
          record_id: withdrawalId,
        },
      }),
    ]);

    return { success: true, data: { id: withdrawalId, status: 'completed' } };
  }

  async rejectWithdrawal(withdrawalId: string, adminUserId: string, reason?: string) {
    const withdrawal = await this.prisma.transaction.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal || withdrawal.transaction_type !== 'withdrawal') {
      throw new NotFoundException('Withdrawal not found');
    }

    if (withdrawal.status !== 'pending') {
      throw new BadRequestException('Withdrawal already processed');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { user_id: withdrawal.from_user_id! },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: withdrawalId },
        data: {
          status: 'rejected',
          description: reason ?? 'Withdrawal rejected',
          completed_at: new Date(),
        },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: Number(withdrawal.amount) },
          pending_balance: { decrement: Number(withdrawal.amount) },
        },
      }),
      this.prisma.auditLog.create({
        data: {
          user_id: adminUserId,
          user_type: 'admin',
          action: 'reject_withdrawal',
          table_name: 'transactions',
          record_id: withdrawalId,
          reason,
        },
      }),
    ]);

    return { success: true, data: { id: withdrawalId, status: 'rejected' } };
  }

  private formatTransaction(
    tx: {
      id: string;
      amount: { toString(): string } | number;
      transaction_type: string;
      status: string;
      description: string | null;
      reference_code: string | null;
      created_at: Date;
      completed_at: Date | null;
      to_user_id: string | null;
      from_user_id: string | null;
    },
    userId: string,
  ) {
    const amount = Number(tx.amount);
    const isCredit = tx.to_user_id === userId;

    return {
      id: tx.id,
      type: tx.transaction_type,
      status: tx.status,
      amount,
      direction: isCredit ? 'credit' : 'debit',
      description: tx.description,
      referenceCode: tx.reference_code,
      createdAt: tx.created_at,
      completedAt: tx.completed_at,
    };
  }
}

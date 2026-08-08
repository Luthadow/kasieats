import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto, ValidatePromoDto } from './dto/promotion.dto';

export interface PromoValidationResult {
  code: string;
  name: string;
  discountAmount: number;
  discountType: string;
}

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async validateForUser(userId: string, dto: ValidatePromoDto) {
    const customer = await this.prisma.customer.findUnique({ where: { user_id: userId } });
    return this.validate(dto, customer?.id);
  }

  async validate(dto: ValidatePromoDto, customerId?: string): Promise<PromoValidationResult> {
    const promotion = await this.findActivePromotion(dto.code);

    if (dto.subtotal < Number(promotion.min_order_amount)) {
      throw new BadRequestException(
        `Minimum order amount is R${Number(promotion.min_order_amount).toFixed(2)}`,
      );
    }

    if (
      promotion.applicable_vendor_id &&
      promotion.applicable_vendor_id !== dto.vendorId
    ) {
      throw new BadRequestException('Promotion not valid for this vendor');
    }

    if (customerId && promotion.max_usage_per_customer > 0) {
      const used = await this.prisma.order.count({
        where: {
          customer_id: customerId,
          promotion_code: promotion.code,
          status: { notIn: ['cancelled', 'rejected'] },
        },
      });
      if (used >= promotion.max_usage_per_customer) {
        throw new BadRequestException('You have already used this promotion');
      }
    }

    const discountAmount = this.calculateDiscount(
      dto.subtotal,
      promotion.discount_type,
      Number(promotion.discount_value),
      promotion.max_discount_amount ? Number(promotion.max_discount_amount) : null,
    );

    return {
      code: promotion.code,
      name: promotion.name,
      discountAmount,
      discountType: promotion.discount_type,
    };
  }

  async applyPromotionCode(
    code: string,
    vendorId: string,
    subtotal: number,
    customerId: string,
  ): Promise<PromoValidationResult> {
    return this.validate({ code, vendorId, subtotal }, customerId);
  }

  async incrementUsage(code: string) {
    await this.prisma.promotion.update({
      where: { code: code.toUpperCase() },
      data: { usage_count: { increment: 1 } },
    });
  }

  async listPromotions() {
    const promotions = await this.prisma.promotion.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: promotions.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description,
        discountType: p.discount_type,
        discountValue: Number(p.discount_value),
        minOrderAmount: Number(p.min_order_amount),
        usageCount: p.usage_count,
        isActive: p.is_active,
        startDate: p.start_date,
        endDate: p.end_date,
      })),
    };
  }

  async createPromotion(adminUserId: string, dto: CreatePromotionDto) {
    const code = dto.code.toUpperCase();

    const promotion = await this.prisma.promotion.create({
      data: {
        admin_id: adminUserId,
        code,
        name: dto.name,
        description: dto.description,
        discount_type: dto.discountType,
        discount_value: dto.discountValue,
        max_discount_amount: dto.maxDiscountAmount,
        min_order_amount: dto.minOrderAmount ?? 0,
        applicable_vendor_id: dto.applicableVendorId,
        start_date: new Date(dto.startDate),
        end_date: new Date(dto.endDate),
        is_active: true,
      },
    });

    return {
      success: true,
      data: { id: promotion.id, code: promotion.code, name: promotion.name },
    };
  }

  async deactivatePromotion(id: string) {
    const promotion = await this.prisma.promotion.update({
      where: { id },
      data: { is_active: false, ended_at: new Date() },
    });
    return { success: true, data: { id: promotion.id, isActive: promotion.is_active } };
  }

  private async findActivePromotion(code: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promotion || !promotion.is_active) {
      throw new NotFoundException('Promotion code not found');
    }

    const now = new Date();
    if (now < promotion.start_date || now > promotion.end_date) {
      throw new BadRequestException('Promotion has expired');
    }

    if (
      promotion.max_usage_per_code &&
      promotion.usage_count >= promotion.max_usage_per_code
    ) {
      throw new BadRequestException('Promotion usage limit reached');
    }

    return promotion;
  }

  private calculateDiscount(
    subtotal: number,
    discountType: string,
    discountValue: number,
    maxDiscount: number | null,
  ) {
    let discount =
      discountType === 'percentage'
        ? Math.round(subtotal * (discountValue / 100) * 100) / 100
        : discountValue;

    if (maxDiscount !== null) {
      discount = Math.min(discount, maxDiscount);
    }

    return Math.min(discount, subtotal);
  }
}

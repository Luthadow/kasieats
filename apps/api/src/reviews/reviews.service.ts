import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReview(customerUserId: string, dto: CreateReviewDto) {
    const customer = await this.prisma.customer.findUnique({
      where: { user_id: customerUserId },
    });
    if (!customer) {
      throw new ForbiddenException('Complete your profile first');
    }

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, customer_id: customer.id },
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'delivered') {
      throw new BadRequestException('You can only review delivered orders');
    }

    const existing = await this.prisma.review.findFirst({
      where: { order_id: order.id, reviewer_id: customerUserId, reviewee_type: 'vendor' },
    });
    if (existing) {
      throw new BadRequestException('You have already reviewed this order');
    }

    await this.prisma.review.create({
      data: {
        order_id: order.id,
        reviewer_id: customerUserId,
        reviewer_type: 'customer',
        reviewee_type: 'vendor',
        vendor_id: order.vendor_id,
        rating: dto.vendorRating,
        comment: dto.vendorComment ?? dto.comment,
      },
    });
    await this.applyRating('vendor', order.vendor_id, dto.vendorRating);

    if (dto.driverRating !== undefined && order.driver_id) {
      await this.prisma.review.create({
        data: {
          order_id: order.id,
          reviewer_id: customerUserId,
          reviewer_type: 'customer',
          reviewee_type: 'driver',
          driver_id: order.driver_id,
          rating: dto.driverRating,
          comment: dto.driverComment,
        },
      });
      await this.applyRating('driver', order.driver_id, dto.driverRating);
    }

    return { success: true, message: 'Review submitted' };
  }

  async getVendorReviews(vendorId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { vendor_id: vendorId, reviewee_type: 'vendor' },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    return {
      success: true,
      data: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.created_at,
      })),
    };
  }

  private async applyRating(type: 'vendor' | 'driver', id: string, rating: number) {
    if (type === 'vendor') {
      const vendor = await this.prisma.vendor.findUnique({ where: { id } });
      if (!vendor) return;
      const count = vendor.rating_count + 1;
      const average = (Number(vendor.average_rating) * vendor.rating_count + rating) / count;
      await this.prisma.vendor.update({
        where: { id },
        data: { rating_count: count, average_rating: Math.round(average * 100) / 100 },
      });
    } else {
      const driver = await this.prisma.driver.findUnique({ where: { id } });
      if (!driver) return;
      const count = driver.rating_count + 1;
      const average = (Number(driver.average_rating) * driver.rating_count + rating) / count;
      await this.prisma.driver.update({
        where: { id },
        data: { rating_count: count, average_rating: Math.round(average * 100) / 100 },
      });
    }
  }
}

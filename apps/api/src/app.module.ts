import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { VendorsModule } from './vendors/vendors.module';
import { OrdersModule } from './orders/orders.module';
import { HealthModule } from './health/health.module';
import { VendorModule } from './vendor/vendor.module';
import { DriverModule } from './driver/driver.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { SmsModule } from './sms/sms.module';
import { WalletModule } from './wallet/wallet.module';
import { CustomersModule } from './customers/customers.module';
import { PromotionsModule } from './promotions/promotions.module';
import { SupportModule } from './support/support.module';
import { RealtimeModule } from './realtime/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    RedisModule,
    PrismaModule,
    SmsModule,
    WalletModule,
    AuthModule,
    VendorsModule,
    OrdersModule,
    HealthModule,
    VendorModule,
    DriverModule,
    NotificationsModule,
    PaymentsModule,
    AdminModule,
    CustomersModule,
    PromotionsModule,
    SupportModule,
    RealtimeModule,
  ],
})
export class AppModule {}

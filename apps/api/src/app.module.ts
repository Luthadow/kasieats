import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    PrismaModule,
    SmsModule,
    AuthModule,
    VendorsModule,
    OrdersModule,
    HealthModule,
    VendorModule,
    DriverModule,
    NotificationsModule,
    PaymentsModule,
    AdminModule,
  ],
})
export class AppModule {}

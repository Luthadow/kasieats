import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  async check() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'mthura-api',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'degraded',
        service: 'mthura-api',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
      });
    }
  }
}

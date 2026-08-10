import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memory = new Map<string, string>();

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('REDIS_URL');
    if (url) {
      this.client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true });
      this.client.connect().catch((error) => {
        this.logger.warn(`Redis unavailable, using in-memory fallback: ${error.message}`);
        this.client?.disconnect();
        this.client = null;
      });
    } else {
      this.logger.warn('REDIS_URL not set — using in-memory cache (not suitable for production)');
    }
  }

  async onModuleDestroy() {
    await this.client?.quit();
  }

  async set(key: string, value: string, ttlSeconds: number) {
    if (this.client) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }
    this.memory.set(key, value);
    setTimeout(() => this.memory.delete(key), ttlSeconds * 1000).unref?.();
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      return this.client.get(key);
    }
    return this.memory.get(key) ?? null;
  }

  async del(key: string) {
    if (this.client) {
      await this.client.del(key);
      return;
    }
    this.memory.delete(key);
  }
}

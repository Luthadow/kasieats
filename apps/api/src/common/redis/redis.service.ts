import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryEntry {
  value: string;
  expiresAt?: number;
}

/**
 * Thin Redis wrapper with a graceful in-memory fallback. If REDIS_URL is not
 * configured or Redis is unreachable, all operations transparently use an
 * in-process Map so the API keeps working in development/sandbox environments.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly memory = new Map<string, MemoryEntry>();

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const url = this.configService.get<string>('REDIS_URL');

    if (!url) {
      this.logger.warn('REDIS_URL not set; using in-memory store fallback');
      return;
    }

    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
      });

      this.client.on('error', (err) => {
        this.logger.warn(`Redis unavailable, falling back to in-memory store: ${err.message}`);
      });

      this.client.on('connect', () => {
        this.logger.log('Connected to Redis');
      });
    } catch (err) {
      this.logger.warn(
        `Failed to initialise Redis, using in-memory fallback: ${(err as Error).message}`,
      );
      this.client = null;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isReady()) {
      try {
        return await this.client!.get(key);
      } catch (err) {
        this.logger.warn(`Redis get failed, using in-memory: ${(err as Error).message}`);
      }
    }
    return this.memGet(key);
  }

  async set(key: string, value: string): Promise<void> {
    if (this.isReady()) {
      try {
        await this.client!.set(key, value);
        return;
      } catch (err) {
        this.logger.warn(`Redis set failed, using in-memory: ${(err as Error).message}`);
      }
    }
    this.memory.set(key, { value });
  }

  async setex(key: string, ttlSeconds: number, value: string): Promise<void> {
    if (this.isReady()) {
      try {
        await this.client!.setex(key, ttlSeconds, value);
        return;
      } catch (err) {
        this.logger.warn(`Redis setex failed, using in-memory: ${(err as Error).message}`);
      }
    }
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    if (this.isReady()) {
      try {
        await this.client!.del(key);
        return;
      } catch (err) {
        this.logger.warn(`Redis del failed, using in-memory: ${(err as Error).message}`);
      }
    }
    this.memory.delete(key);
  }

  private isReady(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  private memGet(key: string): string | null {
    const entry = this.memory.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return null;
    }
    return entry.value;
  }
}

import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const defaultOptions = {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  lazyConnect: true,
} as const;

export class RedisManager {
  private static instance: RedisManager;
  private client: Redis | null = null;

  private constructor() {}

  public static getInstance(): RedisManager {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  public getClient(): Redis {
    if (!this.client) {
      this.client = new Redis(REDIS_URL, defaultOptions);
      this.client.on("error", (err: Error) => console.error("[Redis]", err));
      this.client.on("connect", () => console.log("[Redis] connected"));
    }
    return this.client;
  }

  public async connect(): Promise<void> {
    const client = this.getClient();
    await client.connect();
  }

  public async close(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }
}

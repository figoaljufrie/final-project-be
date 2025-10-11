// redis-client.ts
import { createClient, RedisClientType } from "redis";
import { redisConfig } from "./redis-config";

class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnected && this.client) {
      console.log("Redis already connected.");
      return;
    }

    try {
      this.client = createClient({
        socket: {
          host: redisConfig.host,
          port: redisConfig.port,
          connectTimeout: redisConfig.connectionTimeout,
          keepAlive: redisConfig.keepAlive,
          reconnectStrategy: redisConfig.retryStrategy,
        },
        ...(redisConfig.password ? { password: redisConfig.password } : {}), // Type-safe
        database: redisConfig.db,
      });

      this.client.on("error", (err) => {
        console.error("Redis Client Error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => console.log("🔄 Redis connecting..."));
      this.client.on("ready", () => {
        console.log("Redis connected successfully");
        this.isConnected = true;
      });
      this.client.on("reconnecting", () =>
        console.log("Redis reconnecting...")
      );
      this.client.on("end", () => {
        console.log("Redis connection closed");
        this.isConnected = false;
      });

      await this.client.connect();
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
      console.log("Redis disconnected");
    }
  }

  getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client is not connected");
    }
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.client || !this.isConnected) return false;
      const result = await this.client.ping();
      return result === "PONG";
    } catch (error) {
      console.error("Redis ping failed:", error);
      return false;
    }
  }
}

export const redisClient = new RedisClient();

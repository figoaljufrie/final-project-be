export interface RedisConfig {
  host: string;
  port: number;
  password?: string | undefined;
  db: number;
  connectionTimeout: number;
  keepAlive: boolean;
  retryStrategy: (retries: number, error?: Error) => number | false | Error;
}

export const redisConfig: RedisConfig = {
  host: process.env.REDISHOST || "localhost",
  port: parseInt(process.env.REDISPORT || "6379"),
  password: process.env.REDISPASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),

  connectionTimeout: 10000,
  keepAlive: true,
  retryStrategy: (retries: number, _err?: Error) =>
    Math.min(retries * 50, 2000),
};

export const cacheConfig = {
  enabled: process.env.CACHE_ENABLED === "true",
  defaultTTL: parseInt(process.env.CACHE_DEFAULT_TTL || "300"), // 5 minutes
  searchTTL: parseInt(process.env.CACHE_SEARCH_TTL || "600"), // 10 minutes
  propertyDetailsTTL: parseInt(process.env.CACHE_PROPERTY_DETAILS_TTL || "900"), // 15 minutes
  calendarTTL: parseInt(process.env.CACHE_CALENDAR_TTL || "180"), // 3 minutes
};

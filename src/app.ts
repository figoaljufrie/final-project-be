import "module-alias/register";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
import { AuthRouter } from "./modules/Account/auth/routers/auth-router";
import { OAuthRouter } from "./modules/Account/oAuth/routers/oAuth-router";
import { UserRouter } from "./modules/Account/user/routers/user-router";
import { BookingRoutes } from "./modules/booking/routers/booking.routes";
import { CronService } from "./modules/cron/services/cron.service";
import { PricingRouter } from "./modules/Inventory/pricing/router/pricing-router";
import { PropertyRouter } from "./modules/Inventory/property/router/property-router";
import { RoomRouter } from "./modules/Inventory/room/router/room-router";
import { PaymentRoutes } from "./modules/payment/routers/payment.routes";
import { ReportRoutes } from "./modules/report/routers/report.routes";
import { ReviewRoutes } from "./modules/review/routers/review.routes";
import { TenantBookingRoutes } from "./modules/tenant/tenant-booking-status/routers/tenant-booking-status.routes";
import { prisma } from "./shared/utils/prisma";
import { redisClient } from "./shared/utils/redis/redis";
import { cacheManager } from "./shared/utils/redis/cache-manager";

if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.production" });
  console.log("Using production environment variables");
} else {
  dotenv.config({ path: ".env" });
  console.log("Using local development environment variables");
}

export class App {
  private app: Application;
  private port: number;
  private cronService = CronService.getInstance();

  constructor(port?: number) {
    this.app = express();
    this.port = port ||Number(process.env.PORT || 8000);

    // CORS setup
    const corsOptions = {
      origin: 
      process.env.NODE_ENV === "production" ?
      "https://final-project-fe-ebon.vercel.app/": "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    };
    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.use(cookieParser());

    this.initializeRoutes();
    this.setupGracefulShutdown();
  }

  public initializeRoutes() {
    this.app.get("/", (req, res) => {
      res.json({ message: "Nginepin API is running!" });
    });

    // ✅ Health check endpoint with Redis status
    this.app.get("/health", async (req, res) => {
      try {
        const redisHealthy = await redisClient.ping();
        const cacheStats = await cacheManager.getStats();

        res.json({
          status: "ok",
          timestamp: new Date().toISOString(),
          redis: {
            connected: redisHealthy,
            ...cacheStats,
          },
          database: "connected",
        });
      } catch (error) {
        res.status(503).json({
          status: "error",
          timestamp: new Date().toISOString(),
          redis: {
            connected: false,
          },
          error: "Service unavailable",
        });
      }
    });

    // Booking routes
    this.app.use("/api/bookings", new BookingRoutes().getRouter());

    // Tenant booking routes
    this.app.use("/api/tenant/bookings", new TenantBookingRoutes().getRouter());

    // Payment gateway route (including webhook)
    this.app.use("/api/payment", new PaymentRoutes().router);

    // Review routes
    this.app.use("/api/reviews", new ReviewRoutes().getRouter());

    // Report routes
    this.app.use("/api/reports", new ReportRoutes().getRouter());

    // User & Auth
    this.app.use("/api", new UserRouter().getRouter());
    this.app.use("/api", new AuthRouter().getRouter());
    this.app.use("/api", new OAuthRouter().getRouter());

    // Property routes
    this.app.use("/api", new PropertyRouter().getRouter());

    // Room routes
    this.app.use("/api", new RoomRouter().getRouter());

    // Pricing routes
    this.app.use("/api", new PricingRouter().getRouter());
  }

  private setupGracefulShutdown() {
    // Graceful shutdown for SIGINT (Ctrl+C)
    process.on("SIGINT", async () => {
      console.log("\n🔄 Shutting down server gracefully...");
      await this.shutdown();
    });

    // Graceful shutdown for SIGTERM (deployment/restart)
    process.on("SIGTERM", async () => {
      console.log("\n🔄 Shutting down server gracefully...");
      await this.shutdown();
    });
  }

  private async shutdown() {
    try {
      this.cronService.stopAllTasks();

      await redisClient.disconnect();

      await prisma.$disconnect();

      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  }

  public async listen() {
    try {
      await redisClient.connect();
      console.log("Redis connected successfully");

      this.app.listen(this.port, () => {
        console.log(`Server is running on http://localhost:${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        this.startCronJobs();
      });
    } catch (error) {
      console.error("Failed to start server:", error);

      if (process.env.CACHE_ENABLED === "true") {
        console.warn("⚠️  Server will continue without caching");

        this.app.listen(this.port, () => {
          console.log(
            `🚀 Server is running on http://localhost:${this.port} (without cache)`
          );
          this.startCronJobs();
        });
      } else {
        console.error("❌ Cannot start server");
        process.exit(1);
      }
    }
  }

  // Start automatic cron jobs
  private startCronJobs() {
    // Auto-cancel expired bookings every 5 minutes (only for manual transfer bookings)
    setInterval(
      async () => {
        try {
          await this.cronService.triggerAutoCancelExpiredBookings();
        } catch (error) {
          console.error("Error in auto-cancel cron job:", error);
        }
      },
      300000 // Every 5 minutes
    );
  }
}

const app = new App();
app.listen();

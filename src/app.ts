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
dotenv.config();

export class App {
  private app: Application;
  private port: number;
  private cronService = CronService.getInstance();

  constructor(port: number = 8000) {
    this.app = express();
    this.port = port;

    //cors - setup:
    const corsOptions = {
      origin: "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      credentials: true,
    };
    this.app.use(cors(corsOptions));
    this.app.use(express.json());

    this.initializeRoutes();
    this.setupGracefulShutdown();
  }

  public initializeRoutes() {
    this.app.get("/", (req, res) => {
      res.json({ message: "Nginepin API is running!" });
    });

    // booking routes
    this.app.use("/api/bookings", new BookingRoutes().getRouter());

    // tenant booking routes
    this.app.use("/api/tenant/bookings", new TenantBookingRoutes().getRouter());

    // payment gateway route (including webhook)
    this.app.use("/api/payment", new PaymentRoutes().router);

    // review routes
    this.app.use("/api/reviews", new ReviewRoutes().getRouter());

    // report routes
    this.app.use("/api/reports", new ReportRoutes().getRouter());

    //User & Auth:
    this.app.use("/api", new UserRouter().getRouter());
    this.app.use("/api", new AuthRouter().getRouter());

    this.app.use("/api", new OAuthRouter().getRouter());

    //property routes:
    this.app.use("/api", new PropertyRouter().getRouter());

    //room Routes:
    this.app.use("/api", new RoomRouter().getRouter());

    //pricing Routes:
    this.app.use("/api", new PricingRouter().getRouter());
  }

  // cron service setup for testing purpose
  private setupGracefulShutdown() {
    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("Shutting down server...");
      this.cronService.stopAllTasks();
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("Shutting down server...");
      this.cronService.stopAllTasks();
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
      this.startCronJobs();
    });
  }

  // Start automatic cron jobs
  private startCronJobs() {
    console.log("Starting automatic cron jobs...");

    // Auto-cancel expired bookings every minute
    setInterval(async () => {
      try {
        await this.cronService.triggerAutoCancelExpiredBookings();
      } catch (error) {
        console.error("Error in auto-cancel cron job:", error);
      }
    }, 60000); // Every minute

    console.log("Cron jobs started successfully");
  }
}

const app = new App();
app.listen();

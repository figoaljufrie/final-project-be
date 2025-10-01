import dotenv from "dotenv";
dotenv.config();
import express, { Application } from "express";
import cors from "cors";
import { UserRouter } from "./modules/user/routers/user-router";
import { AuthRouter } from "./modules/auth/routers/auth-router";
import { BookingRoutes } from "./modules/booking/routers/booking.routes";
import { CronService } from './modules/cron/services/cron.service';
import { OAuthRouter } from "./modules/oAuth/routers/oAuth-router";
import { TenantBookingRoutes } from "./modules/tenant/tenant-booking-status/routers/tenant-booking-status.routes";
import { PaymentRoutes } from "./modules/payment/routers/payment.routes";
import { ReviewRoutes } from "./modules/review/routers/review.routes";
import { ReportRoutes } from './modules/report/routers/report.routes';
import { prisma } from "./shared/utils/prisma";

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

    this.app.use("/api", new OAuthRouter().getRouter())

  }

  // cron service setup for testing purpose
  private setupGracefulShutdown() {
    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log('Shutting down server...');
      this.cronService.stopAllTasks();
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log('Shutting down server...');
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
    console.log('Starting automatic cron jobs...');
    
    // Auto-cancel expired bookings every minute
    setInterval(async () => {
      try {
        await this.cronService.triggerAutoCancelExpiredBookings();
      } catch (error) {
        console.error('Error in auto-cancel cron job:', error);
      }
    }, 60000); // Every minute

    console.log('Cron jobs started successfully');
  }
}

const app = new App();
app.listen();
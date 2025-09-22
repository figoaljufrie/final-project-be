import dotenv from "dotenv";
dotenv.config();
import express, { Application } from "express";
import cors from "cors";
import { UserRouter } from "./modules/user/routers/user-router";
import { AuthRouter } from "./modules/auth/routers/auth-router";
import { BookingRoutes } from "./modules/booking/routers/booking.routes";
import { CronService } from './shared/cron/cron.service';
import { CronRoutes } from './shared/cron/cron.routes';
import { OAuthRouter } from "./modules/oAuth/routers/oAuth-router";


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

    // cron routes
    this.app.use("/api/cron", new CronRoutes().getRouter());
    this.app.get("/");

    // booking routes
    const bookingRoutes = new BookingRoutes();
    this.app.use("/api/bookings", bookingRoutes.getRouter());

    //User & Auth:
    this.app.use("/api", new UserRouter().getRouter());
    this.app.use("/api", new AuthRouter().getRouter());
    this.app.use("/api", new OAuthRouter().getRouter())

  }

  // cron service setup for testing purpose
  private setupGracefulShutdown() {
    // Graceful shutdown
    process.on("SIGINT", () => {
      console.log('Shutting down server...');
      this.cronService.stopAllTasks();
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log('Shutting down server...');
      this.cronService.stopAllTasks();
      process.exit(0);
    });

    this.app.use("/api", new OAuthRouter().getRouter());

  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }
}

const app = new App();
app.listen();
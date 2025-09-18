import dotenv from "dotenv";
dotenv.config();
import express, { Application } from "express";
import cors from "cors";

import { BookingRoutes } from "./modules/booking/routers/booking.routes";

export class App {
  private app: Application;
  private port: number;

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
  }

  public initializeRoutes() {
    this.app.get("/")

    // booking routes
    const bookingRoutes = new BookingRoutes()
    this.app.use("/api/bookings", bookingRoutes.getRouter())
  }

  public listen() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on http://localhost:${this.port}`);
    });
  }
}

const app = new App();
app.listen();
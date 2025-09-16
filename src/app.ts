import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { BookingController } from "./modules/booking/booking.controller";

const app = express();
const port = 8000;

const bookingController = new BookingController();

// Middleware
app.use(express.json());

// HANYA 1 ROUTE SIMPLE
app.get("/", (req, res) => {
  res.json({ 
    message: "Property Rental API is running!",
    endpoints: {
      health: "/",
      bookings: "/api/bookings"
    }
  });
});

// ========== BOOKING ENDPOINTS ==========

// POST /api/bookings - Create booking
app.post("/api/bookings", bookingController.createBooking);

// GET /api/bookings - Get user bookings  
app.get("/api/bookings", bookingController.getUserBookings);

// GET /api/bookings/:bookingId - Get booking details
app.get("/api/bookings/:bookingId", bookingController.getBookingDetails);

// PUT /api/bookings/:bookingId/cancel - Cancel booking
app.put("/api/bookings/:bookingId/cancel", bookingController.cancelBooking);

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
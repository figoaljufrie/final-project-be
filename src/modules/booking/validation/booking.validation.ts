import { body, param, query } from 'express-validator';

export class BookingValidation {
  
  // Validation untuk create booking
  static createBooking = [
    body('userId')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    
    body('roomId')
      .isInt({ min: 1 })
      .withMessage('Room ID must be a positive integer'),
    
    body('checkIn')
      .isISO8601()
      .withMessage('Check-in date must be a valid date (YYYY-MM-DD)')
      .custom((value) => {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (date < today) {
          throw new Error('Check-in date cannot be in the past');
        }
        return true;
      }),
    
    body('checkOut')
      .isISO8601()
      .withMessage('Check-out date must be a valid date (YYYY-MM-DD)')
      .custom((value, { req }) => {
        const checkOut = new Date(value);
        const checkIn = new Date(req.body.checkIn);
        if (checkOut <= checkIn) {
          throw new Error('Check-out date must be after check-in date');
        }
        return true;
      }),
    
    body('totalGuests')
      .isInt({ min: 1, max: 20 })
      .withMessage('Total guests must be between 1 and 20'),
    
    body('unitCount')
      .isInt({ min: 1, max: 10 })
      .withMessage('Unit count must be between 1 and 10'),
    
    body('notes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Notes cannot exceed 500 characters')
  ];

  // Validation untuk booking ID parameter
  static bookingIdParam = [
    param('bookingId')
      .isInt({ min: 1 })
      .withMessage('Booking ID must be a positive integer')
  ];

  // Validation untuk cancel booking
  static cancelBooking = [
    ...BookingValidation.bookingIdParam,
    body('userId')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    body('cancelReason')
      .notEmpty()
      .withMessage('Cancel reason is required')
      .isLength({ min: 5, max: 255 })
      .withMessage('Cancel reason must be between 5 and 255 characters')
  ];

  // Validation untuk get bookings query
  static getBookingsQuery = [
    query('userId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('status')
      .optional()
      .isIn([
        'waiting_for_payment',
        'waiting_for_confirmation', 
        'confirmed',
        'cancelled',
        'expired',
        'completed',
        'rejected'
      ])
      .withMessage('Invalid booking status'),
    
    query('bookingNo')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Booking number must be between 3 and 50 characters'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
  ];

  // Validation untuk get booking details
  static getBookingDetails = [
    ...BookingValidation.bookingIdParam,
    query('userId')
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer')
  ];
}
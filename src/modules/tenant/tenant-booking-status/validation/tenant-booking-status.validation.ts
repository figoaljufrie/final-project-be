import { body, param, query } from 'express-validator';
import { $Enums } from '../../../../generated/prisma';

export class TenantBookingValidation {
  
  // Validation untuk get tenant bookings
  static getTenantBookings = [
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

  // Validation untuk booking ID parameter
  static bookingIdParam = [
    param('bookingId')
      .isInt({ min: 1 })
      .withMessage('Booking ID must be a positive integer')
  ];

  // Validation untuk confirm payment
  static confirmPayment = [
    param('bookingId')
      .isInt({ min: 1 })
      .withMessage('Booking ID must be a positive integer'),

    body('confirmationNotes')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Confirmation notes cannot exceed 500 characters')
  ];

  // Validation untuk reject payment
  static rejectPayment = [
    param('bookingId')
      .isInt({ min: 1 })
      .withMessage('Booking ID must be a positive integer'),

    body('rejectionReason')
      .notEmpty()
      .withMessage('Rejection reason is required')
      .isLength({ max: 500 })
      .withMessage('Rejection reason cannot exceed 500 characters')
  ];

  // Validation untuk cancel user order
  static cancelUserOrder = [
    param('bookingId')
      .isInt({ min: 1 })
      .withMessage('Booking ID must be a positive integer'),

    body('cancelReason')
      .notEmpty()
      .withMessage('Cancel reason is required')
      .isLength({ max: 500 })
      .withMessage('Cancel reason cannot exceed 500 characters')
  ];

  // Validation untuk send reminder
  static sendReminder = [
    param('bookingId')
      .isInt({ min: 1 })
      .withMessage('Booking ID must be a positive integer'),

    body('reminderType')
      .notEmpty()
      .withMessage('Reminder type is required')
      .isIn(['payment', 'checkin'])
      .withMessage('Reminder type must be either payment or checkin')
  ];
}
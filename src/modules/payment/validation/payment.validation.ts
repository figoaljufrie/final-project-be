import { body, param } from 'express-validator';

export class PaymentValidation {
  static createPayment = [
    body('bookingId')
      .isInt({ min: 1 })
      .withMessage('Booking ID must be a positive integer'),
    
    body('bookingNo')
      .notEmpty()
      .withMessage('Booking number is required'),
    
    body('totalAmount')
      .isInt({ min: 1 })
      .withMessage('Total amount must be a positive integer'),
    
    body('userEmail')
      .isEmail()
      .withMessage('Valid email is required'),
    
    body('userName')
      .notEmpty()
      .withMessage('User name is required'),
  ];

  static checkPaymentStatus = [
    param('orderId')
      .notEmpty()
      .withMessage('Order ID is required'),
  ];
}

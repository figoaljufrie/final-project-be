import { body, param, query, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

export class ReviewValidation {
  
  // ============ REVIEW CREATION VALIDATION ============
  
  static createReview: ValidationChain[] = [
    body('bookingId')
      .isInt({ min: 1 })
      .withMessage('Booking ID must be a positive integer'),
    
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    
    body('comment')
      .optional()
      .isString()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Comment must be between 10 and 1000 characters')
      .trim(),
  ];

  // ============ REVIEW REPLY VALIDATION ============
  
  static createReviewReply: ValidationChain[] = [
    param('reviewId')
      .isInt({ min: 1 })
      .withMessage('Review ID must be a positive integer'),
    
    body('content')
      .isString()
      .isLength({ min: 10, max: 500 })
      .withMessage('Content must be between 10 and 500 characters')
      .trim(),
  ];

  // ============ REVIEW QUERY VALIDATION ============
  
  static getReviews: ValidationChain[] = [
    query('propertyId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Property ID must be a positive integer'),
    
    query('userId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('User ID must be a positive integer'),
    
    query('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    
    query('hasComment')
      .optional()
      .isBoolean()
      .withMessage('hasComment must be a boolean'),
    
    query('hasReply')
      .optional()
      .isBoolean()
      .withMessage('hasReply must be a boolean'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'rating'])
      .withMessage('Sort by must be either createdAt or rating'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc'),
  ];

  // ============ REVIEW ID PARAMETER VALIDATION ============
  
  static reviewIdParam: ValidationChain[] = [
    param('reviewId')
      .isInt({ min: 1 })
      .withMessage('Review ID must be a positive integer'),
  ];

  // ============ PROPERTY ID PARAMETER VALIDATION ============
  
  static propertyIdParam: ValidationChain[] = [
    param('propertyId')
      .isInt({ min: 1 })
      .withMessage('Property ID must be a positive integer'),
  ];

  // ============ USER REVIEWS VALIDATION ============
  
  static getUserReviews: ValidationChain[] = [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'rating'])
      .withMessage('Sort by must be either createdAt or rating'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc'),
  ];

  // ============ PROPERTY REVIEWS VALIDATION ============
  
  static getPropertyReviews: ValidationChain[] = [
    param('propertyId')
      .isInt({ min: 1 })
      .withMessage('Property ID must be a positive integer'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('sortBy')
      .optional()
      .isIn(['createdAt', 'rating'])
      .withMessage('Sort by must be either createdAt or rating'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc'),
  ];

  // ============ REVIEW ELIGIBILITY VALIDATION ============
  
  static checkReviewEligibility: ValidationChain[] = [
    param('bookingId')
      .isInt({ min: 1 })
      .withMessage('Booking ID must be a positive integer'),
  ];

  // ============ REPLY ELIGIBILITY VALIDATION ============
  
  static checkReplyEligibility: ValidationChain[] = [
    param('reviewId')
      .isInt({ min: 1 })
      .withMessage('Review ID must be a positive integer'),
  ];

  // ============ VALIDATION RESULT HANDLER ============
  
  static handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }
    next();
  };

  // ============ CUSTOM VALIDATION METHODS ============
  
  static validateReviewEligibility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingId } = req.params;
      const userId = (req as any).user.id;
      
      // This will be implemented in the service layer
      // For now, just pass through
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error validating review eligibility',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  static validateReplyEligibility = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reviewId } = req.params;
      const tenantId = (req as any).user.id;
      
      // This will be implemented in the service layer
      // For now, just pass through
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error validating reply eligibility',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

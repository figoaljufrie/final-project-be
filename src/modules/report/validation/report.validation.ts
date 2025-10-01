import { body, query } from 'express-validator';

export class ReportValidation {
  static getSalesReport = [
    query('propertyId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Property ID must be a positive integer'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    
    query('sortBy')
      .optional()
      .isIn(['date', 'totalSales'])
      .withMessage('Sort by must be either date or totalSales'),
    
    query('sortOrder')
      .optional()
      .isIn(['asc', 'desc'])
      .withMessage('Sort order must be either asc or desc'),
    
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ];

  static getPropertyReport = [
    query('propertyId')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Property ID must be a positive integer'),
    
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ];
}
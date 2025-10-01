import { Router } from 'express';
import { PrismaClient } from '../../../generated/prisma';
import { ReviewController } from '../controllers/review.controller';
import { ReviewValidation } from '../validation/review.validation';
import { AuthMiddleware } from '../../../shared/middleware/auth-middleware';
import { RBACMiddleware } from '../../../shared/middleware/rbac-middleware';
import { $Enums } from '../../../generated/prisma';

export class ReviewRoutes {
  private router: Router;
  private reviewController: ReviewController;

  constructor() {
    this.router = Router();
    this.reviewController = new ReviewController(new PrismaClient());
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // ============ REVIEW CREATION (USER ONLY) ============
    
    this.router.post(
      '/',
      new AuthMiddleware().authenticate,
      new RBACMiddleware().checkRole([$Enums.UserRole.user]),
      ReviewValidation.createReview,
      ReviewValidation.handleValidationErrors,
      this.reviewController.createReview
    );

    // ============ REVIEW REPLY (TENANT ONLY) ============
    
    this.router.post(
      '/:reviewId/reply',
      new AuthMiddleware().authenticate,
      new RBACMiddleware().checkRole([$Enums.UserRole.tenant]),
      ReviewValidation.createReviewReply,
      ReviewValidation.handleValidationErrors,
      this.reviewController.createReviewReply
    );

    // ============ REVIEW QUERIES ============
    
    // Get all reviews (with filters) - Public endpoint
    this.router.get(
      '/',
      ReviewValidation.getReviews,
      ReviewValidation.handleValidationErrors,
      this.reviewController.getReviews
    );

    // Get review by ID - Public endpoint
    this.router.get(
      '/:reviewId',
      ReviewValidation.reviewIdParam,
      ReviewValidation.handleValidationErrors,
      this.reviewController.getReviewById
    );

    // Get user's reviews - User only
    this.router.get(
      '/user/my-reviews',
      new AuthMiddleware().authenticate,
      new RBACMiddleware().checkRole([$Enums.UserRole.user]),
      ReviewValidation.getUserReviews,
      ReviewValidation.handleValidationErrors,
      this.reviewController.getUserReviews
    );

    // Get property reviews - Public endpoint
    this.router.get(
      '/property/:propertyId',
      ReviewValidation.getPropertyReviews,
      ReviewValidation.handleValidationErrors,
      this.reviewController.getPropertyReviews
    );

    // ============ REVIEW STATISTICS ============
    
    // Get review statistics for property - Public endpoint
    this.router.get(
      '/property/:propertyId/stats',
      ReviewValidation.propertyIdParam,
      ReviewValidation.handleValidationErrors,
      this.reviewController.getReviewStats
    );

    // ============ REVIEW ELIGIBILITY ============
    
    // Check if user can review a booking - User only
    this.router.get(
      '/eligibility/booking/:bookingId',
      new AuthMiddleware().authenticate,
      new RBACMiddleware().checkRole([$Enums.UserRole.user]),
      ReviewValidation.checkReviewEligibility,
      ReviewValidation.handleValidationErrors,
      this.reviewController.checkReviewEligibility
    );

    // Check if tenant can reply to review - Tenant only
    this.router.get(
      '/:reviewId/eligibility/reply',
      new AuthMiddleware().authenticate,
      new RBACMiddleware().checkRole([$Enums.UserRole.tenant]),
      ReviewValidation.checkReplyEligibility,
      ReviewValidation.handleValidationErrors,
      this.reviewController.checkReplyEligibility
    );

    // ============ REVIEW DELETION ============
    
    // Delete user's review - User only
    this.router.delete(
      '/:reviewId',
      new AuthMiddleware().authenticate,
      new RBACMiddleware().checkRole([$Enums.UserRole.user]),
      ReviewValidation.reviewIdParam,
      ReviewValidation.handleValidationErrors,
      this.reviewController.deleteReview
    );

    // Delete tenant's reply - Tenant only
    this.router.delete(
      '/:reviewId/reply',
      new AuthMiddleware().authenticate,
      new RBACMiddleware().checkRole([$Enums.UserRole.tenant]),
      ReviewValidation.reviewIdParam,
      ReviewValidation.handleValidationErrors,
      this.reviewController.deleteReviewReply
    );

    // ============ REVIEW ANALYTICS ============
    
    // Get recent reviews - Public endpoint
    this.router.get(
      '/analytics/recent',
      this.reviewController.getRecentReviews
    );

    // Get top rated properties - Public endpoint
    this.router.get(
      '/analytics/top-rated',
      this.reviewController.getTopRatedProperties
    );

    // Get review trends for property - Public endpoint
    this.router.get(
      '/property/:propertyId/trends',
      ReviewValidation.propertyIdParam,
      ReviewValidation.handleValidationErrors,
      this.reviewController.getReviewTrends
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

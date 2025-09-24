import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ReviewService } from '../services/review.service';
import { errHandle, succHandle } from '../../../shared/helpers/err-handler';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  // ============ REVIEW CREATION ============
  
  createReview = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const userId = (req as any).user.id;
      const reviewData = req.body;

      const review = await this.reviewService.createReview(reviewData, userId);
      
      return succHandle(res, 'Review created successfully', review, 201);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // ============ REVIEW REPLY CREATION ============
  
  createReviewReply = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const tenantId = (req as any).user.id;
      const { reviewId } = req.params;
      const replyData = req.body;

      const reply = await this.reviewService.createReviewReply(
        parseInt(reviewId), 
        replyData, 
        tenantId
      );
      
      return succHandle(res, 'Review reply created successfully', reply, 201);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // ============ REVIEW QUERIES ============
  
  getReviews = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const filters = {
        propertyId: req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        rating: req.query.rating ? parseInt(req.query.rating as string) : undefined,
        hasComment: req.query.hasComment ? req.query.hasComment === 'true' : undefined,
        hasReply: req.query.hasReply ? req.query.hasReply === 'true' : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: req.query.sortBy as 'createdAt' | 'rating',
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      };

      const reviews = await this.reviewService.getReviews(filters);
      
      return succHandle(res, 'Reviews retrieved successfully', reviews);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  getReviewById = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const { reviewId } = req.params;
      const review = await this.reviewService.getReviewById(parseInt(reviewId));
      
      return succHandle(res, 'Review retrieved successfully', review);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  getUserReviews = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const userId = (req as any).user.id;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const reviews = await this.reviewService.getUserReviews(userId, page, limit);
      
      return succHandle(res, 'User reviews retrieved successfully', reviews);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  getPropertyReviews = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const { propertyId } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const reviews = await this.reviewService.getPropertyReviews(
        parseInt(propertyId), 
        page, 
        limit
      );
      
      return succHandle(res, 'Property reviews retrieved successfully', reviews);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // ============ REVIEW STATISTICS ============
  
  getReviewStats = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const { propertyId } = req.params;
      const stats = await this.reviewService.getReviewStats(parseInt(propertyId));
      
      return succHandle(res, 'Review statistics retrieved successfully', stats);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // ============ REVIEW ELIGIBILITY ============
  
  checkReviewEligibility = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const userId = (req as any).user.id;
      const { bookingId } = req.params;
      
      const eligibility = await this.reviewService.checkReviewEligibility(
        parseInt(bookingId), 
        userId
      );
      
      return succHandle(res, 'Review eligibility checked successfully', eligibility);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  checkReplyEligibility = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const tenantId = (req as any).user.id;
      const { reviewId } = req.params;
      
      const eligibility = await this.reviewService.checkReplyEligibility(
        parseInt(reviewId), 
        tenantId
      );
      
      return succHandle(res, 'Reply eligibility checked successfully', eligibility);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // ============ REVIEW DELETION ============
  
  deleteReview = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const userId = (req as any).user.id;
      const { reviewId } = req.params;
      
      await this.reviewService.deleteReview(parseInt(reviewId), userId);
      
      return succHandle(res, 'Review deleted successfully');
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  deleteReviewReply = async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return errHandle(res, 'Validation error', 400, errors.array());
      }

      const tenantId = (req as any).user.id;
      const { reviewId } = req.params;
      
      await this.reviewService.deleteReviewReply(parseInt(reviewId), tenantId);
      
      return succHandle(res, 'Review reply deleted successfully');
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // ============ REVIEW ANALYTICS ============
  
  getRecentReviews = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const reviews = await this.reviewService.getRecentReviews(limit);
      
      return succHandle(res, 'Recent reviews retrieved successfully', reviews);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  getTopRatedProperties = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const properties = await this.reviewService.getTopRatedProperties(limit);
      
      return succHandle(res, 'Top rated properties retrieved successfully', properties);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  getReviewTrends = async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      const trends = await this.reviewService.getReviewTrends(parseInt(propertyId), days);
      
      return succHandle(res, 'Review trends retrieved successfully', trends);
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };
}

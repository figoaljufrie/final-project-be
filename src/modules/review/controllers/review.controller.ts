import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '../../../generated/prisma';
import { ReviewService } from '../services/review.service';
import { errHandle } from '../../../shared/helpers/err-handler';

export class ReviewController {
  private reviewService: ReviewService;

  constructor(private prisma: PrismaClient) {
    this.reviewService = new ReviewService(prisma);
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
      
      return res.status(201).json({
        status: true,
        message: 'Review created successfully',
        data: review
      });
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
      if (!reviewId) {
        return errHandle(res, 'Review ID is required', 400);
      }
      const replyData = req.body;

      const reply = await this.reviewService.createReviewReply(
        parseInt(reviewId), 
        replyData, 
        tenantId
      );
      
      return res.status(201).json({
        status: true,
        message: 'Review reply created successfully',
        data: reply
      });
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
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        sortBy: req.query.sortBy as 'createdAt' | 'rating' | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      };

      const reviews = await this.reviewService.getReviews(filters);
      
      return res.status(200).json({
        status: true,
        message: 'Reviews retrieved successfully',
        data: reviews
      });
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
      if (!reviewId) {
        return errHandle(res, 'Review ID is required', 400);
      }
      const review = await this.reviewService.getReviewById(parseInt(reviewId));
      
      return res.status(200).json({
        status: true,
        message: 'Review retrieved successfully',
        data: review
      });
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
      
      return res.status(200).json({
        status: true,
        message: 'User reviews retrieved successfully',
        data: reviews
      });
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
      if (!propertyId) {
        return errHandle(res, 'Property ID is required', 400);
      }
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const reviews = await this.reviewService.getPropertyReviews(
        parseInt(propertyId), 
        page, 
        limit
      );
      
      return res.status(200).json({
        status: true,
        message: 'Property reviews retrieved successfully',
        data: reviews
      });
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
      if (!propertyId) {
        return errHandle(res, 'Property ID is required', 400);
      }
      const stats = await this.reviewService.getReviewStats(parseInt(propertyId));
      
      return res.status(200).json({
        status: true,
        message: 'Review statistics retrieved successfully',
        data: stats
      });
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
      if (!bookingId) {
        return errHandle(res, 'Booking ID is required', 400);
      }
      
      const eligibility = await this.reviewService.checkReviewEligibility(
        parseInt(bookingId), 
        userId
      );
      
      return res.status(200).json({
        status: true,
        message: 'Review eligibility checked successfully',
        data: eligibility
      });
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
      if (!reviewId) {
        return errHandle(res, 'Review ID is required', 400);
      }
      
      const eligibility = await this.reviewService.checkReplyEligibility(
        parseInt(reviewId), 
        tenantId
      );
      
      return res.status(200).json({
        status: true,
        message: 'Reply eligibility checked successfully',
        data: eligibility
      });
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
      if (!reviewId) {
        return errHandle(res, 'Review ID is required', 400);
      }
      
      await this.reviewService.deleteReview(parseInt(reviewId), userId);
      
      return res.status(200).json({
        status: true,
        message: 'Review deleted successfully'
      });
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
      if (!reviewId) {
        return errHandle(res, 'Review ID is required', 400);
      }
      
      await this.reviewService.deleteReviewReply(parseInt(reviewId), tenantId);
      
      return res.status(200).json({
        status: true,
        message: 'Review reply deleted successfully'
      });
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  // ============ REVIEW ANALYTICS ============
  
  getRecentReviews = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const reviews = await this.reviewService.getRecentReviews(limit);
      
      return res.status(200).json({
        status: true,
        message: 'Recent reviews retrieved successfully',
        data: reviews
      });
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  getTopRatedProperties = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const properties = await this.reviewService.getTopRatedProperties(limit);
      
      return res.status(200).json({
        status: true,
        message: 'Top rated properties retrieved successfully',
        data: properties
      });
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };

  getReviewTrends = async (req: Request, res: Response) => {
    try {
      const { propertyId } = req.params;
      if (!propertyId) {
        return errHandle(res, 'Property ID is required', 400);
      }
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      
      const trends = await this.reviewService.getReviewTrends(parseInt(propertyId), days);
      
      return res.status(200).json({
        status: true,
        message: 'Review trends retrieved successfully',
        data: trends
      });
    } catch (error: any) {
      return errHandle(res, error.message, error.status || 500);
    }
  };
}

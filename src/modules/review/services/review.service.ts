import { PrismaClient } from '../../../generated/prisma';
import { ReviewRepository } from '../repository/review.repository';
import { ApiError } from '../../../shared/utils/api-error';
import { 
  CreateReviewRequest, 
  CreateReviewReplyRequest,
  GetReviewsRequest,
  ReviewListResponseDto,
  ReviewStatsResponse,
  ReviewEligibilityResponse,
  ReplyEligibilityResponse 
} from '../dto/review.dto';
import { 
  ReviewFilter, 
  ReviewWithDetails, 
  ReviewReplyWithDetails 
} from '../types/review.types';

export class ReviewService {
  private reviewRepository: ReviewRepository;

  constructor(private prisma: PrismaClient) {
    this.reviewRepository = new ReviewRepository(this.prisma);
  }

  // ============ REVIEW CREATION ============
  
  async createReview(data: CreateReviewRequest, userId: number): Promise<ReviewWithDetails> {
    // Check review eligibility
    const eligibility = await this.reviewRepository.checkReviewEligibility(data.bookingId, userId);
    
    if (!eligibility.canReview) {
      throw new ApiError(eligibility.reason || 'Cannot create review', 400);
    }

    // PropertyId will be extracted from booking in repository
    
    // Create review
    const review = await this.reviewRepository.createReview({
      ...data,
      userId,
    });

    return review;
  }

  // ============ REVIEW REPLY CREATION ============
  
  async createReviewReply(
    reviewId: number, 
    data: CreateReviewReplyRequest, 
    tenantId: number
  ): Promise<ReviewReplyWithDetails> {
    // Check reply eligibility
    const eligibility = await this.reviewRepository.checkReplyEligibility(reviewId, tenantId);
    
    if (!eligibility.canReply) {
      throw new ApiError(eligibility.reason || 'Cannot reply to review', 400);
    }

    // Create reply
    const reply = await this.reviewRepository.createReviewReply(reviewId, {
      ...data,
      tenantId,
    });

    return reply;
  }

  // ============ REVIEW QUERIES ============
  
  async getReviews(filters: GetReviewsRequest): Promise<ReviewListResponseDto> {
    const reviewFilters: ReviewFilter = {};
    
    if (filters.propertyId) reviewFilters.propertyId = filters.propertyId;
    if (filters.userId) reviewFilters.userId = filters.userId;
    if (filters.rating) reviewFilters.rating = filters.rating;
    if (filters.hasComment !== undefined) reviewFilters.hasComment = filters.hasComment;
    if (filters.hasReply !== undefined) reviewFilters.hasReply = filters.hasReply;
    if (filters.startDate) reviewFilters.startDate = filters.startDate;
    if (filters.endDate) reviewFilters.endDate = filters.endDate;
    
    reviewFilters.page = filters.page || 1;
    reviewFilters.limit = filters.limit || 10;
    reviewFilters.sortBy = filters.sortBy || 'createdAt';
    reviewFilters.sortOrder = filters.sortOrder || 'desc';

    return await this.reviewRepository.getReviews(reviewFilters);
  }

  async getReviewById(id: number): Promise<ReviewWithDetails> {
    const review = await this.reviewRepository.getReviewById(id);
    
    if (!review) {
      throw new ApiError('Review not found', 404);
    }

    return review;
  }

  async getUserReviews(userId: number, page: number = 1, limit: number = 10): Promise<ReviewListResponseDto> {
    return await this.reviewRepository.getUserReviews(userId, page, limit);
  }

  async getPropertyReviews(propertyId: number, page: number = 1, limit: number = 10): Promise<ReviewListResponseDto> {
    return await this.reviewRepository.getPropertyReviews(propertyId, page, limit);
  }

  // ============ REVIEW STATISTICS ============
  
  async getReviewStats(propertyId: number): Promise<ReviewStatsResponse> {
    return await this.reviewRepository.getReviewStats(propertyId);
  }

  // ============ REVIEW ELIGIBILITY ============
  
  async checkReviewEligibility(bookingId: number, userId: number): Promise<ReviewEligibilityResponse> {
    return await this.reviewRepository.checkReviewEligibility(bookingId, userId);
  }

  async checkReplyEligibility(reviewId: number, tenantId: number): Promise<ReplyEligibilityResponse> {
    return await this.reviewRepository.checkReplyEligibility(reviewId, tenantId);
  }

  // ============ REVIEW DELETION ============
  
  async deleteReview(id: number, userId: number): Promise<boolean> {
    const success = await this.reviewRepository.deleteReview(id, userId);
    
    if (!success) {
      throw new ApiError('Review not found or cannot be deleted', 404);
    }

    return true;
  }

  async deleteReviewReply(reviewId: number, tenantId: number): Promise<boolean> {
    const success = await this.reviewRepository.deleteReviewReply(reviewId, tenantId);
    
    if (!success) {
      throw new ApiError('Review reply not found or cannot be deleted', 404);
    }

    return true;
  }

  // ============ BUSINESS LOGIC VALIDATIONS ============
  
  // Note: Input validation is handled by express-validator in controller layer

  // ============ REVIEW ANALYTICS ============
  
  async getRecentReviews(limit: number = 5): Promise<ReviewWithDetails[]> {
    const result = await this.reviewRepository.getReviews({
      page: 1,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    return result.reviews as ReviewWithDetails[];
  }

  async getTopRatedProperties(limit: number = 10): Promise<any[]> {
    // This would require a more complex query
    // For now, return empty array
    return [];
  }

  async getReviewTrends(propertyId: number, days: number = 30): Promise<any> {
    // This would require date-based aggregation
    // For now, return basic stats
    return await this.getReviewStats(propertyId);
  }
}

import { ReviewFilter, ReviewListResponse, ReviewStats } from '../types/review.types';

// ============ REVIEW CREATION ============

export interface CreateReviewRequest {
  bookingId: number;
  rating: number;
  comment?: string;
}

export interface CreateReviewResponse {
  id: number;
  bookingId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
  message: string;
}

// ============ REVIEW REPLY ============

export interface CreateReviewReplyRequest {
  content: string;
}

export interface CreateReviewReplyResponse {
  id: number;
  reviewId: number;
  content: string;
  createdAt: Date;
  message: string;
}

// ============ REVIEW QUERIES ============

export interface GetReviewsRequest {
  propertyId?: number;
  userId?: number;
  rating?: number;
  hasComment?: boolean;
  hasReply?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface GetUserReviewsRequest {
  userId: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface GetPropertyReviewsRequest {
  propertyId: number;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

// ============ REVIEW RESPONSES ============

export interface ReviewResponse {
  id: number;
  userId: number;
  propertyId: number;
  bookingId: number;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  user: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
  property: {
    id: number;
    name: string;
    slug: string;
  };
  booking: {
    id: number;
    bookingNo: string;
    checkIn: Date;
    checkOut: Date;
  };
  reply?: {
    id: number;
    content: string;
    createdAt: Date;
    tenant: {
      id: number;
      name: string;
      avatarUrl?: string;
    };
  };
}

export interface ReviewListResponseDto {
  reviews: ReviewResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReviewStatsResponse {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number; // rating: count
  };
}

// ============ REVIEW ELIGIBILITY ============

export interface ReviewEligibilityResponse {
  canReview: boolean;
  reason?: string;
  booking?: {
    id: number;
    bookingNo: string;
    status: string;
    checkOut: Date;
    completedAt?: Date;
  };
}

export interface ReplyEligibilityResponse {
  canReply: boolean;
  reason?: string;
  review?: {
    id: number;
    propertyId: number;
    hasReply: boolean;
  };
  property?: {
    id: number;
    tenantId: number;
  };
}

// ============ REVIEW VALIDATION ============

export interface ReviewValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ReviewValidationResult {
  isValid: boolean;
  errors: ReviewValidationError[];
}

// ============ REVIEW FILTERS ============

export interface ReviewFilterDto extends ReviewFilter {
  // Inherits all properties from ReviewFilter
}

// ============ REVIEW STATISTICS ============

export interface PropertyReviewStats {
  propertyId: number;
  propertyName: string;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number;
  };
  recentReviews: ReviewResponse[];
}

export interface UserReviewStats {
  userId: number;
  userName: string;
  totalReviews: number;
  averageRating: number;
  recentReviews: ReviewResponse[];
}

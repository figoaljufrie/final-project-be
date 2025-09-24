// ============ REVIEW TYPES ============

export interface ReviewWithDetails {
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
  reply?: ReviewReplyWithDetails;
}

export interface ReviewReplyWithDetails {
  id: number;
  reviewId: number;
  tenantId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  tenant: {
    id: number;
    name: string;
    avatarUrl?: string;
  };
}

export interface ReviewListResponse {
  reviews: ReviewWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    [key: number]: number; // rating: count
  };
}

export interface ReviewFilter {
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

// ============ REVIEW ELIGIBILITY ============

export interface ReviewEligibility {
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

export interface ReplyEligibility {
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

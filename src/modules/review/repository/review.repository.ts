import { PrismaClient } from '../../../generated/prisma';
import { BookingStatus } from '../../../generated/prisma';
import { 
  ReviewFilter, 
  ReviewWithDetails, 
  ReviewReplyWithDetails,
  ReviewStats,
  ReviewEligibility,
  ReplyEligibility 
} from '../types/review.types';
import { 
  CreateReviewRequest, 
  CreateReviewReplyRequest,
  ReviewListResponseDto,
  ReviewStatsResponse 
} from '../dto/review.dto';

export class ReviewRepository {
  constructor(private prisma: PrismaClient) {}

  // ============ REVIEW CREATION ============
  
  async createReview(data: CreateReviewRequest & { userId: number }): Promise<ReviewWithDetails> {
    // Get booking to extract propertyId
    const booking = await this.prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        items: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const propertyId = booking.items[0]?.room?.property?.id;
    if (!propertyId) {
      throw new Error('Property not found for booking');
    }

    return await this.prisma.review.create({
      data: {
        userId: data.userId,
        propertyId: propertyId,
        bookingId: data.bookingId,
        rating: data.rating,
        comment: data.comment || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNo: true,
            checkIn: true,
            checkOut: true,
          },
        },
        reply: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    }) as any;
  }

  // ============ REVIEW REPLY CREATION ============
  
  async createReviewReply(
    reviewId: number, 
    data: CreateReviewReplyRequest & { tenantId: number }
  ): Promise<ReviewReplyWithDetails> {
    return await this.prisma.reviewReply.create({
      data: {
        reviewId,
        tenantId: data.tenantId,
        content: data.content,
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    }) as any;
  }

  // ============ REVIEW QUERIES ============
  
  async getReviews(filters: ReviewFilter): Promise<ReviewListResponseDto> {
    const {
      propertyId,
      userId,
      rating,
      hasComment,
      hasReply,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;
    const where: any = {};

    // Apply filters
    if (propertyId) where.propertyId = propertyId;
    if (userId) where.userId = userId;
    if (rating) where.rating = rating;
    if (hasComment !== undefined) {
      where.comment = hasComment ? { not: null } : null;
    }
    if (hasReply !== undefined) {
      where.reply = hasReply ? { isNot: null } : null;
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Build order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          property: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          booking: {
            select: {
              id: true,
              bookingNo: true,
              checkIn: true,
              checkOut: true,
            },
          },
          reply: {
            include: {
              tenant: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews: reviews as any,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewById(id: number): Promise<ReviewWithDetails | null> {
    return await this.prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        property: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        booking: {
          select: {
            id: true,
            bookingNo: true,
            checkIn: true,
            checkOut: true,
          },
        },
        reply: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    }) as any;
  }

  async getUserReviews(userId: number, page: number = 1, limit: number = 10): Promise<ReviewListResponseDto> {
    return await this.getReviews({
      userId,
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  async getPropertyReviews(propertyId: number, page: number = 1, limit: number = 10): Promise<ReviewListResponseDto> {
    return await this.getReviews({
      propertyId,
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  // ============ REVIEW STATISTICS ============
  
  async getReviewStats(propertyId: number): Promise<ReviewStatsResponse> {
    const [totalReviews, reviews] = await Promise.all([
      this.prisma.review.count({
        where: { propertyId },
      }),
      this.prisma.review.findMany({
        where: { propertyId },
        select: { rating: true },
      }),
    ]);

    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    const ratingDistribution = reviews.reduce((dist, review) => {
      dist[review.rating] = (dist[review.rating] || 0) + 1;
      return dist;
    }, {} as { [key: number]: number });

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingDistribution,
    };
  }

  // ============ REVIEW ELIGIBILITY ============
  
  async checkReviewEligibility(bookingId: number, userId: number): Promise<ReviewEligibility> {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
        items: {
          include: {
            room: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return {
        canReview: false,
        reason: 'Booking not found or does not belong to user',
      };
    }

    if (booking.status !== BookingStatus.completed) {
      return {
        canReview: false,
        reason: 'Booking must be completed before reviewing',
        booking: {
          id: booking.id,
          bookingNo: booking.bookingNo,
          status: booking.status,
          checkOut: booking.checkOut,
          ...(booking.completedAt && { completedAt: booking.completedAt }),
        },
      };
    }

    // Check if review already exists
    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      return {
        canReview: false,
        reason: 'Review already exists for this booking',
        booking: {
          id: booking.id,
          bookingNo: booking.bookingNo,
          status: booking.status,
          checkOut: booking.checkOut,
          ...(booking.completedAt && { completedAt: booking.completedAt }),
        },
      };
    }

    return {
      canReview: true,
      booking: {
        id: booking.id,
        bookingNo: booking.bookingNo,
        status: booking.status,
        checkOut: booking.checkOut,
        ...(booking.completedAt && { completedAt: booking.completedAt }),
      },
    };
  }

  // ============ REPLY ELIGIBILITY ============
  
  async checkReplyEligibility(reviewId: number, tenantId: number): Promise<ReplyEligibility> {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        property: true,
        reply: true,
      },
    });

    if (!review) {
      return {
        canReply: false,
        reason: 'Review not found',
      };
    }

    if (review.property.tenantId !== tenantId) {
      return {
        canReply: false,
        reason: 'Only property owner can reply to reviews',
        review: {
          id: review.id,
          propertyId: review.propertyId,
          hasReply: !!review.reply,
        },
        property: {
          id: review.property.id,
          tenantId: review.property.tenantId,
        },
      };
    }

    if (review.reply) {
      return {
        canReply: false,
        reason: 'Reply already exists for this review',
        review: {
          id: review.id,
          propertyId: review.propertyId,
          hasReply: true,
        },
        property: {
          id: review.property.id,
          tenantId: review.property.tenantId,
        },
      };
    }

    return {
      canReply: true,
      review: {
        id: review.id,
        propertyId: review.propertyId,
        hasReply: false,
      },
      property: {
        id: review.property.id,
        tenantId: review.property.tenantId,
      },
    };
  }

  // ============ REVIEW DELETION ============
  
  async deleteReview(id: number, userId: number): Promise<boolean> {
    const review = await this.prisma.review.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!review) {
      return false;
    }

    await this.prisma.review.delete({
      where: { id },
    });

    return true;
  }

  // ============ REVIEW REPLY DELETION ============
  
  async deleteReviewReply(reviewId: number, tenantId: number): Promise<boolean> {
    const review = await this.prisma.review.findFirst({
      where: {
        id: reviewId,
        property: {
          tenantId,
        },
      },
      include: {
        reply: true,
      },
    });

    if (!review || !review.reply) {
      return false;
    }

    await this.prisma.reviewReply.delete({
      where: { reviewId },
    });

    return true;
  }
}

import { ReportRepository } from '../repository/report.repository';
import { SalesReportRequest, SalesReportResponse, PropertyReportRequest, PropertyReportResponse } from '../dto/report.dto';
import { ApiError } from '../../../shared/utils/api-error';

export class ReportService {
  private reportRepository: ReportRepository;

  constructor(reportRepository: ReportRepository) {
    this.reportRepository = reportRepository;
  }

  async getSalesReport(tenantId: number, filters: SalesReportRequest): Promise<SalesReportResponse> {
    try {
      const { sortBy = 'date', sortOrder = 'desc', page = 1, limit = 10 } = filters;
      
      // Get all sales data
      const [propertyReports, transactionReports, userReports] = await Promise.all([
        this.reportRepository.getSalesReportByProperty(tenantId, filters),
        this.reportRepository.getSalesReportByTransaction(tenantId, filters),
        this.reportRepository.getSalesReportByUser(tenantId, filters)
      ]);
      
      // Combine all reports
      const allReports = [...propertyReports, ...transactionReports, ...userReports];
      
      // Sort reports
      allReports.sort((a, b) => {
        if (sortBy === 'totalSales') {
          return sortOrder === 'asc' ? a.totalSales - b.totalSales : b.totalSales - a.totalSales;
        } else {
          return sortOrder === 'asc' ? 
            new Date(a.date).getTime() - new Date(b.date).getTime() :
            new Date(b.date).getTime() - new Date(a.date).getTime();
        }
      });
      
      // Calculate totals
      const totalSales = allReports.reduce((sum, report) => sum + report.totalSales, 0);
      const totalBookings = allReports.reduce((sum, report) => sum + report.totalBookings, 0);
      const averageBookingValue = totalBookings > 0 ? totalSales / totalBookings : 0;
      
      // Pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReports = allReports.slice(startIndex, endIndex);
      
      return {
        totalSales,
        totalBookings,
        averageBookingValue: Math.round(averageBookingValue * 100) / 100,
        reports: paginatedReports,
        pagination: {
          page,
          limit,
          total: allReports.length,
          totalPages: Math.ceil(allReports.length / limit)
        }
      };
    } catch (error) {
      throw new ApiError('Failed to generate sales report', 500);
    }
  }

  async getPropertyReport(tenantId: number, filters: PropertyReportRequest): Promise<PropertyReportResponse> {
    try {
      return await this.reportRepository.getPropertyReport(tenantId, filters);
    } catch (error) {
      throw new ApiError('Failed to generate property report', 500);
    }
  }
}
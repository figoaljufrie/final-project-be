import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ReportService } from '../services/report.service';
import { errHandle } from '../../../shared/helpers/err-handler';
import { succHandle } from '../../../shared/helpers/succ-handler';

export class ReportController {
  private reportService: ReportService;

  constructor(reportService: ReportService) {
    this.reportService = reportService;
  }

  getSalesReport = async (req: Request, res: Response) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return errHandle(res, 'Validation failed', 400, validationErrors.array());
      }

      const tenantId = (req as any).user.id;
      const filters = {
        propertyId: req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        sortBy: req.query.sortBy as 'date' | 'totalSales' | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined
      };

      const report = await this.reportService.getSalesReport(tenantId, filters);
      return succHandle(res, 'Sales report generated successfully', report);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to generate sales report', 500);
    }
  };

  getPropertyReport = async (req: Request, res: Response) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return errHandle(res, 'Validation failed', 400, validationErrors.array());
      }

      const tenantId = (req as any).user.id;
      const filters = {
        propertyId: req.query.propertyId ? parseInt(req.query.propertyId as string) : undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined
      };

      const report = await this.reportService.getPropertyReport(tenantId, filters);
      return succHandle(res, 'Property report generated successfully', report);
    } catch (error: any) {
      return errHandle(res, error.message || 'Failed to generate property report', 500);
    }
  };
}
import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { ReportValidation } from "../validation/report.validation";
import { AuthMiddleware } from "../../../shared/middleware/auth-middleware";
import { JWTMiddleware } from "../../../shared/middleware/jwt-middleware";
import { RBACMiddleware } from "../../../shared/middleware/rbac-middleware";
import { $Enums } from "../../../generated/prisma";
import { ReportService } from "../services/report.service";
import { ReportRepository } from "../repository/report.repository";
import { prisma } from "../../../shared/utils/prisma";

export class ReportRoutes {
  public router: Router;
  private reportController: ReportController;

  constructor() {
    this.router = Router();
    const reportRepository = new ReportRepository(prisma);
    const reportService = new ReportService(reportRepository);
    this.reportController = new ReportController(reportService);
    this.initializeRoutes();
  }

  private initializeRoutes() {
    const authMiddleware = new AuthMiddleware();
    const jwtMiddleware = new JWTMiddleware();
    const rbacMiddleware = new RBACMiddleware();

    const tenantAccess = [
      jwtMiddleware.verifyToken,
      authMiddleware.authenticate,
      rbacMiddleware.checkRole([$Enums.UserRole.tenant]),
    ];

    // Sales Report
    this.router.get(
      "/sales",
      ...tenantAccess,
      ReportValidation.getSalesReport,
      this.reportController.getSalesReport
    );

    // Property Report
    this.router.get(
      "/property",
      ...tenantAccess,
      ReportValidation.getPropertyReport,
      this.reportController.getPropertyReport
    );

    // Calendar with Bookings (for integration with property calendar)
    this.router.post(
      "/calendar/bookings",
      ...tenantAccess,
      this.reportController.getCalendarWithBookings
    );
  }

  public getRouter(): Router {
    return this.router;
  }
}

import { Router } from 'express';
import { CronController } from '../controllers/cron.controller';
import { AuthMiddleware } from '../../../shared/middleware/auth-middleware';
import { RBACMiddleware } from '../../../shared/middleware/rbac-middleware';
import { $Enums } from '../../../generated/prisma';

export class CronRoutes {
  private router: Router;
  private cronController: CronController;
  private authMiddleware: AuthMiddleware;
  private rbacMiddleware: RBACMiddleware;

  constructor() {
    this.router = Router();
    this.cronController = new CronController();
    this.authMiddleware = new AuthMiddleware();
    this.rbacMiddleware = new RBACMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // All cron routes require tenant authentication
    this.router.use(this.authMiddleware.authenticate);
    this.router.use(this.rbacMiddleware.checkRole([$Enums.UserRole.tenant]));

    // Cron management routes
    this.router.get('/status', this.cronController.getScheduledTasksStatus);
    this.router.post('/stop-all', this.cronController.stopAllTasks);
    this.router.post('/trigger-auto-cancel', this.cronController.triggerAutoCancel);
    
    // Booking-specific cron routes
    this.router.post('/schedule-cancel', this.cronController.scheduleBookingCancel);
    this.router.delete('/booking/:bookingId/tasks', this.cronController.cancelBookingTasks);
  }

  public getRouter(): Router {
    return this.router;
  }
}

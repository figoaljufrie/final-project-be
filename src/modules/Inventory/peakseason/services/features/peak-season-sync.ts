import { AvailabilityRepository } from "@/modules/Inventory/availability/repository/availability-repository";
import { PropertyRepository } from "@/modules/Inventory/property/repository/property-repository";
import { RoomRepository } from "@/modules/Inventory/room/repository/room-repository";
import { invalidatePeakSeasonCaches } from "../core/peak-season-cache";
import { PeakSeasonRepository } from "../../repository/peak-season-repository";
import { PeakSeasonAvailabilityApplier } from "../../helpers/peak-season-availability-applier";

export class PeakSeasonSyncService {
  private availabilityRepository = new AvailabilityRepository();
  private propertyRepository = new PropertyRepository();
  private roomRepository = new RoomRepository() as any;
  private peakSeasonRepository = new PeakSeasonRepository();
  private peakSeasonApplier: PeakSeasonAvailabilityApplier;

  constructor() {
    this.peakSeasonApplier = new PeakSeasonAvailabilityApplier(
      this.propertyRepository,
      this.roomRepository,
      this.availabilityRepository,
      this.peakSeasonRepository
    );
  }

  public async applyAfterCreate(
    tenantId: number,
    createdPeakSeason: any,
    propertyIds: number[]
  ) {
    await this.peakSeasonApplier.applyChanges(createdPeakSeason);
    await invalidatePeakSeasonCaches(tenantId, propertyIds);
  }

  public async applyAfterUpdate(
    tenantId: number,
    updatedPeakSeason: any,
    existing: any,
    propertyIds: number[]
  ) {
    await this.peakSeasonApplier.applyChanges(updatedPeakSeason, existing);
    await invalidatePeakSeasonCaches(tenantId, propertyIds);
  }

  public async applyAfterDelete(
    tenantId: number,
    deletedPeakSeason: any,
    propertyIds: number[]
  ) {
    await this.peakSeasonApplier.applyChanges(deletedPeakSeason, deletedPeakSeason, true);
    await invalidatePeakSeasonCaches(tenantId, propertyIds);
  }
}
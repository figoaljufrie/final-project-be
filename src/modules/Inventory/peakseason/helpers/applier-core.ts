import { AvailabilityRepository } from "../../availability/repository/availability-repository";
import { PropertyRepository } from "../../property/repository/property-repository";
import { RoomRepository } from "../../room/repository/room-repository";
import { PeakSeasonRepository } from "../repository/peak-season-repository";

export class PeakSeasonApplierCore {
  protected propertyRepository: PropertyRepository;
  protected roomRepository: RoomRepository;
  protected availabilityRepository: AvailabilityRepository;
  protected peakSeasonRepository: PeakSeasonRepository;

  constructor(
    propertyRepository: PropertyRepository,
    roomRepository: RoomRepository,
    availabilityRepository: AvailabilityRepository,
    peakSeasonRepository: PeakSeasonRepository
  ) {
    this.propertyRepository = propertyRepository;
    this.roomRepository = roomRepository;
    this.availabilityRepository = availabilityRepository;
    this.peakSeasonRepository = peakSeasonRepository;
  }
}

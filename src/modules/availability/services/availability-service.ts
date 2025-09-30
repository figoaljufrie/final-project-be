import { ApiError } from "../../../shared/utils/api-error";
import { Roomrepository } from "../../room/repository/room-repository";
import { AvailabilityRepository } from "../repository/availability-repository";

export class AvailabilityService {
  private availabilityRepository = new AvailabilityRepository();
  private roomRepository = new Roomrepository();

  public async setAvailability(tenantId: number, payload: any) {
    const room = await this.roomRepository.findById(payload.roomId);
    if (!room) throw new ApiError("Room not found", 404);

    const PropertyRepository = new (
      await import("../../property/repository/property-repository")
    ).PropertyRepository();
    const property = await PropertyRepository.findById(room.propertyId);
    if (!property) throw new ApiError("Property not found", 404);
    if (property.tenantId !== tenantId)
      throw new ApiError("Not authorized", 403);

    const date = new Date(payload.date);
    return this.availabilityRepository.upsert(payload.roomId, date, {
      isAvailable: payload.isAvailable,
      customPrice: payload.customPrice,
      priceModifier: payload.priceModifier,
      reason: payload.reason,
    });
  }

  public async getAvailability(roomId: number, from: Date, to: Date) {
    return this.availabilityRepository.findRange(roomId, from, to);
  }

  public async getByDate(roomId: number, date: Date) {
    return this.availabilityRepository.findByRoomAndDate(roomId, date);
  }
}

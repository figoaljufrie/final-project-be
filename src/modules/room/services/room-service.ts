import { ApiError } from "../../../shared/utils/api-error";
import { Roomrepository } from "../repository/room-repository";

export class RoomService {
  private roomRepository: Roomrepository;

  constructor() {
    this.roomRepository = new Roomrepository();
  }

  public async createRoom(tenantId: number, payload: any) {
    const property = await (
      await import("../../../modules/property/repository/property-repository")
    ).PropertyRepository.prototype.findById.call(
      new (
        await import("../../../modules/property/repository/property-repository")
      ).PropertyRepository(),
      payload.propertyId
    );
    if (!property) throw new ApiError("Property not found", 404);
    if (property.tenantId !== tenantId)
      throw new ApiError("Not Authorized", 403);

    return this.roomRepository.create({
      propertyId: payload.propertyId,
      name: payload.name,
      capacity: payload.capacity,
      basePrice: payload.basePrice,
      description: payload.description ?? null,
      totalUnits: payload.totalUnits ?? 1,
    } as any);
  }

  public async updateRoom(tenantId: number, roomId: number, payload: any) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new ApiError("Room not found", 404);
    const propertyPromise = (
      await import("../../../modules/property/repository/property-repository")
    ).PropertyRepository.prototype.findById.call(
      new (
        await import("../../../modules/property/repository/property-repository")
      ).PropertyRepository(),
      room.propertyId
    );
    const property = await propertyPromise;
    if (!property) throw new ApiError("Property not found", 404);
    if (property.tenantId !== tenantId)
      throw new ApiError("Not Authorized", 403);
    return this.roomRepository.update(roomId, payload);
  }
  public async deleteRoom(tenantId: number, roomId: number) {
    const room = await this.roomRepository.findById(roomId);
    if (!room) throw new ApiError("Room not found", 404);

    const property = await (
      await import("../../property/repository/property-repository")
    ).PropertyRepository.prototype.findById.call(
      new (
        await import("../../property/repository/property-repository")
      ).PropertyRepository(),
      room.propertyId
    );
    if (!property) throw new ApiError("Property not found", 404);
    if (property.tenantId !== tenantId)
      throw new ApiError("Not authorized", 403);

    return this.roomRepository.softDelete(roomId);
  }

  public async getRoomsByProperty(properyId: number) {
    return this.roomRepository.findByProperty(properyId);
  }
}

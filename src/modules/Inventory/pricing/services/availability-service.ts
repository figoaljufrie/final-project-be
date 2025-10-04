import {
  CalculatedPrice,
  calculateFinalRoomPrice,
} from "../../../../shared/helpers/price-calc";
import {
  PeakSeasonDto,
  RoomAvailabilityDto,
  SetAvailabilityBodyDto,
  SetAvailabilityRepoData,
} from "../dto/availability-dto";
import { AvailabilityRepository } from "../repository/availability-repository";

export class AvailabilityService {
  private availabilityRepository = new AvailabilityRepository();

  public async setAvailability(
    roomId: number,
    payload: SetAvailabilityBodyDto
  ) {
    const date = new Date(payload.date);
    date.setHours(0, 0, 0, 0);

    const repoData: SetAvailabilityRepoData = {
      roomId: roomId,
      date: date,
      isAvailable: payload.isAvailable,
      customPrice: payload.customPrice,
      priceModifier: payload.priceModifier,
      reason: payload.reason,
    };

    return this.availabilityRepository.upsert(repoData);
  }

  public async getAvailabilityRange(roomId: number, from: Date, to: Date) {
    return this.availabilityRepository.findRange(roomId, from, to) as Promise<
      RoomAvailabilityDto[]
    >;
  }

  public async getAvailabilityByDate(roomId: number, date: Date) {
    return this.availabilityRepository.findByRoomAndDate(
      roomId,
      date
    ) as Promise<RoomAvailabilityDto | null>;
  }

  public async getBulkAvailabilityForRooms(
    roomIds: number[],
    from: Date,
    to: Date
  ) {
    return this.availabilityRepository.findBulkAvailability(
      roomIds,
      from,
      to
    ) as Promise<RoomAvailabilityDto[]>;
  }

  public getDailyCalculatedPrice(
    basePrice: number,
    availability: RoomAvailabilityDto | null,
    peakSeasons: PeakSeasonDto[]
  ): CalculatedPrice {
    return calculateFinalRoomPrice(basePrice, availability, peakSeasons);
  }
}

import { RoomAvailabilityDto } from "@/modules/Inventory/availability/dto/availability-dto";
import { formatDateKey, toLocalMidnight } from "@/shared/helpers/date-utils";

export function buildAvailabilityMap(
  allAvailability: RoomAvailabilityDto[]
): Map<string, RoomAvailabilityDto> {
  const map = new Map<string, RoomAvailabilityDto>();

  for (const avail of allAvailability) {
    const normalizedDate = toLocalMidnight(new Date(avail.date));
    const key = `${avail.roomId}-${formatDateKey(normalizedDate)}`;
    map.set(key, avail);
  }

  return map;
}

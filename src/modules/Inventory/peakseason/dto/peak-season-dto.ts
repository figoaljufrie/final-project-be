import { $Enums, PeakSeason } from "../../../../generated/prisma";

export interface CreatePeakSeasonDto {
  name: string;
  startDate: string;
  endDate: string;
  changeType: $Enums.PriceChangeType;
  changeValue: number;
  applyToAllProperties: boolean;
  propertyIds?: number[];
}

export interface PeakSeasonRepoCreateDto {
  tenantId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  changeType: $Enums.PriceChangeType;
  changeValue: number;
  applyToAllProperties: boolean;
  propertyIds: number[];
}

export interface UpdatePeakSeasonDto extends Partial<CreatePeakSeasonDto> {}

// ✅ Normalize `PeakSeasonDto` to enforce lowercase at runtime safety level
export type PeakSeasonDto = Omit<PeakSeason, "changeType"> & {
  changeType: Lowercase<$Enums.PriceChangeType>;
};

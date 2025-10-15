import { RoomAvailability, PeakSeason, $Enums } from "../../generated/prisma";

export interface CalculatedPrice {
  available: boolean;
  price: number | null;
}

export function calculateFinalRoomPrice(
  basePrice: number,
  availability: RoomAvailability | null,
  peakSeasons: PeakSeason[] = []
): CalculatedPrice {
  if (availability && availability.isAvailable === false) {
    return { available: false, price: null };
  }

  if (availability && typeof availability.customPrice === "number") {
    return {
      available: true,
      price: Math.round(availability.customPrice),
    };
  }

  let price = basePrice;

  if (availability && typeof availability.priceModifier === "number") {
    price += availability.priceModifier;
  }

  if (peakSeasons.length > 0) {
    let totalPercentageChange = 0;
    let totalNominalChange = 0;

    for (const ps of peakSeasons) {
      if (ps.changeType === $Enums.PriceChangeType.percentage) {
        totalPercentageChange += ps.changeValue;
      } else if (ps.changeType === $Enums.PriceChangeType.nominal) {
        totalNominalChange += ps.changeValue;
      }
    }

    if (totalPercentageChange !== 0) {
      price = price * (1 + totalPercentageChange / 100);
    }

    if (totalNominalChange !== 0) {
      price += totalNominalChange;
    }
  }

  price = Math.max(0, Math.round(price));

  return { available: true, price };
}

export function getPriceBreakdown(
  basePrice: number,
  availability: RoomAvailability | null,
  peakSeasons: PeakSeason[] = []
): {
  basePrice: number;
  customPrice: number | null;
  priceModifier: number | null;
  peakSeasonAdjustments: {
    percentage: number;
    nominal: number;
    names: string[];
  };
  calculationSteps: string[];
  finalPrice: number;
} {
  const steps: string[] = [];

  if (availability?.customPrice) {
    steps.push(`Custom Price Override: $${availability.customPrice}`);
    return {
      basePrice,
      customPrice: availability.customPrice,
      priceModifier: null,
      peakSeasonAdjustments: { percentage: 0, nominal: 0, names: [] },
      calculationSteps: steps,
      finalPrice: Math.round(availability.customPrice),
    };
  }

  let price = basePrice;
  steps.push(`Base Price: $${basePrice}`);

  if (availability?.priceModifier) {
    price += availability.priceModifier;
    steps.push(
      `Price Modifier: ${availability.priceModifier >= 0 ? "+" : ""}$${
        availability.priceModifier
      } → $${price}`
    );
  }

  let totalPercentage = 0;
  let totalNominal = 0;
  const seasonNames: string[] = [];

  if (peakSeasons.length > 0) {
    for (const ps of peakSeasons) {
      seasonNames.push(ps.name);
      if (ps.changeType === $Enums.PriceChangeType.percentage) {
        totalPercentage += ps.changeValue;
      } else if (ps.changeType === $Enums.PriceChangeType.nominal) {
        totalNominal += ps.changeValue;
      }
    }

    // Apply percentage
    if (totalPercentage !== 0) {
      const beforePercentage = price;
      price = price * (1 + totalPercentage / 100);
      steps.push(
        `Peak Season Percentage: ${
          totalPercentage > 0 ? "+" : ""
        }${totalPercentage}% → $${beforePercentage} × ${
          1 + totalPercentage / 100
        } = $${Math.round(price)}`
      );
    }

    if (totalNominal !== 0) {
      const beforeNominal = price;
      price += totalNominal;
      steps.push(
        `Peak Season Nominal: ${
          totalNominal >= 0 ? "+" : ""
        }$${totalNominal} → $${Math.round(
          beforeNominal
        )} + $${totalNominal} = $${Math.round(price)}`
      );
    }
  }

  const finalPrice = Math.max(0, Math.round(price));
  steps.push(`Final Price: $${finalPrice}`);

  return {
    basePrice,
    customPrice: null,
    priceModifier: availability?.priceModifier ?? null,
    peakSeasonAdjustments: {
      percentage: totalPercentage,
      nominal: totalNominal,
      names: seasonNames,
    },
    calculationSteps: steps,
    finalPrice,
  };
}

export function formatPeakSeasonAdjustment(peakSeasons: PeakSeason[]): string {
  if (!peakSeasons || peakSeasons.length === 0) {
    return "No peak season";
  }

  const adjustments: string[] = [];
  let totalPercentage = 0;
  let totalNominal = 0;

  for (const ps of peakSeasons) {
    if (ps.changeType === $Enums.PriceChangeType.percentage) {
      totalPercentage += ps.changeValue;
    } else if (ps.changeType === $Enums.PriceChangeType.nominal) {
      totalNominal += ps.changeValue;
    }
  }

  if (totalPercentage !== 0) {
    adjustments.push(`${totalPercentage > 0 ? "+" : ""}${totalPercentage}%`);
  }
  if (totalNominal !== 0) {
    adjustments.push(`${totalNominal >= 0 ? "+" : ""}$${totalNominal}`);
  }

  return adjustments.join(", ");
}

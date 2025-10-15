export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // always local date
}

export function dateFromKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y!, m! - 1, d); // always local midnight, no UTC shift
}

export function toLocalMidnight(date: Date): Date {
  const adjusted = new Date(date);
  adjusted.setHours(0, 0, 0, 0);
  return adjusted;
}

export function normalizeRange(start: Date, end: Date) {
  return {
    start: toLocalMidnight(start),
    end: toLocalMidnight(end),
  };
}
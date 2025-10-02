export function safeNumber(val: any): number | undefined {
  if (!val) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}

export function safeString(val: any): string | undefined {
  return val ? String(val) : undefined;
}

export function safeDate(val: any): Date | undefined {
  return val ? new Date(val as string) : undefined;
}

export function validateEnum<T extends object>(
  param: any,
  enumValues: T
): T[keyof T] | undefined {
  const val = safeString(param);
  if (!val) return undefined;

  const values = Object.values(enumValues);
  if (values.includes(val as T[keyof T])) {
    return val as T[keyof T];
  }
  return undefined;
}

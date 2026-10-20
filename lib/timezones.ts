const COMMON = [
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Anchorage",
  "Pacific/Honolulu", "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Kolkata", "Asia/Tokyo", "Australia/Sydney",
];

export function deviceZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "";
  }
}

export function zoneOptions(current: string): string[] {
  const zones = new Set([deviceZone(), current, ...COMMON].filter(Boolean));
  return [...zones];
}

export function cityOf(zone: string): string {
  return zone.split("/").pop()?.replace(/_/g, " ") ?? zone;
}

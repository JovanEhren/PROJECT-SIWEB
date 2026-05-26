export const DEMO_TRACKING_DURATION_MS = {
  EKSPRES: 1 * 60 * 1000,
  REGULER: 3 * 60 * 1000
} as const;

export const TRACKING_REFRESH_INTERVAL_MS = 3000;
export const ADMIN_HISTORY_REFRESH_INTERVAL_MS = TRACKING_REFRESH_INTERVAL_MS;

export function getDemoTrackingDurationMs(service: "EKSPRES" | "REGULER") {
  return DEMO_TRACKING_DURATION_MS[service];
}

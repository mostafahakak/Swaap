/** Normalize API + legacy dummy event shapes for UI. */
export function displayEventMeta(e) {
  if (!e) return e;
  return {
    ...e,
    date: e.startDate ?? e.date,
    time: e.startTime ?? e.time,
    industry: e.category ?? e.industry,
    swaapStream: e.swaapStream ?? "Swaap Connect",
    hostUserId: e.hostUserId ?? null,
  };
}

export function isRemoteImage(img) {
  return typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://"));
}

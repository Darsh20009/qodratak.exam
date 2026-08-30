const DEVICE_STORAGE_KEY = "qudratak-device-id";

export function getDeviceId() {
  const existing = localStorage.getItem(DEVICE_STORAGE_KEY);
  if (existing && /^[a-zA-Z0-9_-]{16,128}$/.test(existing)) return existing;

  const generated = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "")
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(DEVICE_STORAGE_KEY, generated);
  return generated;
}
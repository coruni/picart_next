import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { getCookie } from "./cookies";
import {
  DEVICE_ID_COOKIE_NAME,
  persistClientDeviceId,
} from "./request-auth";

let fpPromise: Promise<string> | null = null;

async function generateFingerprint(): Promise<string> {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error("Failed to generate device fingerprint:", error);
    return "";
  }
}

export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") {
    return "";
  }

  const cachedFingerprint = getCookie(DEVICE_ID_COOKIE_NAME);
  if (cachedFingerprint) {
    return cachedFingerprint;
  }

  if (!fpPromise) {
    fpPromise = generateFingerprint().then((fingerprint) => {
      if (fingerprint) {
        persistClientDeviceId(fingerprint);
      }
      return fingerprint;
    });
  }

  return fpPromise;
}

export function getDeviceFingerprintSync(): string | null {
  return getCookie(DEVICE_ID_COOKIE_NAME);
}

export function hasDeviceFingerprint(): boolean {
  return getCookie(DEVICE_ID_COOKIE_NAME) !== null;
}

export function initDeviceFingerprint(): void {
  if (typeof window !== "undefined") {
    setTimeout(() => {
      getDeviceFingerprint().catch((error) => {
        console.error("Failed to initialize device fingerprint:", error);
      });
    }, 0);
  }
}

import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { getCookie, setCookie } from "./cookies";

const FINGERPRINT_COOKIE_NAME = "device_fingerprint";
const FINGERPRINT_EXPIRY_DAYS = 3650; // 10年，永久保存

let fpPromise: Promise<string> | null = null;

/**
 * 生成新的设备指纹（使用浏览器指纹）
 */
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

/**
 * 获取设备唯一指纹（异步）
 * 优先从 cookie 获取，不存在则生成新的并永久保存
 */
export async function getDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") {
    return "";
  }

  // 先检查 cookie 中是否已存在
  const cachedFingerprint = getCookie(FINGERPRINT_COOKIE_NAME);
  if (cachedFingerprint) {
    // 已存在，直接返回
    return cachedFingerprint;
  }

  // 不存在，生成新的指纹
  if (!fpPromise) {
    fpPromise = generateFingerprint().then((fingerprint) => {
      if (fingerprint) {
        // 永久保存到 cookie（10年过期）
        const expires = new Date();
        expires.setDate(expires.getDate() + FINGERPRINT_EXPIRY_DAYS);
        setCookie(FINGERPRINT_COOKIE_NAME, fingerprint, { 
          expires,
          path: "/",
          sameSite: "Lax",
        });
      }
      return fingerprint;
    });
  }

  return fpPromise;
}

/**
 * 同步获取设备指纹（从 cookie）
 * 用于需要立即获取指纹的场景（如请求拦截器）
 */
export function getDeviceFingerprintSync(): string | null {
  return getCookie(FINGERPRINT_COOKIE_NAME);
}

/**
 * 初始化设备指纹
 * 在应用启动时调用，确保指纹已生成
 * 如果已存在则不会重新生成
 */
export function initDeviceFingerprint(): void {
  if (typeof window !== "undefined") {
    // 延迟初始化，避免阻塞首次渲染
    setTimeout(() => {
      getDeviceFingerprint().catch((error) => {
        console.error("Failed to initialize device fingerprint:", error);
      });
    }, 0);
  }
}

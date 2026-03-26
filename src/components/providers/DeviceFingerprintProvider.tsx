"use client";

import { useEffect } from "react";
import { getDeviceFingerprint, hasDeviceFingerprint } from "@/lib/fingerprint";
import { useDeviceStore } from "@/stores/useDeviceStore";
import { getCookie } from "@/lib/cookies";

const DEVICE_ID_COOKIE_NAME = "device_fingerprint";

/**
 * 设备指纹提供者
 * 在客户端初始化时确保设备指纹存在
 * 优先使用服务端已生成的设备ID（从cookie读取）
 * 如果不存在才生成新的
 */
export function DeviceFingerprintProvider() {
  const setDeviceId = useDeviceStore((state) => state.setDeviceId);

  useEffect(() => {
    // 先检查 cookie 中是否已有设备ID（可能由服务端生成）
    const existingDeviceId = getCookie(DEVICE_ID_COOKIE_NAME);
    if (existingDeviceId) {
      // 已存在，同步到 Store
      setDeviceId(existingDeviceId);
      return;
    }

    // 不存在，在客户端生成设备指纹
    getDeviceFingerprint()
      .then((deviceId) => {
        if (deviceId) {
          setDeviceId(deviceId);
        }
      })
      .catch((error) => {
        console.error("Failed to initialize device fingerprint:", error);
      });
  }, [setDeviceId]);

  return null;
}

"use client";

import { useEffect } from "react";
import { getDeviceFingerprint } from "@/lib/fingerprint";

/**
 * 设备指纹提供者
 * 在客户端初始化时生成真实的设备指纹，替换服务端的临时 ID
 */
export function DeviceFingerprintProvider() {
  useEffect(() => {
    // 在客户端生成真实的设备指纹
    getDeviceFingerprint().catch((error) => {
      console.error("Failed to initialize device fingerprint:", error);
    });
  }, []);

  return null;
}

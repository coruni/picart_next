"use client";

import { useEffect } from "react";
import { getDeviceFingerprint } from "@/lib/fingerprint";

/**
 * 设备指纹提供者
 * 在客户端初始化时生成设备指纹并持久化存储到Cookie中
 * 设备ID一旦生成，无论是否登录都会随请求携带
 * 服务端绝不生成临时设备ID，只使用客户端已生成的设备ID
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

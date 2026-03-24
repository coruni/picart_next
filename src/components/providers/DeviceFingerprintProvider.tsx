"use client";

import { useEffect } from "react";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { useDeviceStore } from "@/stores/useDeviceStore";

/**
 * 设备指纹提供者
 * 在客户端初始化时生成设备指纹并持久化存储到Cookie和Store中
 * 设备ID一旦生成，无论是否登录都会随请求携带
 * 服务端绝不生成临时设备ID，只使用客户端已生成的设备ID
 */
export function DeviceFingerprintProvider() {
  const setDeviceId = useDeviceStore((state) => state.setDeviceId);

  useEffect(() => {
    // 在客户端生成真实的设备指纹
    getDeviceFingerprint()
      .then((deviceId) => {
        if (deviceId) {
          // 同时存入 Store，方便快速读取
          setDeviceId(deviceId);
        }
      })
      .catch((error) => {
        console.error("Failed to initialize device fingerprint:", error);
      });
  }, [setDeviceId]);

  return null;
}

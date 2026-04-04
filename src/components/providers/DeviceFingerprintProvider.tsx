"use client";

import { useEffect } from "react";
import { getCookie } from "@/lib/cookies";
import { getDeviceFingerprint } from "@/lib/fingerprint";
import { DEVICE_ID_COOKIE_NAME } from "@/lib/request-auth";
import { useDeviceStore } from "@/stores/useDeviceStore";

export function DeviceFingerprintProvider() {
  const setDeviceId = useDeviceStore((state) => state.setDeviceId);

  useEffect(() => {
    const existingDeviceId = getCookie(DEVICE_ID_COOKIE_NAME);
    if (existingDeviceId) {
      setDeviceId(existingDeviceId);
      return;
    }

    getDeviceFingerprint()
      .then((deviceId) => {
        if (deviceId) {
          setDeviceId(deviceId);
        }
      })
      .catch((error) => {
        console.error("Failed to initialize device fingerprint:", error);
      });
    // setDeviceId 是稳定的，不加入依赖数组避免重复执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

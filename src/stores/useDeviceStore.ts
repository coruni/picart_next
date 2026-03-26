import { create } from "zustand";
import { persist } from "zustand/middleware";
import { removeCookie } from "@/lib/cookies";
import {
  DEVICE_ID_COOKIE_NAME,
  persistClientDeviceId,
} from "@/lib/request-auth";

interface DeviceState {
  deviceId: string | null;
  setDeviceId: (deviceId: string) => void;
  clearDeviceId: () => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      deviceId: null,

      setDeviceId: (deviceId) => {
        persistClientDeviceId(deviceId);
        set({
          deviceId,
        });
      },

      clearDeviceId: () => {
        if (typeof window !== "undefined") {
          removeCookie(DEVICE_ID_COOKIE_NAME, {
            path: "/",
            sameSite: "Lax",
          });
        }

        set({
          deviceId: null,
        });
      },
    }),
    {
      name: "device-storage",
      partialize: (state) => ({
        deviceId: state.deviceId,
      }),
    }
  )
);

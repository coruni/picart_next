import { create } from "zustand";
import { persist } from "zustand/middleware";

interface DeviceState {
  deviceId: string | null;
  setDeviceId: (deviceId: string) => void;
  clearDeviceId: () => void;
}

export const useDeviceStore = create<DeviceState>()(
  persist(
    (set) => ({
      deviceId: null,

      setDeviceId: (deviceId) =>
        set({
          deviceId,
        }),

      clearDeviceId: () =>
        set({
          deviceId: null,
        }),
    }),
    {
      name: "device-storage",
      partialize: (state) => ({
        deviceId: state.deviceId,
      }),
    }
  )
);

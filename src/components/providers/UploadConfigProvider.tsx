"use client";

import type { UploadControllerGetUploadConfigResponses } from "@/api/types.gen";
import { createContext, useContext, type ReactNode } from "react";

// 使用 API 生成的类型
type UploadConfig = UploadControllerGetUploadConfigResponses[200]["data"];

interface UploadConfigContextValue {
  config: UploadConfig | null;
}

const UploadConfigContext = createContext<UploadConfigContextValue>({
  config: null,
});

interface UploadConfigProviderProps {
  children: ReactNode;
  config: UploadConfig | null;
}

export function UploadConfigProvider({ children, config }: UploadConfigProviderProps) {
  return (
    <UploadConfigContext.Provider value={{ config }}>
      {children}
    </UploadConfigContext.Provider>
  );
}

export function useUploadConfig() {
  const context = useContext(UploadConfigContext);
  if (!context) {
    throw new Error("useUploadConfig must be used within UploadConfigProvider");
  }
  return context;
}

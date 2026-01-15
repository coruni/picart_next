"use client";

import { useAppStore } from "@/stores";

export function ThemeSwitcher() {
  const { theme, setTheme } = useAppStore();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
      className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
    >
      <option value="light">浅色</option>
      <option value="dark">深色</option>
      <option value="system">跟随系统</option>
    </select>
  );
}

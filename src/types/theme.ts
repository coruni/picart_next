export type ThemeMode = "light" | "dark" | "system";

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  card: string;
  cardForeground: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}

export interface ThemeConfig {
  light: ThemeColors;
  dark: ThemeColors;
}
